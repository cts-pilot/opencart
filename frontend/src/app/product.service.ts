import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { Category, Product, Review } from './api.types';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiBaseUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiBaseUrl}/api/products`);
  }

  getProduct(productId: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiBaseUrl}/api/products/${productId}`);
  }

  getProductsByCategory(categoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiBaseUrl}/api/products/category/${categoryId}`);
  }

  getProductReviews(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiBaseUrl}/api/products/${productId}/reviews`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiBaseUrl}/api/categories`);
  }
}