import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../auth.service';

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

  private userSubscription?: Subscription;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.userSubscription = this.authService.user$.subscribe((user) => {
      this.currentUser = user;
      if (!user) {
        this.showUserProfile = false;
      }
    });
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
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
}
