import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../user.service';
import { WishlistItem } from '../api.types';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {
  items: WishlistItem[] = [];
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
    this.loadWishlist();
  }

  loadWishlist(): void {
    if (!this.ensureUserAccess()) {
      return;
    }
    this.isLoading = true;
    this.userService.getWishlist().subscribe({
      next: (items) => {
        this.items = items;
        this.isLoading = false;
        this.errorMessage = '';
      },
      error: (error) => {
        this.items = [];
        this.isLoading = false;
        this.errorMessage = this.getActionError(error, 'wishlist');
      }
    });
  }

  addToCart(item: WishlistItem): void {
    this.errorMessage = '';
    this.userService.addToCart(item.product.productId, 1).subscribe({
      next: () => this.loadWishlist(),
      error: (error) => {
        this.errorMessage = this.getActionError(error, 'cart');
      }
    });
  }

  removeItem(item: WishlistItem): void {
    this.errorMessage = '';
    this.userService.removeWishlistItem(item.id).subscribe({
      next: () => this.loadWishlist(),
      error: (error) => {
        this.errorMessage = this.getActionError(error, 'wishlist');
      }
    });
  }

  private getActionError(error: unknown, type: 'cart' | 'wishlist'): string {
    if (error && typeof error === 'object') {
      const errorResponse = error as { status?: number; error?: { error?: string } };
      const expected = type === 'cart' ? 'Cart not found' : 'Wishlist not found';
      if (errorResponse.status === 404 && errorResponse.error?.error === expected) {
        return `Your account doesn’t have a ${type} yet. Please log out and register again to initialize it.`;
      }
    }

    return `Unable to update ${type}. Please try again.`;
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
}