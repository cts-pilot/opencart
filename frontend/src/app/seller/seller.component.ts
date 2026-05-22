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
      const price = order.unitPrice != null ? order.unitPrice : (order.product?.price ?? 0);
      return sum + price * order.qty;
    }, 0);
  }

  get currentMonthLabel(): string {
    return new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  get uniqueCustomers(): number {
    const ids = new Set<string>();
    this.orders.forEach((o) => {
      const id = o.order?.user?.userId || o.order?.user?.email;
      if (id) ids.add(id);
    });
    return ids.size;
  }

  get lowStockCount(): number {
    return this.products.filter((p) => (p.stock ?? 0) <= 5).length;
  }

  get weeklyRevenue(): Array<{ label: string; height: number; peak: boolean }> {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const totals = new Array(7).fill(0);

    this.orders.forEach((o) => {
      const created = o.order?.createdAt;
      if (!created) return;
      const d = new Date(created);
      if (Number.isNaN(d.getTime())) return;
      const idx = (d.getDay() + 6) % 7;
      totals[idx] += this.orderAmount(o);
    });

    const max = Math.max(...totals, 1);
    const heights = totals.map((t) => Math.max(18, Math.round((t / max) * 100)));
    const peakValue = Math.max(...totals);

    return days.map((label, i) => ({
      label,
      height: totals[i] === 0 && peakValue === 0 ? this.fallbackHeights[i] : heights[i],
      peak: peakValue > 0 && totals[i] === peakValue
    }));
  }

  private fallbackHeights = [55, 38, 95, 75, 90, 50, 65];

  get topProducts(): Array<{ name: string; emoji: string; color: string; value: number; percent: number }> {
    const colors = ['#7c3aed', '#10b981', '#d97706', '#3b82f6', '#ec4899'];
    const emojis = ['👟', '👕', '🎒', '🎧', '⌚'];

    const map = new Map<number, { name: string; value: number }>();
    this.orders.forEach((o) => {
      const id = o.product?.productId;
      if (id == null) return;
      const value = this.orderAmount(o);
      const existing = map.get(id);
      if (existing) existing.value += value;
      else map.set(id, { name: o.product?.productName ?? 'Unknown', value });
    });

    const sorted = Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 4);
    const max = sorted[0]?.value || 1;

    return sorted.map((p, i) => ({
      name: p.name,
      emoji: emojis[i % emojis.length],
      color: colors[i % colors.length],
      value: p.value,
      percent: Math.max(8, Math.round((p.value / max) * 100))
    }));
  }

  get recentOrders() {
    return [...this.orders]
      .sort((a, b) => (b.orderItemId ?? 0) - (a.orderItemId ?? 0))
      .slice(0, 5);
  }

  orderShortId(order: OrderItem): string {
    const id = order.orderItemId ?? 0;
    return (4820 + Number(id)).toString().slice(-4);
  }

  customerShortName(order: OrderItem): string {
    const fname = order.order?.user?.firstName;
    const lname = order.order?.user?.lastName;
    if (!fname && !lname) return '—';
    const last = lname ? ` ${lname.charAt(0)}.` : '';
    return `${fname ?? ''}${last}`.trim();
  }

  orderAmount(order: OrderItem): number {
    const unit = order.unitPrice != null ? order.unitPrice : (order.product?.price ?? 0);
    return unit * (order.qty ?? 0);
  }

  statusLabel(status?: string): string {
    if (!status) return '—';
    const s = status.toUpperCase();
    return s.charAt(0) + s.slice(1).toLowerCase();
  }

  statusClass(status?: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'DELIVERED') return 'st-delivered';
    if (s === 'SHIPPED') return 'st-shipped';
    if (s === 'PENDING') return 'st-pending';
    if (s === 'CANCELLED') return 'st-cancelled';
    return 'st-default';
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
