import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User {
  email: string;
  fname: string;
  lname: string;
  isLoggedIn: boolean;
  role: 'user' | 'seller';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly userCredentials = {
    email: 'testing@gmail.com',
    password: 'Testing@123'
  };
  private readonly sellerCredentials = {
    email: 'seller@gmail.com',
    password: 'Seller@123'
  };
  private readonly storageKey = 'currentUser';

  private readonly userSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  readonly user$ = this.userSubject.asObservable();

  login(email: string, password: string): { success: boolean; role?: 'user' | 'seller' } {
    // Check for user credentials
    if (email === this.userCredentials.email && password === this.userCredentials.password) {
      const user: User = {
        email,
        fname: 'Test',
        lname: 'User',
        isLoggedIn: true,
        role: 'user'
      };

      localStorage.setItem(this.storageKey, JSON.stringify(user));
      this.userSubject.next(user);
      return { success: true, role: 'user' };
    }

    // Check for seller credentials
    if (email === this.sellerCredentials.email && password === this.sellerCredentials.password) {
      const seller: User = {
        email,
        fname: 'Seller',
        lname: 'User',
        isLoggedIn: true,
        role: 'seller'
      };

      localStorage.setItem(this.storageKey, JSON.stringify(seller));
      this.userSubject.next(seller);
      return { success: true, role: 'seller' };
    }

    return { success: false };
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.userSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
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