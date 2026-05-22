import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { SellerService } from '../seller.service';
import { Product, Review } from '../api.types';

interface ReviewWithProduct extends Review {
  productId?: number;
  productName?: string;
  productUrl?: string;
}

@Component({
  selector: 'app-seller-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seller-reviews.component.html',
  styleUrl: './seller-reviews.component.css'
})
export class SellerReviewsComponent implements OnInit {
  products: Product[] = [];
  reviews: ReviewWithProduct[] = [];
  isLoading = true;
  searchTerm = '';
  ratingFilter: 'ALL' | '5' | '4' | '3' | '2' | '1' = 'ALL';
  productFilter: number | null = null;

  constructor(
    private sellerService: SellerService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    this.sellerService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        if (!products.length) {
          this.reviews = [];
          this.isLoading = false;
          return;
        }
        const requests = products.map((p) =>
          this.sellerService.getProductReviews(p.productId).pipe(
            catchError(() => of([] as Review[]))
          )
        );
        forkJoin(requests).subscribe((groups) => {
          const all: ReviewWithProduct[] = [];
          groups.forEach((reviews, i) => {
            const product = products[i];
            reviews.forEach((r) => {
              all.push({
                ...r,
                productId: product.productId,
                productName: product.productName,
                productUrl: product.productUrl
              });
            });
          });
          this.reviews = all.sort((a, b) => (b.reviewId ?? 0) - (a.reviewId ?? 0));
          this.isLoading = false;
        });
      },
      error: () => {
        this.reviews = [];
        this.isLoading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get totalReviews(): number { return this.reviews.length; }

  get averageRating(): number {
    if (!this.reviews.length) return 0;
    const sum = this.reviews.reduce((s, r) => s + (r.rating ?? 0), 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  get fiveStarCount(): number {
    return this.reviews.filter((r) => r.rating === 5).length;
  }

  get lowRatingCount(): number {
    return this.reviews.filter((r) => r.rating != null && r.rating <= 2).length;
  }

  get distribution(): Array<{ stars: number; count: number; percent: number }> {
    const total = this.reviews.length || 1;
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = this.reviews.filter((r) => r.rating === stars).length;
      return { stars, count, percent: Math.round((count / total) * 100) };
    });
  }

  get filteredReviews(): ReviewWithProduct[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.reviews.filter((r) => {
      if (this.ratingFilter !== 'ALL' && r.rating !== Number(this.ratingFilter)) return false;
      if (this.productFilter && r.productId !== this.productFilter) return false;
      if (term) {
        const haystack = `${r.comment ?? ''} ${r.productName ?? ''} ${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }

  reviewerName(r: ReviewWithProduct): string {
    const f = r.user?.firstName ?? '';
    const l = r.user?.lastName ?? '';
    const full = `${f} ${l}`.trim();
    return full || 'Anonymous';
  }

  initials(r: ReviewWithProduct): string {
    const f = (r.user?.firstName || '?').charAt(0);
    const l = (r.user?.lastName || '').charAt(0);
    return (f + l).toUpperCase();
  }

  starsArray(rating?: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < (rating ?? 0));
  }
}