import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../user.service';
import { Address, CartItem } from '../api.types';
import { AuthService } from '../auth.service';
import { OfferService } from '../offer.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  addresses: Address[] = [];
  cartItems: CartItem[] = [];
  selectedAddressId: number | null = null;
  isLoading = true;
  errorMessage = '';

  country = 'India';
  city = '';
  address = '';
  pincode = '';
  pincodeError = '';
  countryOptions = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Other'];

  constructor(
    private userService: UserService,
    private router: Router,
    private authService: AuthService,
    private offerService: OfferService
  ) {}

  ngOnInit(): void {
    if (!this.ensureUserAccess()) {
      return;
    }
    this.loadAddresses();
    this.loadCart();
  }

  loadCart(): void {
    this.userService.getCart().subscribe({
      next: (items) => (this.cartItems = items),
      error: () => (this.cartItems = [])
    });
  }

  lineTotal(item: CartItem): number {
    return this.offerService.discountedPrice(item.product) * item.qty;
  }
  lineOriginal(item: CartItem): number {
    return item.product.price * item.qty;
  }
  get subtotalOriginal(): number {
    return this.cartItems.reduce((sum, i) => sum + this.lineOriginal(i), 0);
  }
  get total(): number {
    return this.cartItems.reduce((sum, i) => sum + this.lineTotal(i), 0);
  }
  get totalSavings(): number {
    return this.subtotalOriginal - this.total;
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

  validatePincode(): void {
    const value = (this.pincode || '').trim();
    if (!value) {
      this.pincodeError = '';
      return;
    }
    if (this.country === 'India') {
      if (!/^[1-9][0-9]{5}$/.test(value)) {
        this.pincodeError = 'Indian PIN must be 6 digits and cannot start with 0.';
        return;
      }
    } else {
      if (!/^[A-Za-z0-9\s\-]{3,10}$/.test(value)) {
        this.pincodeError = 'Postal code must be 3–10 characters.';
        return;
      }
    }
    this.pincodeError = '';
  }

  addAddress(): void {
    this.validatePincode();
    if (!this.country || !this.city || !this.address || !this.pincode) {
      this.errorMessage = 'Please fill all address fields.';
      return;
    }
    if (this.pincodeError) {
      this.errorMessage = 'Please fix the pincode before saving.';
      return;
    }
    this.userService
      .addAddress({ country: this.country, city: this.city, address: this.address, pincode: this.pincode })
      .subscribe(() => {
        this.country = 'India';
        this.city = '';
        this.address = '';
        this.pincode = '';
        this.errorMessage = '';
        this.pincodeError = '';
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
      error: (error) => {
        const raw = error?.error?.error || error?.error?.message || '';
        if (typeof raw === 'string' && raw.toLowerCase().includes('insufficient stock')) {
          // backend message looks like: "Insufficient stock for product: <name>"
          const product = raw.split(':').slice(1).join(':').trim();
          this.errorMessage = product
            ? `Quantity exceeds available stock for "${product}". Please reduce the quantity in your cart.`
            : 'Quantity exceeds available stock. Please reduce it in your cart.';
        } else if (raw) {
          this.errorMessage = raw;
        } else {
          this.errorMessage = 'Unable to place order.';
        }
      }
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