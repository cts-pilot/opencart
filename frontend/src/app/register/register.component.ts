import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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
  passwordError = '';
    showPassword = false;

    constructor(private router: Router){}

    validatePassword(pwd: string): boolean {
      this.passwordError = this.getPasswordError(pwd);
      return !this.passwordError;
    }

    getPasswordError(pwd: string): string {
      if (!pwd) {
        return '';
      }

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
      if (!this.validatePassword(this.password)) {
        return;
      }
      this.router.navigate(['/home']);
    }

    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    }

}
