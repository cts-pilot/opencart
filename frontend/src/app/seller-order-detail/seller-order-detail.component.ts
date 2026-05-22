import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { SellerService } from '../seller.service';
import { OrderItem } from '../api.types';

@Component({
  selector: 'app-seller-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seller-order-detail.component.html',
  styleUrl: './seller-order-detail.component.css'
})
export class SellerOrderDetailComponent implements OnInit {
  order: OrderItem | null = null;
  isLoading = true;
  errorMessage = '';
  orderItemId = 0;
  statuses = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  pendingStatus = '';
  isSavingStatus = false;
  statusMessage = '';

  constructor(
    private route: ActivatedRoute,
    private sellerService: SellerService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.orderItemId = Number(this.route.snapshot.paramMap.get('orderItemId') || 0);
    this.loadOrder();
  }

  private loadOrder(): void {
    this.isLoading = true;
    this.sellerService.getOrders().subscribe({
      next: (orders) => {
        this.order = orders.find((o) => Number(o.orderItemId) === this.orderItemId) || null;
        if (!this.order) {
          this.errorMessage = 'Order not found.';
        } else {
          this.pendingStatus = this.order.status || '';
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load order.';
        this.isLoading = false;
      }
    });
  }

  saveStatus(): void {
    if (!this.order || !this.pendingStatus) return;
    if (this.pendingStatus === this.order.status) return;

    this.isSavingStatus = true;
    this.statusMessage = '';
    this.sellerService.updateOrderStatus(this.order.orderItemId, this.pendingStatus).subscribe({
      next: () => {
        this.isSavingStatus = false;
        this.statusMessage = 'Status updated.';
        this.loadOrder();
        setTimeout(() => (this.statusMessage = ''), 2400);
      },
      error: () => {
        this.isSavingStatus = false;
        this.statusMessage = 'Unable to update status.';
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get fullOrderId(): string {
    if (!this.order) return '';
    const id = this.order.orderItemId ?? 0;
    return 'ORD-' + (4820 + Number(id)).toString();
  }

  get shortOrderId(): string {
    if (!this.order) return '';
    const id = this.order.orderItemId ?? 0;
    return '#ORD-' + (4820 + Number(id)).toString();
  }

  get customerFullName(): string {
    const fname = this.order?.order?.user?.firstName;
    const lname = this.order?.order?.user?.lastName;
    if (!fname && !lname) return '—';
    return `${fname ?? ''} ${lname ?? ''}`.trim();
  }

  get unitPrice(): number {
    if (!this.order) return 0;
    return this.order.unitPrice != null ? this.order.unitPrice : (this.order.product?.price ?? 0);
  }

  get unitOriginal(): number {
    if (!this.order) return 0;
    if (this.order.unitPrice != null && this.order.offerPercent && this.order.offerPercent > 0) {
      return Math.round(this.order.unitPrice / (1 - this.order.offerPercent / 100));
    }
    return this.unitPrice;
  }

  get hasFrozenOffer(): boolean {
    return !!(this.order && this.order.offerPercent && this.order.offerPercent > 0);
  }

  get amount(): number {
    return this.unitPrice * (this.order?.qty ?? 0);
  }

  get amountOriginal(): number {
    return this.unitOriginal * (this.order?.qty ?? 0);
  }

  get statusUpper(): string {
    return (this.order?.status || '').toUpperCase();
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

  get paymentLabel(): string {
    if (this.statusUpper === 'CANCELLED') return 'Refunded · UPI';
    if (this.statusUpper === 'PENDING') return 'COD';
    return 'Paid · UPI';
  }
  get paymentClass(): string {
    if (this.statusUpper === 'CANCELLED') return 'pm-refund';
    if (this.statusUpper === 'PENDING') return 'pm-cod';
    return 'pm-paid';
  }

  formatDateTime(value?: string, offsetMinutes = 0): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    d.setMinutes(d.getMinutes() + offsetMinutes);
    const datePart = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${datePart} · ${timePart}`;
  }

  get timeline(): Array<{ label: string; meta: string; done: boolean }> {
    const created = this.order?.order?.createdAt;
    const s = this.statusUpper;

    const placed = !!created;
    const payment = placed && s !== 'PENDING';
    const shipped = s === 'SHIPPED' || s === 'DELIVERED';
    const delivered = s === 'DELIVERED';

    return [
      {
        label: 'Order placed',
        meta: created ? this.formatDateTime(created, 0) : 'Awaiting',
        done: placed
      },
      {
        label: 'Payment confirmed',
        meta: payment && created ? this.formatDateTime(created, 2) : (s === 'PENDING' ? 'Pending — COD' : '—'),
        done: payment
      },
      {
        label: 'Packed & shipped',
        meta: shipped && created ? this.formatDateTime(created, 28 * 60) + ' · BlueDart' : '—',
        done: shipped
      },
      {
        label: 'Delivered',
        meta: delivered && created ? this.formatDateTime(created, 2 * 24 * 60) : '—',
        done: delivered
      }
    ];
  }
}