import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;

  passwordError = '';
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  tokenMissing = false;
  year = new Date().getFullYear();

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.tokenMissing = !this.token;
    if (this.tokenMissing) {
      this.errorMessage = 'This reset link is invalid. Please request a new one.';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  validatePassword(pwd: string): void {
    if (!pwd) {
      this.passwordError = '';
      return;
    }
    if (pwd.length < 8) {
      this.passwordError = 'Password must be at least 8 characters long';
    } else if (!/[A-Z]/.test(pwd)) {
      this.passwordError = 'Password must contain at least one uppercase letter';
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      this.passwordError = 'Password must contain at least one special character';
    } else {
      this.passwordError = '';
    }
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.tokenMissing) {
      return;
    }
    this.validatePassword(this.newPassword);
    if (this.passwordError) {
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isSubmitting = true;
    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = response?.message || 'Password reset successful. Redirecting to sign in…';
        setTimeout(() => this.router.navigate(['/login']), 1800);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error?.error?.error
          || error?.error?.message
          || 'Unable to reset password. The link may have expired.';
      }
    });
  }
}