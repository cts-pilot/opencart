import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions } from 'chart.js';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

// Models
interface ReviewData {
  customerName: string;
  rating: number;
  comment: string;
  productName: string;
  date: Date;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: number;
  orderDate: Date;
  expectedDelivery?: Date;
}

@Component({
  selector: 'app-seller',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="seller-container">
      <!-- Sidebar Navigation -->
      <div class="sidebar-container">
        <button class="hamburger" (click)="toggleSidebar()" aria-label="Toggle menu">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>

        <aside class="sidebar" [class.open]="sidebarOpen()">
          <div class="sidebar-header">
            <h2>Seller Dashboard</h2>
            <button class="close-btn" (click)="closeSidebar()">×</button>
          </div>

          <nav class="sidebar-nav">
            <div class="nav-item">
              <button class="nav-link active" (click)="closeSidebar()">
                <span class="nav-icon">📊</span>
                <span class="nav-label">Dashboard</span>
              </button>
            </div>
            <div class="nav-item">
              <button class="nav-link" (click)="closeSidebar()">
                <span class="nav-icon">📦</span>
                <span class="nav-label">Products</span>
              </button>
            </div>
            <div class="nav-item">
              <button class="nav-link" (click)="closeSidebar()">
                <span class="nav-icon">🛒</span>
                <span class="nav-label">Orders</span>
              </button>
            </div>
            <div class="nav-item">
              <button class="nav-link" (click)="closeSidebar()">
                <span class="nav-icon">⭐</span>
                <span class="nav-label">Reviews</span>
              </button>
            </div>
            <div class="nav-item">
              <button class="nav-link" (click)="closeSidebar()">
                <span class="nav-icon">📈</span>
                <span class="nav-label">Analytics</span>
              </button>
            </div>
            <div class="nav-item">
              <button class="nav-link" (click)="closeSidebar()">
                <span class="nav-icon">⚙️</span>
                <span class="nav-label">Settings</span>
              </button>
            </div>
          </nav>

          <div class="sidebar-footer">
            <button class="logout-btn" (click)="logout()">
              <span class="nav-icon">🚪</span>
              Logout
            </button>
          </div>
        </aside>

        <div 
          class="sidebar-backdrop" 
          *ngIf="sidebarOpen()"
          (click)="closeSidebar()"
        ></div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <div class="dashboard-container">
          <div class="dashboard-header">
            <h1>Dashboard</h1>
            <p>Welcome back! Here's your business overview.</p>
          </div>

          <!-- Key Metrics -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-icon">📊</div>
              <div class="metric-content">
                <p class="metric-label">Total Revenue</p>
                <p class="metric-value">$78,000</p>
                <p class="metric-change positive">↑ 12.5% from last month</p>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">📦</div>
              <div class="metric-content">
                <p class="metric-label">Total Orders</p>
                <p class="metric-value">720</p>
                <p class="metric-change positive">↑ 8.2% from last month</p>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">⭐</div>
              <div class="metric-content">
                <p class="metric-label">Average Rating</p>
                <p class="metric-value">4.8/5</p>
                <p class="metric-change">From 245 reviews</p>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">📈</div>
              <div class="metric-content">
                <p class="metric-label">Conversion Rate</p>
                <p class="metric-value">3.2%</p>
                <p class="metric-change positive">↑ 0.5% from last month</p>
              </div>
            </div>
          </div>

          <!-- Charts Section -->
          <div class="charts-section">
            <div class="charts-grid">
              <!-- Sales Distribution Chart -->
              <div class="chart-item">
                <div class="chart-container">
                  <h3>Sales Distribution</h3>
                  <canvas 
                    baseChart
                    [type]="'doughnut'"
                    [data]="salesDistributionData"
                    [options]="chartOptions"
                  ></canvas>
                </div>
              </div>

              <!-- Order Status Chart -->
              <div class="chart-item">
                <div class="chart-container">
                  <h3>Order Status Distribution</h3>
                  <canvas 
                    baseChart
                    [type]="'doughnut'"
                    [data]="orderStatusData"
                    [options]="chartOptions"
                  ></canvas>
                </div>
              </div>

              <!-- Product Performance Chart -->
              <div class="chart-item">
                <div class="chart-container">
                  <h3>Top Products Performance</h3>
                  <canvas 
                    baseChart
                    [type]="'doughnut'"
                    [data]="productPerformanceData"
                    [options]="chartOptions"
                  ></canvas>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Orders -->
          <div class="card" style="margin-top: 40px;">
            <div class="card-header">
              <h3>Recent Orders</h3>
              <a href="#" class="view-all">View All →</a>
            </div>

            <div class="orders-table">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Items</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let order of getRecentOrders()">
                    <td class="order-id">{{ order.orderNumber }}</td>
                    <td>{{ order.customerName }}</td>
                    <td class="amount">\${{ order.totalAmount.toFixed(2) }}</td>
                    <td class="items">{{ order.items }}</td>
                    <td>
                      <span class="status-badge" [class]="'status-' + order.status">
                        {{ formatStatus(order.status) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Recent Reviews -->
          <div class="card" style="margin-top: 40px; margin-bottom: 40px;">
            <div class="card-header">
              <h3>Recent Reviews</h3>
              <span class="review-count">{{ reviews().length }} Total</span>
            </div>

            <div class="reviews-list">
              <div class="review-item" *ngFor="let review of getRecentReviews()">
                <div class="review-header">
                  <span class="customer-name">{{ review.customerName }}</span>
                  <span class="rating">{{ '⭐'.repeat(review.rating) }}</span>
                </div>
                <p class="product-name">{{ review.productName }}</p>
                <p class="comment">{{ review.comment }}</p>
                <span class="review-date">{{ formatDate(review.date) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .seller-container {
      display: flex;
      min-height: 100vh;
      background: #f8fafc;
    }

    .sidebar-container {
      position: relative;
    }

    .hamburger {
      display: flex;
      flex-direction: column;
      cursor: pointer;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      padding: 8px;
      gap: 4px;
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 1000;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .hamburger:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .hamburger-line {
      width: 24px;
      height: 3px;
      background-color: white;
      border-radius: 2px;
      transition: all 0.3s ease;
    }

    .sidebar {
      position: fixed;
      left: -280px;
      top: 0;
      height: 100vh;
      width: 280px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      z-index: 999;
      transition: left 0.3s ease;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .sidebar.open {
      left: 0;
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sidebar-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .close-btn {
      display: none;
      background: none;
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .sidebar-nav {
      flex: 1;
      padding: 20px 0;
      display: flex;
      flex-direction: column;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      background: none;
      border: none;
      color: white;
      font-size: 15px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
      border-left: 4px solid transparent;
    }

    .nav-link:hover {
      background: rgba(255, 255, 255, 0.1);
      border-left-color: white;
      padding-left: 22px;
    }

    .nav-link.active {
      background: rgba(255, 255, 255, 0.2);
      border-left-color: white;
      font-weight: 600;
    }

    .nav-icon {
      font-size: 18px;
      min-width: 24px;
      text-align: center;
    }

    .nav-label {
      flex: 1;
    }

    .sidebar-footer {
      padding: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      border-radius: 6px;
      cursor: pointer;
      width: 100%;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .logout-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .sidebar-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 998;
    }

    .main-content {
      flex: 1;
      width: 100%;
      background: #f8fafc;
      min-height: 100vh;
    }

    .dashboard-container {
      padding: 30px;
    }

    .dashboard-header {
      margin-bottom: 40px;
    }

    .dashboard-header h1 {
      margin: 0 0 10px 0;
      color: #1e293b;
      font-size: 28px;
      font-weight: 700;
    }

    .dashboard-header p {
      margin: 0;
      color: #64748b;
      font-size: 14px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .metric-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .metric-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .metric-icon {
      font-size: 32px;
      min-width: 50px;
      text-align: center;
    }

    .metric-content {
      flex: 1;
    }

    .metric-label {
      margin: 0;
      color: #64748b;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-value {
      margin: 8px 0;
      color: #1e293b;
      font-size: 24px;
      font-weight: 700;
    }

    .metric-change {
      margin: 0;
      color: #64748b;
      font-size: 12px;
    }

    .metric-change.positive {
      color: #10b981;
    }

    .charts-section {
      background: transparent;
      margin-bottom: 40px;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
    }

    .chart-item {
      min-height: 400px;
    }

    .chart-container {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      height: 100%;
    }

    .chart-container h3 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 16px;
      font-weight: 600;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid #f0f0f0;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #f0f0f0;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1.3rem;
      color: #333;
    }

    .view-all {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      transition: color 0.3s ease;
    }

    .view-all:hover {
      color: #764ba2;
    }

    .review-count {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .orders-table {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    thead {
      background: #f9fafb;
      border-bottom: 2px solid #f0f0f0;
    }

    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #666;
    }

    tbody tr {
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s ease;
    }

    tbody tr:hover {
      background-color: #fafafa;
    }

    td {
      padding: 12px;
    }

    .order-id {
      font-weight: 600;
      color: #667eea;
    }

    .amount {
      font-weight: 600;
      color: #10b981;
    }

    .items {
      text-align: center;
      background: #f9fafb;
      border-radius: 4px;
      font-weight: 500;
    }

    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: capitalize;
    }

    .status-pending {
      background: #fef3c7;
      color: #d97706;
    }

    .status-processing {
      background: #e0e7ff;
      color: #667eea;
    }

    .status-shipped {
      background: #dbeafe;
      color: #0284c7;
    }

    .status-delivered {
      background: #dcfce7;
      color: #16a34a;
    }

    .status-cancelled {
      background: #fee2e2;
      color: #dc2626;
    }

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .review-item {
      padding: 15px;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      transition: all 0.3s ease;
      background: #fafafa;
    }

    .review-item:hover {
      border-color: #667eea;
      background: #f5f7ff;
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .customer-name {
      font-weight: 600;
      color: #333;
      font-size: 0.95rem;
    }

    .rating {
      color: #f59e0b;
      font-size: 0.9rem;
      letter-spacing: 2px;
    }

    .product-name {
      margin: 6px 0;
      font-size: 0.85rem;
      color: #667eea;
      font-weight: 500;
    }

    .comment {
      margin: 8px 0;
      font-size: 0.9rem;
      color: #555;
      line-height: 1.4;
      font-style: italic;
    }

    .review-date {
      display: block;
      margin-top: 8px;
      font-size: 0.8rem;
      color: #999;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 20px;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .charts-grid {
        grid-template-columns: 1fr;
      }

      .dashboard-header h1 {
        font-size: 22px;
      }

      .close-btn {
        display: block;
      }

      .main-content {
        margin-left: 0;
      }
    }
  `]
})
export class SellerComponent implements OnInit {
  sidebarOpen = signal(false);
  reviews = signal<ReviewData[]>([]);
  orders = signal<Order[]>([]);

  constructor(private router: Router, private authService: AuthService) {}

  chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      }
    }
  };

  salesDistributionData: any;
  orderStatusData: any;
  productPerformanceData: any;

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'seller') {
      this.router.navigate(['/login']);
      return;
    }

    this.initializeDummyData();
    this.initializeCharts();
  }

  private initializeDummyData() {
    const dummyReviews: ReviewData[] = [
      {
        customerName: 'Santosh',
        rating: 5,
        comment: 'Excellent product! Very high quality and fast delivery.',
        productName: 'Wireless Bluetooth Headphones',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        customerName: 'Jaswwanth',
        rating: 4,
        comment: 'Good quality. Works as expected.',
        productName: 'USB-C Fast Charging Cable',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        customerName: 'Vaishnavi',
        rating: 5,
        comment: 'Amazing value for money! Highly recommended.',
        productName: 'Portable Power Bank 20000mAh',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        customerName: 'Sathya',
        rating: 4,
        comment: 'Pretty good product. Minor issues but overall satisfied.',
        productName: 'Wireless Mouse Pro',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        customerName: 'Mahendra',
        rating: 5,
        comment: 'Perfect for my setup. Great quality and build.',
        productName: 'Mechanical Keyboard RGB',
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
      }
    ];

    const dummyOrders: Order[] = [
      {
        id: '1',
        orderNumber: 'ORD-001234',
        customerName: 'Santosh',
        totalAmount: 234.50,
        status: 'delivered',
        items: 3,
        orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        expectedDelivery: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        orderNumber: 'ORD-001235',
        customerName: 'Jaswwanth',
        totalAmount: 89.99,
        status: 'shipped',
        items: 2,
        orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: '3',
        orderNumber: 'ORD-001236',
        customerName: 'Vaishnavi',
        totalAmount: 156.75,
        status: 'processing',
        items: 4,
        orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: '4',
        orderNumber: 'ORD-001237',
        customerName: 'Sathya',
        totalAmount: 445.20,
        status: 'pending',
        items: 5,
        orderDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
        expectedDelivery: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
      },
      {
        id: '5',
        orderNumber: 'ORD-001238',
        customerName: 'Mahendra',
        totalAmount: 67.50,
        status: 'delivered',
        items: 1,
        orderDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        expectedDelivery: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ];

    this.reviews.set(dummyReviews);
    this.orders.set(dummyOrders);
  }

  private initializeCharts() {
    this.salesDistributionData = {
      labels: ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books'],
      datasets: [
        {
          data: [25000, 18000, 15000, 12000, 8000],
          backgroundColor: [
            '#667eea',
            '#764ba2',
            '#f093fb',
            '#4facfe',
            '#00f2fe'
          ],
          borderColor: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'],
          borderWidth: 2
        }
      ]
    };

    this.orderStatusData = {
      labels: ['Delivered', 'Processing', 'Shipped', 'Pending', 'Cancelled'],
      datasets: [
        {
          data: [450, 120, 85, 45, 20],
          backgroundColor: [
            '#10b981',
            '#3b82f6',
            '#f59e0b',
            '#ef4444',
            '#6b7280'
          ],
          borderColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'],
          borderWidth: 2
        }
      ]
    };

    this.productPerformanceData = {
      labels: ['Wireless Headphones', 'USB-C Cable', 'Phone Case', 'Screen Protector', 'Power Bank'],
      datasets: [
        {
          data: [280, 215, 180, 145, 120],
          backgroundColor: [
            '#8b5cf6',
            '#ec4899',
            '#f97316',
            '#06b6d4',
            '#14b8a6'
          ],
          borderColor: ['#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#14b8a6'],
          borderWidth: 2
        }
      ]
    };
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  getRecentOrders() {
    return this.orders()
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, 5);
  }

  getRecentReviews() {
    return this.reviews().slice(0, 5);
  }

  formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatDate(date: Date): string {
    const now = new Date();
    const daysAgo = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
    return new Date(date).toLocaleDateString();
  }

  logout() {
    console.log('Logout clicked');
    // Add your logout logic here
  }
}
