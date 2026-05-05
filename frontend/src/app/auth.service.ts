import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { AuthResponse } from './api.types';

export interface User {
  email: string;
  fname: string;
  lname: string;
  isLoggedIn: boolean;
  role: 'user' | 'seller';
  token: string;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiBaseUrl = `${API_BASE_URL}/api/user`;
  private readonly sellerApiBaseUrl = `${API_BASE_URL}/api/seller`;
  private readonly storageKey = 'currentUser';

  private readonly userSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  readonly user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/login`, { email, password })
      .pipe(tap((response) => this.setSession(response)));
  }

  loginSeller(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.sellerApiBaseUrl}/login`, { email, password })
      .pipe(tap((response) => this.setSession(response)));
  }

  register(firstName: string, lastName: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/register`, { firstName, lastName, email, password })
      .pipe(tap((response) => this.setSession(response)));
  }

  registerSeller(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    shopName: string
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.sellerApiBaseUrl}/register`, {
        firstName,
        lastName,
        email,
        password,
        shopName
      })
      .pipe(tap((response) => this.setSession(response)));
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.userSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  getToken(): string | null {
    return this.userSubject.value?.token ?? null;
  }

  private setSession(response: AuthResponse): void {
    const role = this.normalizeRole(response.role);
    const user: User = {
      email: response.email,
      fname: response.firstName,
      lname: response.lastName,
      isLoggedIn: true,
      role,
      token: response.token,
      userId: response.userId
    };

    localStorage.setItem(this.storageKey, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private normalizeRole(role: string): 'user' | 'seller' {
    if (!role) {
      return 'user';
    }

    const normalized = role.toLowerCase();
    if (normalized.includes('seller')) {
      return 'seller';
    }

    return 'user';
  }

  private loadUserFromStorage(): User | null {
    const userData = localStorage.getItem(this.storageKey);
    if (!userData) {
      return null;
    }

    try {
      return JSON.parse(userData) as User;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}