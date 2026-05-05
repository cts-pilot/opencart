import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../user.service';
import { Address } from '../api.types';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  addresses: Address[] = [];
  selectedAddressId: number | null = null;
  isLoading = true;
  errorMessage = '';

  country = '';
  city = '';
  address = '';
  pincode = '';

  constructor(
    private userService: UserService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.ensureUserAccess()) {
      return;
    }
    this.loadAddresses();
  }

  loadAddresses(): void {
    if (!this.ensureUserAccess()) {
      return;
    }
    this.isLoading = true;
    this.userService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.selectedAddressId = addresses[0]?.addressId ?? null;
        this.isLoading = false;
      },
      error: () => {
        this.addresses = [];
        this.isLoading = false;
      }
    });
  }

  addAddress(): void {
    if (!this.country || !this.city || !this.address || !this.pincode) {
      this.errorMessage = 'Please fill all address fields.';
      return;
    }
    this.userService
      .addAddress({ country: this.country, city: this.city, address: this.address, pincode: this.pincode })
      .subscribe(() => {
        this.country = '';
        this.city = '';
        this.address = '';
        this.pincode = '';
        this.errorMessage = '';
        this.loadAddresses();
      });
  }

  placeOrder(): void {
    if (!this.selectedAddressId) {
      this.errorMessage = 'Please select an address.';
      return;
    }
    this.userService.placeOrder(this.selectedAddressId).subscribe({
      next: () => this.router.navigate(['/orders']),
      error: () => (this.errorMessage = 'Unable to place order.')
    });
  }

  private ensureUserAccess(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/login']);
      return false;
    }
    if (currentUser.role !== 'user') {
      this.router.navigate(['/seller']);
      return false;
    }
    return true;
  }
}