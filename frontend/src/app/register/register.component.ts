import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
    fname='';
    lname='';
    email='';
    password='';
    shopName='';
    isSeller = false;
  passwordError = '';
    errorMessage = '';
    showPassword = false;
    isSubmitting = false;

    constructor(private router: Router, private authService: AuthService){}

    validatePassword(pwd: string): boolean {
      this.passwordError = this.getPasswordError(pwd);
      return !this.passwordError;
    }

    getPasswordError(pwd: string): string {
      // if (!pwd) {
      //   return '';
      // }

      if (pwd.length < 8) {
        return 'Password must be at least 8 characters long';
      }

      if (!/[A-Z]/.test(pwd)) {
        return 'Password must contain at least one uppercase letter';
      }

      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
        return 'Password must contain at least one special character';
      }

      return '';
    }

    register(){
      this.errorMessage = '';

      if (!this.validatePassword(this.password)) {
        return;
      }

      if (!this.fname || !this.lname || !this.email || !this.password) {
        this.errorMessage = 'Please fill in all required fields';
        return;
      }

      if (this.isSeller && !this.shopName) {
        this.errorMessage = 'Please enter your shop name';
        return;
      }

      this.isSubmitting = true;

      const request$ = this.isSeller
        ? this.authService.registerSeller(this.fname, this.lname, this.email, this.password, this.shopName)
        : this.authService.register(this.fname, this.lname, this.email, this.password);

      request$.subscribe({
        next: (response) => {
          this.isSubmitting = false;
          const role = response.role?.toLowerCase().includes('seller') ? 'seller' : 'user';
          if (role === 'seller') {
            this.router.navigate(['/seller']);
          } else {
            this.router.navigate(['/home']);
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error?.error?.message || 'Registration failed. Please try again.';
        }
      });
    }

    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    }

}
