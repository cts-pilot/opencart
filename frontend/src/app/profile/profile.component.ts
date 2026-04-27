import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  userEmail: string = '';
  firstName: string = '';
  lastName: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'user') {
      this.router.navigate(['/login']);
      return;
    }

    this.userEmail = currentUser.email;
    this.firstName = currentUser.fname;
    this.lastName = currentUser.lname;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
