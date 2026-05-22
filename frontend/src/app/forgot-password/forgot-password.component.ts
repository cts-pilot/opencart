import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  email = '';
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  year = new Date().getFullYear();

  constructor(private authService: AuthService) {}

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email.trim()) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    this.isSubmitting = true;
    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = response?.message
          || 'If an account exists for that email, a reset link has been sent.';
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error?.error?.error
          || error?.error?.message
          || 'Unable to send reset email. Please try again.';
      }
    });
  }
}