import { Component, OnInit } from '@angular/core';
import { CarouselComponent } from '../carousel/carousel.component';
import { ProductCardComponent } from '../product-card/product-card.component';
import { BrandsComponent } from '../brands/brands.component';
import { FooterComponent } from '../footer/footer.component';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../product.service';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';
import { Category, Product } from '../api.types';
import { SearchService } from '../search.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CarouselComponent, ProductCardComponent, BrandsComponent, FooterComponent, NgFor, NgIf],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  allProducts: Product[] = [];
  products: Product[] = [];
  categories: Category[] = [];
  isLoading = true;
  selectedCategoryId: number | null = null;
  searchTerm = '';
  actionError = '';

  constructor(
    private productService: ProductService,
    private userService: UserService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.productService.getCategories().subscribe((categories) => {
      this.categories = categories;
      const defaultMobileCategory = this.categories.find(
        (category) => category.categoryName.toLowerCase() === 'mobile'
      );

      if (!this.selectedCategoryId && defaultMobileCategory) {
        this.selectedCategoryId = defaultMobileCategory.categoryId;
      }
    });

    this.searchService.searchTerm$.subscribe((term) => {
      this.searchTerm = term.trim().toLowerCase();
      this.applyFilters();
    });

    this.route.paramMap.subscribe((params) => {
      const categoryIdParam = params.get('categoryId');
      this.selectedCategoryId = categoryIdParam ? Number(categoryIdParam) : this.selectedCategoryId;
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.products = [];
        this.allProducts = [];
        this.isLoading = false;
      }
    });
  }

  private applyFilters(): void {
    let filtered = [...this.allProducts];

    if (this.selectedCategoryId) {
      filtered = filtered.filter(
        (product) => product.category?.categoryId === this.selectedCategoryId
      );
    }

    if (this.searchTerm) {
      filtered = filtered.filter((product) =>
        product.productName.toLowerCase().includes(this.searchTerm)
      );
    }

    this.products = filtered;
  }

  handleAddToCart(product: Product): void {
    if (!this.ensureUserAccess()) {
      return;
    }
    this.actionError = '';
    this.userService.addToCart(product.productId, 1).subscribe({
      error: (error) => {
        this.actionError = this.getActionError(error, 'cart');
      }
    });
  }

  handleAddToWishlist(product: Product): void {
    if (!this.ensureUserAccess()) {
      return;
    }
    this.actionError = '';
    this.userService.addToWishlist(product.productId).subscribe({
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
