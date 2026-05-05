import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap, throwError } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { Address, CartItem, Order, OrderItem, Review, UserProfile, WishlistItem } from './api.types';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiBaseUrl = `${API_BASE_URL}/api/user`;
  private readonly cartCountSubject = new BehaviorSubject<number>(0);
  private readonly wishlistCountSubject = new BehaviorSubject<number>(0);
  private readonly cartNotFoundSubject = new BehaviorSubject<boolean>(false);
  private readonly wishlistNotFoundSubject = new BehaviorSubject<boolean>(false);

  readonly cartCount$ = this.cartCountSubject.asObservable();
  readonly wishlistCount$ = this.wishlistCountSubject.asObservable();
  readonly cartNotFound$ = this.cartNotFoundSubject.asObservable();
  readonly wishlistNotFound$ = this.wishlistNotFoundSubject.asObservable();

  constructor(private http: HttpClient) {}

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiBaseUrl}/profile`);
  }

  updateProfile(payload: { firstName: string; lastName: string; email: string }): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiBaseUrl}/profile`, payload);
  }

  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiBaseUrl}/addresses`);
  }

  addAddress(payload: { country: string; city: string; address: string; pincode: string }): Observable<Address> {
    return this.http.post<Address>(`${this.apiBaseUrl}/addresses`, payload);
  }

  updateAddress(addressId: number, payload: { country: string; city: string; address: string; pincode: string }): Observable<Address> {
    return this.http.put<Address>(`${this.apiBaseUrl}/addresses/${addressId}`, payload);
  }

  deleteAddress(addressId: number): Observable<string> {
    return this.http.delete<string>(`${this.apiBaseUrl}/addresses/${addressId}`);
  }

  getCart(): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(`${this.apiBaseUrl}/cart`).pipe(
      tap((items) => {
        this.cartNotFoundSubject.next(false);
        this.cartCountSubject.next(items.length);
      }),
      catchError((error) => {
        if (this.isNotFoundError(error, 'Cart not found')) {
          this.cartNotFoundSubject.next(true);
        }
        this.cartCountSubject.next(0);
        return of([] as CartItem[]);
      })
    );
  }

  addToCart(productId: number, qty: number): Observable<CartItem> {
    return this.http.post<CartItem>(`${this.apiBaseUrl}/cart`, { productId, qty }).pipe(
      tap(() => this.refreshCartCount()),
      catchError((error) => {
        if (this.isNotFoundError(error, 'Cart not found')) {
          this.cartNotFoundSubject.next(true);
        }
        return throwError(() => error);
      })
    );
  }

  updateCartItem(cartItemId: number, qty: number): Observable<CartItem> {
    return this.http.put<CartItem>(`${this.apiBaseUrl}/cart/items/${cartItemId}?qty=${qty}`, {}).pipe(
      tap(() => this.refreshCartCount()),
      catchError((error) => {
        if (this.isNotFoundError(error, 'Cart not found')) {
          this.cartNotFoundSubject.next(true);
        }
        return throwError(() => error);
      })
    );
  }

  removeCartItem(cartItemId: number): Observable<string> {
    return this.http
      .delete<string>(`${this.apiBaseUrl}/cart/items/${cartItemId}`, {
        responseType: 'text' as 'json'
      })
      .pipe(
      tap(() => this.refreshCartCount()),
      catchError((error) => {
        if (this.isNotFoundError(error, 'Cart not found')) {
          this.cartNotFoundSubject.next(true);
        }
        return throwError(() => error);
      })
    );
  }

  clearCart(): Observable<string> {
    return this.http.delete<string>(`${this.apiBaseUrl}/cart`).pipe(
      tap(() => this.cartCountSubject.next(0)),
      catchError((error) => {
        if (this.isNotFoundError(error, 'Cart not found')) {
          this.cartNotFoundSubject.next(true);
        }
        return throwError(() => error);
      })
    );
  }

  getWishlist(): Observable<WishlistItem[]> {
    return this.http.get<WishlistItem[]>(`${this.apiBaseUrl}/wishlist`).pipe(
      tap((items) => {
        this.wishlistNotFoundSubject.next(false);
        this.wishlistCountSubject.next(items.length);
      }),
      catchError((error) => {
        if (this.isNotFoundError(error, 'Wishlist not found')) {
          this.wishlistNotFoundSubject.next(true);
        }
        this.wishlistCountSubject.next(0);
        return of([] as WishlistItem[]);
      })
    );
  }

  addToWishlist(productId: number): Observable<WishlistItem> {
    return this.http.post<WishlistItem>(`${this.apiBaseUrl}/wishlist/${productId}`, {}).pipe(
      tap(() => this.refreshWishlistCount()),
      catchError((error) => {
        if (this.isNotFoundError(error, 'Wishlist not found')) {
          this.wishlistNotFoundSubject.next(true);
        }
        return throwError(() => error);
      })
    );
  }

  removeWishlistItem(wishlistItemId: number): Observable<string> {
    return this.http
      .delete<string>(`${this.apiBaseUrl}/wishlist/items/${wishlistItemId}`, {
        responseType: 'text' as 'json'
      })
      .pipe(
      tap(() => this.refreshWishlistCount()),
      catchError((error) => {
        if (this.isNotFoundError(error, 'Wishlist not found')) {
          this.wishlistNotFoundSubject.next(true);
        }
        return throwError(() => error);
      })
    );
  }

  placeOrder(addressId: number): Observable<Order> {
    return this.http.post<Order>(`${this.apiBaseUrl}/orders`, { addressId });
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiBaseUrl}/orders`);
  }

  getOrderItems(orderId: number): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(`${this.apiBaseUrl}/orders/${orderId}/items`);
  }

  addReview(payload: { productId: number; rating: number; comment: string }): Observable<Review> {
    return this.http.post<Review>(`${this.apiBaseUrl}/reviews`, payload);
  }

  getMyReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiBaseUrl}/reviews`);
  }

  deleteReview(reviewId: number): Observable<string> {
    return this.http.delete<string>(`${this.apiBaseUrl}/reviews/${reviewId}`);
  }

  refreshCartCount(): void {
    this.getCart().subscribe();
  }

  refreshWishlistCount(): void {
    this.getWishlist().subscribe();
  }

  private isNotFoundError(error: unknown, message: string): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const errorResponse = error as { status?: number; error?: { error?: string } };
    return errorResponse.status === 404 && errorResponse.error?.error === message;
  }
}