import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

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

  constructor(private router: Router, private authService: AuthService){}

        login(){
          this.errorMessage = '';

          if (!this.email || !this.password) {
            this.errorMessage = 'Please enter both email and password';
            return;
          }

          const result = this.authService.login(this.email, this.password);
          
          if (result.success) {
            // Redirect based on user role
            if (result.role === 'seller') {
              this.router.navigate(['/seller']);
            } else {
              this.router.navigate(['/']);
            }
          } else {
            this.errorMessage = 'Invalid email or password. Try testing@gmail.com / Testing@123 or seller@gmail.com / Seller@123';
          }
        }

        togglePasswordVisibility() {
          this.showPassword = !this.showPassword;
        }
}
