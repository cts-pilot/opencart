import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { ProductService } from '../product.service';
import { SellerService } from '../seller.service';
import { Category, OrderItem, Product, Review } from '../api.types';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-seller',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seller.component.html',
  styleUrl: './seller.component.css'
})
export class SellerComponent implements OnInit {
  products: Product[] = [];
  orders: OrderItem[] = [];
  categories: Category[] = [];
  reviews: Review[] = [];
  topReviews: Review[] = [];
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
      next: (categories) => {
        this.categories = categories;
      },
      error: () => (this.message = 'Unable to load categories.')
    });
  }

  loadProducts(): void {
    this.sellerService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loadTopReviews();
      },
      error: () => (this.message = 'Unable to load your products.')
    });
  }

  loadOrders(): void {
    this.sellerService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
      },
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

  editProduct(product: Product): void {
    this.router.navigate(['/seller/products'], {
      queryParams: { productId: product.productId }
    });
  }

  get totalRevenue(): number {
    return this.orders.reduce((sum, order) => {
      const price = order.product?.price ?? 0;
      return sum + price * order.qty;
    }, 0);
  }

  get categoryBreakdown(): Array<{ label: string; value: number }> {
    if (!this.products.length || !this.categories.length) {
      return [];
    }

    const counts = new Map<number, number>();
    this.products.forEach((product) => {
      const categoryId = product.category?.categoryId;
      if (!categoryId) {
        return;
      }
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    });

    return this.categories
      .map((category) => ({
        label: category.categoryName,
        value: counts.get(category.categoryId) ?? 0
      }))
      .filter((entry) => entry.value > 0);
  }

  get orderStatusBreakdown(): Array<{ label: string; value: number }> {
    if (!this.orders.length) {
      return [];
    }

    const statusCounts = new Map<string, number>();
    this.orders.forEach((order) => {
      const status = order.status ?? 'UNKNOWN';
      statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    });

    return Array.from(statusCounts.entries()).map(([label, value]) => ({
      label,
      value
    }));
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

  private loadTopReviews(): void {
    if (!this.products.length) {
      this.topReviews = [];
      return;
    }

    const reviewRequests = this.products.map((product) =>
      this.sellerService.getProductReviews(product.productId).pipe(catchError(() => of([])))
    );

    forkJoin(reviewRequests).subscribe({
      next: (responses) => {
        const allReviews = responses.flat();

        this.topReviews = allReviews
          .sort((a, b) => (b.reviewId ?? 0) - (a.reviewId ?? 0))
          .slice(0, 10);
      },
      error: () => {
        this.topReviews = [];
      }
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
