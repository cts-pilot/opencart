import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { catchError } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
        email='';
        password='';
        errorMessage = '';
        showPassword = false;
  isSubmitting = false;
  year = new Date().getFullYear();

  constructor(private router: Router, private authService: AuthService){}

        login(){
          this.errorMessage = '';

          if (!this.email || !this.password) {
            this.errorMessage = 'Please enter both email and password';
            return;
          }

          this.isSubmitting = true;

          this.authService
            .loginSeller(this.email, this.password)
            .pipe(catchError(() => this.authService.login(this.email, this.password)))
            .subscribe({
            next: (response) => {
              this.isSubmitting = false;
              const role = response.role?.toLowerCase().includes('seller') ? 'seller' : 'user';
              if (role === 'seller') {
                this.router.navigate(['/seller']);
              } else {
                this.router.navigate(['/']);
              }
            },
            error: (error) => {
              this.isSubmitting = false;
              this.errorMessage = error?.error?.message || 'Invalid email or password';
            }
          });
        }

        togglePasswordVisibility() {
          this.showPassword = !this.showPassword;
        }
}
