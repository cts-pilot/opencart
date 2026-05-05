import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../product.service';
import { AuthService } from '../auth.service';
import { Category } from '../api.types';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  categories: Category[] = [];
  isSeller = false;

  constructor(private productService: ProductService, private authService: AuthService) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.isSeller = currentUser?.role === 'seller';

    if (this.isSeller) {
      this.categories = [];
      return;
    }

    this.productService.getCategories().subscribe({
      next: (categories) => (this.categories = categories),
      error: () => (this.categories = [])
    });
  }
}
