import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../user.service';
import { CartItem } from '../api.types';
import { AuthService } from '../auth.service';

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
    private router: Router
  ) {}

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
    return this.items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
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