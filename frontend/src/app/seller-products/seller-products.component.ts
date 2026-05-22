import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { Category, Product } from '../api.types';
import { ProductService } from '../product.service';
import { SellerService } from '../seller.service';
import { OfferService } from '../offer.service';

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seller-products.component.html',
  styleUrl: './seller-products.component.css'
})
export class SellerProductsComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  isLoading = true;
  errorMessage = '';
  selectedCategoryId: number | null = null;
  searchTerm = '';
  stockFilter: 'ALL' | 'IN' | 'LOW' | 'OUT' = 'ALL';

  // Product modal
  productModalOpen = false;
  editingProductId: number | null = null;
  productName = '';
  productUrl = '';
  price: number | null = null;
  stock: number | null = null;
  categoryId: number | null = null;
  private pendingEditId: number | null = null;

  // Offer modal
  offerModalOpen = false;
  offerProductId: number | null = null;
  offerDiscount: number | null = null;
  offerValidUntil = '';
  offerError = '';
  isSavingOffer = false;

  constructor(
    private sellerService: SellerService,
    private productService: ProductService,
    private offerService: OfferService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const id = params.get('productId');
      this.pendingEditId = id ? Number(id) : null;
      if (this.pendingEditId && this.products.length) {
        const match = this.products.find((p) => p.productId === this.pendingEditId);
        if (match) this.startEdit(match);
      }
    });
    this.loadProducts();
    this.productService.getCategories().subscribe((categories) => (this.categories = categories));
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadProducts(): void {
    this.isLoading = true;
    this.sellerService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        if (this.pendingEditId) {
          const match = this.products.find((p) => p.productId === this.pendingEditId);
          if (match) this.startEdit(match);
        }
        this.isLoading = false;
      },
      error: () => {
        this.products = [];
        this.isLoading = false;
      }
    });
  }

  // ===== Product modal =====
  openAddProduct(): void {
    this.resetForm();
    this.productModalOpen = true;
  }

  startEdit(product: Product): void {
    this.editingProductId = product.productId;
    this.productName = product.productName;
    this.productUrl = product.productUrl;
    this.price = product.price;
    this.stock = product.stock;
    this.categoryId = product.category?.categoryId ?? null;
    this.productModalOpen = true;
  }

  closeProductModal(): void {
    this.productModalOpen = false;
    this.resetForm();
  }

  resetForm(): void {
    this.editingProductId = null;
    this.productName = '';
    this.productUrl = '';
    this.price = null;
    this.stock = null;
    this.categoryId = null;
    this.errorMessage = '';
  }

  saveProduct(): void {
    this.errorMessage = '';
    if (!this.productName || !this.productUrl || this.price === null || this.stock === null || !this.categoryId) {
      this.errorMessage = 'Please fill all product fields.';
      return;
    }

    const payload = {
      productName: this.productName,
      productUrl: this.productUrl,
      price: this.price,
      stock: this.stock,
      categoryId: this.categoryId
    };

    const request$ = this.editingProductId
      ? this.sellerService.updateProduct(this.editingProductId, payload)
      : this.sellerService.addProduct(payload);

    request$.subscribe({
      next: () => {
        this.closeProductModal();
        this.loadProducts();
      },
      error: () => (this.errorMessage = 'Unable to save product.')
    });
  }

  deleteProduct(productId: number): void {
    this.sellerService.deleteProduct(productId).subscribe(() => this.loadProducts());
  }

  updateStock(product: Product, stock: number): void {
    if (stock < 0) return;
    this.sellerService.updateStock(product.productId, stock).subscribe(() => this.loadProducts());
  }

  // ===== Offer modal (backend-backed) =====
  openAddOffer(): void {
    this.offerProductId = null;
    this.offerDiscount = null;
    this.offerValidUntil = '';
    this.offerError = '';
    this.offerModalOpen = true;
  }

  closeOfferModal(): void {
    this.offerModalOpen = false;
    this.isSavingOffer = false;
  }

  saveOffer(): void {
    this.offerError = '';
    if (!this.offerProductId) {
      this.offerError = 'Pick a product to apply the offer to.';
      return;
    }
    if (!this.offerDiscount || this.offerDiscount <= 0 || this.offerDiscount > 90) {
      this.offerError = 'Discount must be between 1 and 90%.';
      return;
    }
    if (!this.offerValidUntil) {
      this.offerError = 'Choose an expiry date.';
      return;
    }

    this.isSavingOffer = true;
    this.sellerService
      .updateOffer(this.offerProductId, Number(this.offerDiscount), this.offerValidUntil)
      .subscribe({
        next: () => {
          this.closeOfferModal();
          this.loadProducts();
        },
        error: (err) => {
          this.isSavingOffer = false;
          this.offerError = err?.error?.error || 'Unable to save offer.';
        }
      });
  }

  removeOffer(product: Product): void {
    this.sellerService.updateOffer(product.productId, null, null).subscribe(() => this.loadProducts());
  }

  offerFor(product: Product) {
    return this.offerService.forProduct(product);
  }

  // ===== Filtering / stats =====
  get filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.products.filter((p) => {
      if (this.selectedCategoryId && p.category?.categoryId !== this.selectedCategoryId) return false;
      const stock = p.stock ?? 0;
      if (this.stockFilter === 'IN' && stock <= 5) return false;
      if (this.stockFilter === 'LOW' && (stock === 0 || stock > 5)) return false;
      if (this.stockFilter === 'OUT' && stock !== 0) return false;
      if (term && !p.productName.toLowerCase().includes(term)) return false;
      return true;
    });
  }

  get totalProducts(): number { return this.products.length; }
  get inStockCount(): number { return this.products.filter((p) => (p.stock ?? 0) > 5).length; }
  get lowStockCount(): number {
    return this.products.filter((p) => {
      const s = p.stock ?? 0;
      return s > 0 && s <= 5;
    }).length;
  }
  get outOfStockCount(): number { return this.products.filter((p) => (p.stock ?? 0) === 0).length; }

  stockStatus(stock: number): { label: string; cls: string } {
    if (stock === 0) return { label: 'Out of stock', cls: 'st-out' };
    if (stock <= 5) return { label: 'Low stock', cls: 'st-low' };
    return { label: 'In stock', cls: 'st-in' };
  }

  discountedPrice(product: Product): number {
    return this.offerService.discountedPrice(product);
  }
}