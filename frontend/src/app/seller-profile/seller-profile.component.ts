import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SellerService } from '../seller.service';
import { SellerProfile } from '../api.types';

@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seller-profile.component.html',
  styleUrl: './seller-profile.component.css'
})
export class SellerProfileComponent implements OnInit {
  profile: SellerProfile | null = null;
  shopName = '';
  message = '';

  constructor(private sellerService: SellerService) {}

  ngOnInit(): void {
    this.sellerService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.shopName = profile.shopName ?? '';
      }
    });
  }

  save(): void {
    this.message = '';
    if (!this.shopName.trim()) {
      this.message = 'Shop name is required.';
      return;
    }
    this.sellerService.updateShopName(this.shopName).subscribe({
      next: () => (this.message = 'Profile updated.')
    });
  }
}