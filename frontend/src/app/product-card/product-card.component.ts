import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../api.types';
import { Offer, OfferService } from '../offer.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css']
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() addToCart = new EventEmitter<Product>();
  @Output() addToWishlist = new EventEmitter<Product>();

  constructor(private offerService: OfferService) {}

  get offer(): Offer | null {
    return this.offerService.forProduct(this.product);
  }

  get discountedPrice(): number {
    return this.offerService.discountedPrice(this.product);
  }
}