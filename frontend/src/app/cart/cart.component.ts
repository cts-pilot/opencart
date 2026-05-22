import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../user.service';
import { CartItem, Product } from '../api.types';
import { AuthService } from '../auth.service';
import { OfferService } from '../offer.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  items: CartItem[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private offerService: OfferService,
    private router: Router
  ) {}

  unitPrice(product: Product): number {
    return this.offerService.discountedPrice(product);
  }

  hasOffer(product: Product): boolean {
    return !!this.offerService.forProduct(product);
  }

  lineTotal(item: CartItem): number {
    return this.unitPrice(item.product) * item.qty;
  }

  lineOriginal(item: CartItem): number {
    return item.product.price * item.qty;
  }

  offerPercent(product: Product): number | null {
    return this.offerService.forProduct(product)?.discount ?? null;
  }

  get subtotalOriginal(): number {
    return this.items.reduce((sum, item) => sum + this.lineOriginal(item), 0);
  }

  get totalSavings(): number {
    return this.items.reduce(
      (sum, item) => sum + (this.lineOriginal(item) - this.lineTotal(item)),
      0
    );
  }

  ngOnInit(): void {
    if (!this.ensureUserAccess()) {
      return;
    }
    this.loadCart();
  }

  loadCart(): void {
    if (!this.ensureUserAccess()) {
      return;
    }
    this.isLoading = true;
    this.userService.getCart().subscribe({
      next: (items) => {
        this.items = items;
        this.isLoading = false;
        this.errorMessage = '';
      },
      error: (error) => {
        this.items = [];
        this.isLoading = false;
        this.errorMessage = this.getActionError(error);
      }
    });
  }

  updateQty(item: CartItem, qty: number): void {
    if (qty < 1) {
      return;
    }
    this.errorMessage = '';
    const previousQty = item.qty;
    item.qty = qty;
    this.userService.updateCartItem(item.cartItemsId, qty).subscribe({
      error: (error) => {
        item.qty = previousQty;
        this.errorMessage = this.getActionError(error);
      }
    });
  }

  removeItem(item: CartItem): void {
    this.errorMessage = '';
    this.userService.removeCartItem(item.cartItemsId).subscribe({
      next: () => this.loadCart(),
      error: (error) => {
        this.errorMessage = this.getActionError(error);
      }
    });
  }

  clearCart(): void {
    this.errorMessage = '';
    this.userService.clearCart().subscribe({
      next: () => this.loadCart(),
      error: (error) => {
        this.errorMessage = this.getActionError(error);
      }
    });
  }

  private ensureUserAccess(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/login']);
      return false;
    }
    if (currentUser.role !== 'user') {
      this.router.navigate(['/seller']);
      return false;
    }
    return true;
  }

  get total(): number {
    return this.items.reduce((sum, item) => sum + this.lineTotal(item), 0);
  }

  trackByCartItem(index: number, item: CartItem): number {
    return item.cartItemsId;
  }

  private getActionError(error: unknown): string {
    if (error && typeof error === 'object') {
      const errorResponse = error as { status?: number; error?: { error?: string } };
      if (errorResponse.status === 404 && errorResponse.error?.error === 'Cart not found') {
        return 'Your account doesn’t have a cart yet. Please log out and register again to initialize it.';
      }
    }

    return 'Unable to update cart. Please try again.';
  }
}