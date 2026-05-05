import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { Order, OrderItem } from '../api.types';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  selectedOrderItems: Record<number, OrderItem[]> = {};
  isLoading = true;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getOrders().subscribe({
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

  toggleOrderItems(orderId: number): void {
    if (this.selectedOrderItems[orderId]) {
      delete this.selectedOrderItems[orderId];
      return;
    }

    this.userService.getOrderItems(orderId).subscribe((items) => {
      this.selectedOrderItems[orderId] = items;
    });
  }
}