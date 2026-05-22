import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { SellerService } from '../seller.service';
import { OrderItem, Product, SellerProfile } from '../api.types';

@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seller-profile.component.html',
  styleUrl: './seller-profile.component.css'
})
export class SellerProfileComponent implements OnInit {
  profile: SellerProfile | null = null;
  shopName = '';
  message = '';
  messageKind: 'success' | 'error' = 'success';

  products: Product[] = [];
  orders: OrderItem[] = [];
  isLoading = true;
  isSaving = false;

  constructor(
    private sellerService: SellerService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    forkJoin({
      profile: this.sellerService.getProfile().pipe(catchError(() => of(null))),
      products: this.sellerService.getProducts().pipe(catchError(() => of([] as Product[]))),
      orders: this.sellerService.getOrders().pipe(catchError(() => of([] as OrderItem[])))
    }).subscribe(({ profile, products, orders }) => {
      this.profile = profile;
      this.shopName = profile?.shopName ?? '';
      this.products = products;
      this.orders = orders;
      this.isLoading = false;
    });
  }

  save(): void {
    this.message = '';
    if (!this.shopName.trim()) {
      this.message = 'Shop name is required.';
      this.messageKind = 'error';
      return;
    }
    this.isSaving = true;
    this.sellerService.updateShopName(this.shopName.trim()).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.shopName = profile.shopName ?? '';
        this.message = 'Shop name updated.';
        this.messageKind = 'success';
        this.isSaving = false;
        setTimeout(() => (this.message = ''), 2400);
      },
      error: () => {
        this.message = 'Unable to update shop name.';
        this.messageKind = 'error';
        this.isSaving = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ===== Derived stats =====
  get totalProducts(): number { return this.products.length; }
  get totalOrders(): number { return this.orders.length; }

  get totalRevenue(): number {
    return this.orders.reduce((sum, o) => {
      const unit = o.unitPrice != null ? o.unitPrice : (o.product?.price ?? 0);
      return sum + unit * (o.qty ?? 0);
    }, 0);
  }

  get pendingOrders(): number {
    return this.orders.filter((o) => (o.status || '').toUpperCase() === 'PENDING').length;
  }

  get ownerName(): string {
    const u = this.profile?.user;
    const full = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim();
    return full || '—';
  }

  get ownerEmail(): string {
    return this.profile?.user?.email ?? '—';
  }

  get shopInitial(): string {
    return (this.shopName || this.ownerName || '?').charAt(0).toUpperCase();
  }
}