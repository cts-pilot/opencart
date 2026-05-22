import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';
import { OfferService } from '../offer.service';
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
  orderItems: Record<number, OrderItem[]> = {};
  expanded: Record<number, boolean> = {};
  isLoading = true;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private offerService: OfferService
  ) {}

  ngOnInit(): void {
    this.userService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders.sort((a, b) => {
          const ta = new Date(a.createdAt).getTime();
          const tb = new Date(b.createdAt).getTime();
          return tb - ta;
        });
        this.isLoading = false;
        this.orders.forEach((o) => this.loadItems(o.orderId));
      },
      error: () => {
        this.orders = [];
        this.isLoading = false;
      }
    });
  }

  loadItems(orderId: number): void {
    this.userService.getOrderItems(orderId).subscribe((items) => {
      this.orderItems[orderId] = items;
    });
  }

  toggleExpand(orderId: number): void {
    this.expanded[orderId] = !this.expanded[orderId];
  }

  unitPrice(item: OrderItem): number {
    // Prefer the snapshot captured at order placement; fall back to live offer
    // calculation for older orders that pre-date the snapshot column.
    if (item.unitPrice != null) return item.unitPrice;
    return this.offerService.discountedPrice(item.product);
  }

  unitOriginal(item: OrderItem): number {
    // If we snapshotted an offer, reconstruct the original unit price from
    // the captured discount so receipts stay frozen even if the seller
    // edits product.price later.
    if (item.unitPrice != null && item.offerPercent && item.offerPercent > 0) {
      return Math.round(item.unitPrice / (1 - item.offerPercent / 100));
    }
    if (item.unitPrice != null) return item.unitPrice;
    return item.product.price;
  }

  hasOffer(item: OrderItem): boolean {
    return (item.offerPercent ?? 0) > 0
      || (item.unitPrice == null && !!this.offerService.forProduct(item.product));
  }

  effectiveOfferPercent(item: OrderItem): number | null {
    if (item.offerPercent != null) return item.offerPercent;
    if (item.unitPrice == null) {
      return this.offerService.forProduct(item.product)?.discount ?? null;
    }
    return null;
  }

  lineTotal(item: OrderItem): number {
    return this.unitPrice(item) * item.qty;
  }
  lineOriginal(item: OrderItem): number {
    return this.unitOriginal(item) * item.qty;
  }

  orderTotal(orderId: number): number {
    const items = this.orderItems[orderId] || [];
    return items.reduce((sum, i) => sum + this.lineTotal(i), 0);
  }
  orderSavings(orderId: number): number {
    const items = this.orderItems[orderId] || [];
    return items.reduce((sum, i) => sum + (this.lineOriginal(i) - this.lineTotal(i)), 0);
  }
  orderItemCount(orderId: number): number {
    return (this.orderItems[orderId] || []).reduce((sum, i) => sum + (i.qty || 0), 0);
  }

  shortOrderId(orderId: number): string {
    return 'ORD-' + String(orderId).padStart(4, '0');
  }

  statusLabel(status?: string): string {
    if (!status) return '—';
    const s = status.toUpperCase();
    return s.charAt(0) + s.slice(1).toLowerCase();
  }
  statusClass(status?: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'DELIVERED') return 'st-delivered';
    if (s === 'SHIPPED') return 'st-shipped';
    if (s === 'PENDING') return 'st-pending';
    if (s === 'CANCELLED') return 'st-cancelled';
    return 'st-default';
  }

  /** Aggregate seller-level grouping for the receipt. */
  sellerGroups(orderId: number): Array<{ shopName: string; items: OrderItem[]; total: number }> {
    const items = this.orderItems[orderId] || [];
    const map = new Map<string, OrderItem[]>();
    for (const item of items) {
      const shop = item.product?.seller?.shopName || 'OpenCart Seller';
      if (!map.has(shop)) map.set(shop, []);
      map.get(shop)!.push(item);
    }
    return Array.from(map.entries()).map(([shopName, items]) => ({
      shopName,
      items,
      total: items.reduce((sum, i) => sum + this.lineTotal(i), 0)
    }));
  }

  customerName(): string {
    const u = this.authService.getCurrentUser();
    if (!u) return 'Customer';
    return `${u.fname ?? ''} ${u.lname ?? ''}`.trim() || 'Customer';
  }

  printReceipt(order: Order): void {
    const items = this.orderItems[order.orderId] || [];
    if (!items.length) {
      this.loadItems(order.orderId);
      setTimeout(() => this.printReceipt(order), 350);
      return;
    }

    const customer = this.customerName();
    const groups = this.sellerGroups(order.orderId);
    const total = this.orderTotal(order.orderId);
    const savings = this.orderSavings(order.orderId);
    const subtotal = total + savings;
    const placedAt = new Date(order.createdAt);
    const addr = order.address;

    const inr = (v: number) =>
      '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });

    const escape = (s: string) =>
      (s ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      } as Record<string, string>)[c]!);

    const groupHtml = groups
      .map((g) => `
        <section class="shop-block">
          <div class="shop-head">
            <span class="shop-icon">🏪</span>
            <span class="shop-name">${escape(g.shopName)}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th class="right">Unit</th>
                <th class="right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${g.items.map((i) => {
                const offerPct = this.effectiveOfferPercent(i);
                const hasOff = this.hasOffer(i);
                return `
                <tr>
                  <td>
                    <div class="item-name">${escape(i.product.productName)}</div>
                    ${offerPct ? `<div class="item-offer">${offerPct}% offer applied</div>` : ''}
                  </td>
                  <td>${i.qty}</td>
                  <td class="right">${inr(this.unitPrice(i))}${
                    hasOff ? ` <span class="was">${inr(this.unitOriginal(i))}</span>` : ''
                  }</td>
                  <td class="right">${inr(this.lineTotal(i))}</td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
          <div class="shop-total">
            <span>${escape(g.shopName)} subtotal</span>
            <strong>${inr(g.total)}</strong>
          </div>
        </section>
      `)
      .join('');

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escape(this.shortOrderId(order.orderId))} · Receipt</title>
<style>
  *{box-sizing:border-box}
  body{font-family:'Segoe UI',Tahoma,Geneva,sans-serif;color:#1f2937;margin:0;padding:32px;background:#fff;}
  .wrap{max-width:760px;margin:0 auto;}
  .head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;border-bottom:2px solid #0f172a;padding-bottom:18px;margin-bottom:18px;}
  .brand{display:flex;align-items:center;gap:12px;}
  .brand-mark{width:46px;height:46px;border-radius:10px;background:linear-gradient(135deg,#fbbf24,#d97706);color:#0f172a;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;}
  .brand-name{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-.3px;}
  .brand-tag{font-size:12px;color:#64748b;}
  .meta{text-align:right;font-size:13px;color:#374151;}
  .meta .label{color:#64748b;font-size:11.5px;text-transform:uppercase;letter-spacing:.6px;}
  .meta .value{font-weight:700;color:#0f172a;}
  .bill-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:20px;}
  .bill-box{background:#fafaf7;border:1px solid #f1e9d8;border-radius:10px;padding:14px 16px;}
  .bill-box h4{margin:0 0 6px;font-size:11.5px;color:#64748b;text-transform:uppercase;letter-spacing:.6px;font-weight:700;}
  .bill-box p{margin:0;font-size:13.5px;color:#0f172a;line-height:1.5;}
  .bill-box strong{display:block;color:#0f172a;font-size:14px;}
  table{width:100%;border-collapse:collapse;margin-top:8px;}
  th{text-align:left;font-size:11.5px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e5e7eb;padding:8px 6px;font-weight:700;}
  td{padding:10px 6px;font-size:13.5px;border-bottom:1px solid #f1f5f9;}
  td.right,th.right{text-align:right;}
  .item-name{font-weight:600;color:#0f172a;}
  .item-offer{font-size:11px;color:#b45309;margin-top:2px;font-weight:600;}
  .was{font-size:11.5px;color:#94a3b8;text-decoration:line-through;}
  .shop-block{margin-bottom:18px;}
  .shop-head{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#0f172a;color:#fbbf24;border-radius:8px;font-weight:700;font-size:14px;}
  .shop-icon{font-size:15px;}
  .shop-total{display:flex;justify-content:flex-end;gap:14px;padding:10px 6px;border-top:1px solid #e5e7eb;font-size:13.5px;color:#374151;}
  .shop-total strong{color:#b45309;font-size:15px;}
  .totals{margin-top:10px;padding-top:12px;border-top:2px solid #0f172a;}
  .totals .row{display:flex;justify-content:space-between;padding:5px 0;font-size:14px;}
  .totals .row.save{color:#047857;}
  .totals .row.grand{font-size:18px;font-weight:800;color:#0f172a;border-top:1px solid #e5e7eb;padding-top:12px;margin-top:6px;}
  .totals .row.grand strong{color:#b45309;}
  .foot{margin-top:24px;padding:14px;text-align:center;background:#fff7ed;border:1px solid #fde68a;border-radius:10px;font-size:12.5px;color:#78350f;}
  @media print{body{padding:18px;}.no-print{display:none;}}
  .print-btn{display:block;margin:18px auto 0;padding:10px 22px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0f172a;border:none;border-radius:999px;font-size:14px;font-weight:700;cursor:pointer;}
</style>
</head><body>
  <div class="wrap">
    <div class="head">
      <div class="brand">
        <div class="brand-mark">OC</div>
        <div>
          <div class="brand-name">OpenCart</div>
          <div class="brand-tag">Order receipt / Tax invoice</div>
        </div>
      </div>
      <div class="meta">
        <div class="label">Receipt no.</div>
        <div class="value">${escape(this.shortOrderId(order.orderId))}</div>
        <div class="label" style="margin-top:8px">Placed on</div>
        <div class="value">${placedAt.toLocaleString()}</div>
      </div>
    </div>

    <div class="bill-grid">
      <div class="bill-box">
        <h4>Billed to</h4>
        <strong>${escape(customer)}</strong>
        ${addr ? `<p>${escape(addr.address)}<br>${escape(addr.city)} — ${escape(addr.pincode)}<br>${escape(addr.country)}</p>` : ''}
      </div>
      <div class="bill-box">
        <h4>Order summary</h4>
        <p>${this.orderItemCount(order.orderId)} item(s) across ${groups.length} shop(s)</p>
        <strong style="margin-top:6px">${inr(total)}</strong>
      </div>
    </div>

    ${groupHtml}

    <div class="totals">
      ${savings > 0 ? `<div class="row"><span>Subtotal</span><span>${inr(subtotal)}</span></div>
      <div class="row save"><span>Offer savings</span><span>- ${inr(savings)}</span></div>` : ''}
      <div class="row grand"><span>Total paid</span><strong>${inr(total)}</strong></div>
    </div>

    <div class="foot">
      Thank you for shopping with OpenCart. Need help? Contact support@opencart.example
    </div>

    <button class="print-btn no-print" onclick="window.print()">🖨 Print this receipt</button>
  </div>
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  }
}