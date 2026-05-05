import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ProductService } from '../product.service';
import { SellerService } from '../seller.service';
import { Category, OrderItem, Product, Review } from '../api.types';

@Component({
  selector: 'app-seller',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller.component.html',
  styleUrl: './seller.component.css'
})
export class SellerComponent implements OnInit {
  activeTab: 'products' | 'orders' | 'reviews' | 'settings' = 'products';
  products: Product[] = [];
  orders: OrderItem[] = [];
  categories: Category[] = [];
  reviews: Review[] = [];
  selectedCategoryId: number | null = null;

  productName = '';
  productUrl = '';
  price: number | null = null;
  stock: number | null = null;
  categoryId: number | null = null;
  shopName = '';
  message = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private sellerService: SellerService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'seller') {
      this.router.navigate(['/login']);
      return;
    }
    this.loadCategories();
    this.loadProducts();
    this.loadOrders();
    this.loadProfile();
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => (this.categories = categories),
      error: () => (this.message = 'Unable to load categories.')
    });
  }

  loadProducts(): void {
    this.sellerService.getProducts().subscribe({
      next: (products) => (this.products = products),
      error: () => (this.message = 'Unable to load your products.')
    });
  }

  loadOrders(): void {
    this.sellerService.getOrders().subscribe({
      next: (orders) => (this.orders = orders),
      error: () => (this.message = 'Unable to load orders.')
    });
  }

  loadProfile(): void {
    this.sellerService.getProfile().subscribe({
      next: (profile) => (this.shopName = profile.shopName ?? ''),
      error: () => (this.message = 'Unable to load seller profile.')
    });
  }

  addProduct(): void {
    if (!this.productName || !this.productUrl || this.price === null || this.stock === null || this.categoryId === null) {
      this.message = 'Please fill all product fields.';
      return;
    }

    this.sellerService
      .addProduct({
        productName: this.productName,
        productUrl: this.productUrl,
        price: this.price,
        stock: this.stock,
        categoryId: this.categoryId
      })
      .subscribe({
        next: () => {
          this.message = 'Product added.';
          this.productName = '';
          this.productUrl = '';
          this.price = null;
          this.stock = null;
          this.categoryId = null;
          this.loadProducts();
        },
        error: () => (this.message = 'Unable to add product.')
      });
  }

  updateStock(product: Product, stockValue: number): void {
    const stock = Number(stockValue);
    if (Number.isNaN(stock)) {
      this.message = 'Invalid stock value.';
      return;
    }
    this.sellerService.updateStock(product.productId, stock).subscribe({
      next: () => this.loadProducts(),
      error: () => (this.message = 'Unable to update stock.')
    });
  }

  deleteProduct(productId: number): void {
    this.sellerService.deleteProduct(productId).subscribe({
      next: () => this.loadProducts(),
      error: () => (this.message = 'Unable to delete product.')
    });
  }

  get filteredProducts(): Product[] {
    if (!this.selectedCategoryId) {
      return this.products;
    }

    return this.products.filter(
      (product) => product.category?.categoryId === this.selectedCategoryId
    );
  }

  updateOrderStatus(orderItemId: number, status: string): void {
    this.sellerService.updateOrderStatus(orderItemId, status).subscribe({
      next: () => this.loadOrders(),
      error: () => (this.message = 'Unable to update order status.')
    });
  }

  loadReviews(productIdValue: number | string): void {
    const productId = Number(productIdValue);
    if (Number.isNaN(productId)) {
      this.message = 'Select a product to load reviews.';
      return;
    }
    this.sellerService.getProductReviews(productId).subscribe({
      next: (reviews) => (this.reviews = reviews),
      error: () => (this.message = 'Unable to load reviews.')
    });
  }

  updateShopName(): void {
    if (!this.shopName) {
      this.message = 'Shop name is required.';
      return;
    }
    this.sellerService.updateShopName(this.shopName).subscribe({
      next: () => (this.message = 'Shop name updated.'),
      error: () => (this.message = 'Unable to update shop name.')
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
