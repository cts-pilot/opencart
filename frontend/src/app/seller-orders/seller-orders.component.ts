import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { SellerService } from '../seller.service';
import { OrderItem } from '../api.types';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seller-orders.component.html',
  styleUrl: './seller-orders.component.css'
})
export class SellerOrdersComponent implements OnInit {
  orders: OrderItem[] = [];
  isLoading = true;

  statuses = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  searchTerm = '';
  statusFilter = 'ALL';
  dateFilter: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' = 'ALL';

  constructor(
    private sellerService: SellerService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.sellerService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: () => {
        this.orders = [];
        this.isLoading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get filteredOrders(): OrderItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    const now = new Date();

    return this.orders.filter((o) => {
      if (this.statusFilter !== 'ALL' && (o.status || '').toUpperCase() !== this.statusFilter) return false;

      if (this.dateFilter !== 'ALL') {
        const created = o.order?.createdAt ? new Date(o.order.createdAt) : null;
        if (!created || Number.isNaN(created.getTime())) return false;
        const diff = now.getTime() - created.getTime();
        const day = 24 * 60 * 60 * 1000;
        if (this.dateFilter === 'TODAY' && diff > day) return false;
        if (this.dateFilter === 'WEEK' && diff > 7 * day) return false;
        if (this.dateFilter === 'MONTH' && diff > 31 * day) return false;
      }

      if (!term) return true;
      const name = o.product?.productName?.toLowerCase() || '';
      const fname = o.order?.user?.firstName?.toLowerCase() || '';
      const lname = o.order?.user?.lastName?.toLowerCase() || '';
      const id = String(o.orderItemId);
      return name.includes(term) || fname.includes(term) || lname.includes(term) || id.includes(term);
    });
  }

  get totalCount(): number { return this.orders.length; }
  get pendingCount(): number {
    return this.orders.filter((o) => (o.status || '').toUpperCase() === 'PENDING').length;
  }
  get shippedCount(): number {
    return this.orders.filter((o) => (o.status || '').toUpperCase() === 'SHIPPED').length;
  }
  get cancelledCount(): number {
    return this.orders.filter((o) => (o.status || '').toUpperCase() === 'CANCELLED').length;
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
    // Use frozen unit price captured at placement when available; fall back
    // to the live product price for older orders.
    const unit = order.unitPrice != null ? order.unitPrice : (order.product?.price ?? 0);
    return unit * (order.qty ?? 0);
  }

  formatDate(order: OrderItem): string {
    const created = order.order?.createdAt;
    if (!created) return '—';
    const d = new Date(created);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
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

  paymentLabel(order: OrderItem): string {
    const s = (order.status || '').toUpperCase();
    if (s === 'CANCELLED') return 'Refunded';
    if (s === 'PENDING') return 'COD';
    return 'Paid';
  }
  paymentClass(order: OrderItem): string {
    const label = this.paymentLabel(order);
    if (label === 'Paid') return 'pm-paid';
    if (label === 'COD') return 'pm-cod';
    return 'pm-refund';
  }
}