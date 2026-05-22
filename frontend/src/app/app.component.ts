import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService, User } from './auth.service';
import { HeaderComponent } from './header/header.component';
import { NavbarComponent } from './navbar/navbar.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NavbarComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'democart';
  currentUser: User | null = null;
  private userSubscription?: Subscription;
  private routerSubscription?: Subscription;
  currentRoute = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.user$.subscribe((user) => {
      this.currentUser = user;
    });

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.urlAfterRedirects;
      });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  get isAuthPage(): boolean {
    return this.currentRoute.includes('/login')
        || this.currentRoute.includes('/register')
        || this.currentRoute.includes('/forgot-password')
        || this.currentRoute.includes('/reset-password');
  }

  get showHeader(): boolean {
    return !this.isAuthPage;
  }

  get showNavbar(): boolean {
    const isSellerRole = this.currentUser?.role === 'seller';
    return !this.isAuthPage && !isSellerRole;
  }
}
