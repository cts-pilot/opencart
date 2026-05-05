import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SellerService } from '../seller.service';
import { OrderItem } from '../api.types';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seller-orders.component.html',
  styleUrl: './seller-orders.component.css'
})
export class SellerOrdersComponent implements OnInit {
  orders: OrderItem[] = [];
  isLoading = true;

  statuses = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  constructor(private sellerService: SellerService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.sellerService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: () => {
        this.orders = [];
        this.isLoading = false;
      }
    });
  }

  updateStatus(order: OrderItem, status: string): void {
    this.sellerService.updateOrderStatus(order.orderItemId, status).subscribe(() => this.loadOrders());
  }
}