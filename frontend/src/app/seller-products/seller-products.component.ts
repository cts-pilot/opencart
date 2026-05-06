import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Category, Product } from '../api.types';
import { ProductService } from '../product.service';
import { SellerService } from '../seller.service';

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

  editingProductId: number | null = null;
  productName = '';
  productUrl = '';
  price: number | null = null;
  stock: number | null = null;
  categoryId: number | null = null;
  private pendingEditId: number | null = null;

  constructor(
    private sellerService: SellerService,
    private productService: ProductService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const id = params.get('productId');
      this.pendingEditId = id ? Number(id) : null;
      if (this.pendingEditId && this.products.length) {
        const match = this.products.find((product) => product.productId === this.pendingEditId);
        if (match) {
          this.startEdit(match);
        }
      }
    });
    this.loadProducts();
    this.productService.getCategories().subscribe((categories) => (this.categories = categories));
  }

  loadProducts(): void {
    this.isLoading = true;
    this.sellerService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        if (this.pendingEditId) {
          const match = this.products.find((product) => product.productId === this.pendingEditId);
          if (match) {
            this.startEdit(match);
          }
        }
        this.isLoading = false;
      },
      error: () => {
        this.products = [];
        this.isLoading = false;
      }
    });
  }

  startEdit(product: Product): void {
    this.editingProductId = product.productId;
    this.productName = product.productName;
    this.productUrl = product.productUrl;
    this.price = product.price;
    this.stock = product.stock;
    this.categoryId = product.category?.categoryId ?? null;
  }

  resetForm(): void {
    this.editingProductId = null;
    this.productName = '';
    this.productUrl = '';
    this.price = null;
    this.stock = null;
    this.categoryId = null;
  }

  get filteredProducts(): Product[] {
    if (!this.selectedCategoryId) {
      return this.products;
    }

    return this.products.filter(
      (product) => product.category?.categoryId === this.selectedCategoryId
    );
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
        this.resetForm();
        this.loadProducts();
      },
      error: () => {
        this.errorMessage = 'Unable to save product.';
      }
    });
  }

  deleteProduct(productId: number): void {
    this.sellerService.deleteProduct(productId).subscribe(() => this.loadProducts());
  }

  updateStock(product: Product, stock: number): void {
    if (stock < 0) {
      return;
    }
    this.sellerService.updateStock(product.productId, stock).subscribe(() => this.loadProducts());
  }
}