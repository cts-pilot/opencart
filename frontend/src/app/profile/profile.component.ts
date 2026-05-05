import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { UserService } from '../user.service';
import { Address } from '../api.types';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  userEmail: string = '';
  firstName: string = '';
  lastName: string = '';
  isLoading = true;
  message = '';
  addressMessage = '';
  addresses: Address[] = [];
  addressCountry = '';
  addressCity = '';
  addressLine = '';
  addressPincode = '';
  editingAddressId: number | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || currentUser.role !== 'user') {
      this.router.navigate(['/login']);
      return;
    }

    this.userService.getProfile().subscribe({
      next: (profile) => {
        this.userEmail = profile.email;
        this.firstName = profile.firstName;
        this.lastName = profile.lastName;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });

    this.loadAddresses();
  }

  loadAddresses(): void {
    this.userService.getAddresses().subscribe({
      next: (addresses) => (this.addresses = addresses),
      error: () => (this.addressMessage = 'Unable to load addresses.')
    });
  }

  saveProfile(): void {
    this.message = '';
    this.userService
      .updateProfile({ firstName: this.firstName, lastName: this.lastName, email: this.userEmail })
      .subscribe({
        next: () => {
          this.message = 'Profile updated.';
        },
        error: () => {
          this.message = 'Unable to update profile.';
        }
      });
  }

  editAddress(address: Address): void {
    this.editingAddressId = address.addressId;
    this.addressCountry = address.country;
    this.addressCity = address.city;
    this.addressLine = address.address;
    this.addressPincode = address.pincode;
    this.addressMessage = '';
  }

  cancelAddressEdit(): void {
    this.editingAddressId = null;
    this.addressCountry = '';
    this.addressCity = '';
    this.addressLine = '';
    this.addressPincode = '';
  }

  saveAddress(): void {
    this.addressMessage = '';

    if (!this.addressCountry || !this.addressCity || !this.addressLine || !this.addressPincode) {
      this.addressMessage = 'Please fill all address fields.';
      return;
    }

    const payload = {
      country: this.addressCountry,
      city: this.addressCity,
      address: this.addressLine,
      pincode: this.addressPincode
    };

    const request$ = this.editingAddressId
      ? this.userService.updateAddress(this.editingAddressId, payload)
      : this.userService.addAddress(payload);

    request$.subscribe({
      next: () => {
        this.addressMessage = this.editingAddressId ? 'Address updated.' : 'Address added.';
        this.cancelAddressEdit();
        this.loadAddresses();
      },
      error: () => {
        this.addressMessage = 'Unable to save address.';
      }
    });
  }

  deleteAddress(addressId: number): void {
    this.addressMessage = '';
    this.userService.deleteAddress(addressId).subscribe({
      next: () => {
        this.addressMessage = 'Address deleted.';
        this.loadAddresses();
      },
      error: () => {
        this.addressMessage = 'Unable to delete address.';
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
