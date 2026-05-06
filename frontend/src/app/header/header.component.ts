import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../auth.service';
import { UserService } from '../user.service';
import { SearchService } from '../search.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  showAccount = false;
  showUserProfile = false;
  currentUser: User | null = null;
  cartCount = 0;
  wishlistCount = 0;

  private userSubscription?: Subscription;
  private cartSubscription?: Subscription;
  private wishlistSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private searchService: SearchService
  ) {}

  ngOnInit() {
    this.userSubscription = this.authService.user$.subscribe((user) => {
      this.currentUser = user;
      if (!user) {
        this.showUserProfile = false;
        this.cartCount = 0;
        this.wishlistCount = 0;
        return;
      }

      if (user.role === 'user') {
        this.userService.refreshCartCount();
        this.userService.refreshWishlistCount();
      } else {
        this.cartCount = 0;
        this.wishlistCount = 0;
      }
    });

    this.cartSubscription = this.userService.cartCount$.subscribe((count) => {
      this.cartCount = count;
    });

    this.wishlistSubscription = this.userService.wishlistCount$.subscribe((count) => {
      this.wishlistCount = count;
    });

  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
    this.cartSubscription?.unsubscribe();
    this.wishlistSubscription?.unsubscribe();
  }

  toggleAccount() {
    this.showAccount = !this.showAccount;
    this.showUserProfile = false;
  }

  toggleUserProfile() {
    this.showUserProfile = !this.showUserProfile;
    this.showAccount = false;
  }

  logout() {
    this.authService.logout();
    this.showUserProfile = false;
    this.router.navigate(['/login']);
  }

  applySearch(term: string): void {
    this.searchService.setSearchTerm(term.trim());
  }
}
