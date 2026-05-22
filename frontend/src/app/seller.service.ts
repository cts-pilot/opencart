import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { OrderItem, Product, Review, SellerProfile } from './api.types';

@Injectable({
  providedIn: 'root'
})
export class SellerService {
  private readonly apiBaseUrl = `${API_BASE_URL}/api/seller`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<SellerProfile> {
    return this.http.get<SellerProfile>(`${this.apiBaseUrl}/profile`);
  }

  updateShopName(shopName: string): Observable<SellerProfile> {
    return this.http.put<SellerProfile>(`${this.apiBaseUrl}/profile`, { shopName });
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiBaseUrl}/products`);
  }

  addProduct(payload: { productName: string; productUrl: string; price: number; stock: number; categoryId: number }): Observable<Product> {
    return this.http.post<Product>(`${this.apiBaseUrl}/products`, payload);
  }

  updateProduct(productId: number, payload: { productName: string; productUrl: string; price: number; stock: number; categoryId: number }): Observable<Product> {
    return this.http.put<Product>(`${this.apiBaseUrl}/products/${productId}`, payload);
  }

  deleteProduct(productId: number): Observable<string> {
    return this.http.delete<string>(`${this.apiBaseUrl}/products/${productId}`, {
      responseType: 'text' as 'json'
    });
  }

  updateStock(productId: number, stock: number): Observable<Product> {
    return this.http.patch<Product>(`${this.apiBaseUrl}/products/${productId}/stock`, { stock });
  }

  updateOffer(productId: number, offerPercent: number | null, offerValidUntil: string | null): Observable<Product> {
    return this.http.patch<Product>(`${this.apiBaseUrl}/products/${productId}/offer`, {
      offerPercent,
      offerValidUntil
    });
  }

  getOrders(): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(`${this.apiBaseUrl}/orders`);
  }

  updateOrderStatus(orderItemId: number, status: string): Observable<OrderItem> {
    return this.http.patch<OrderItem>(`${this.apiBaseUrl}/orders/${orderItemId}/status`, { status });
  }

  getProductReviews(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiBaseUrl}/products/${productId}/reviews`);
  }
}