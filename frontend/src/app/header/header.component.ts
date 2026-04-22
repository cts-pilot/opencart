import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  showCurrency = false;
  showAccount = false;

  currency = { code: 'USD', symbol: '$' };

  toggleCurrency() {
    this.showCurrency = !this.showCurrency;
    this.showAccount = false;
  }

  toggleAccount() {
    this.showAccount = !this.showAccount;
    this.showCurrency = false;
  }

  setCurrency(cur: string) {
    if (cur === 'USD') {
      this.currency = { code: 'USD', symbol: '$' };
    } else {
      this.currency = { code: 'INR', symbol: '₹' };
    }
    this.showCurrency = false;
  }
}