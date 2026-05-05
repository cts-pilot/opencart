import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../product.service';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';
import { Product, Review } from '../api.types';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  reviews: Review[] = [];
  isLoading = true;
  errorMessage = '';
  actionError = '';

  rating = 5;
  comment = '';
  isSubmittingReview = false;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const productIdParam = params.get('productId');
      if (!productIdParam) {
        this.errorMessage = 'Product not found.';
        this.isLoading = false;
        return;
      }
      const productId = Number(productIdParam);
      this.loadProduct(productId);
      this.loadReviews(productId);
    });
  }

  loadProduct(productId: number): void {
    this.isLoading = true;
    this.productService.getProduct(productId).subscribe({
      next: (product) => {
        this.product = product;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load product.';
        this.isLoading = false;
      }
    });
  }

  loadReviews(productId: number): void {
    this.productService.getProductReviews(productId).subscribe({
      next: (reviews) => (this.reviews = reviews),
      error: () => (this.reviews = [])
    });
  }

  addToCart(): void {
    if (!this.product) {
      return;
    }
    if (!this.ensureUserAccess()) {
      return;
    }
    this.actionError = '';
    this.userService.addToCart(this.product.productId, 1).subscribe({
      error: (error) => {
        this.actionError = this.getActionError(error, 'cart');
      }
    });
  }

  addToWishlist(): void {
    if (!this.product) {
      return;
    }
    if (!this.ensureUserAccess()) {
      return;
    }
    this.actionError = '';
    this.userService.addToWishlist(this.product.productId).subscribe({
      error: (error) => {
        this.actionError = this.getActionError(error, 'wishlist');
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

    return `Unable to add item to ${type}. Please try again.`;
  }

  submitReview(): void {
    if (!this.product || !this.comment.trim()) {
      return;
    }
    if (!this.ensureUserAccess()) {
      return;
    }
    this.isSubmittingReview = true;
    this.userService
      .addReview({ productId: this.product.productId, rating: this.rating, comment: this.comment })
      .subscribe({
        next: () => {
          this.comment = '';
          this.rating = 5;
          this.isSubmittingReview = false;
          this.loadReviews(this.product!.productId);
        },
        error: () => {
          this.isSubmittingReview = false;
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
}