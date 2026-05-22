import { Injectable } from '@angular/core';
import { Product } from './api.types';

export interface Offer {
  discount: number;
  validUntil?: string | null;
}

@Injectable({ providedIn: 'root' })
export class OfferService {
  /** Reads the offer attached to the product. Returns null when none, or when expired. */
  forProduct(product?: Product | null): Offer | null {
    if (!product) return null;
    const percent = product.offerPercent;
    if (percent == null || percent <= 0) return null;

    if (product.offerValidUntil) {
      const expiry = new Date(product.offerValidUntil);
      if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
        return null;
      }
    }
    return { discount: percent, validUntil: product.offerValidUntil ?? null };
  }

  discountedPrice(product: Product): number {
    const offer = this.forProduct(product);
    if (!offer) return product.price;
    return Math.round(product.price * (1 - offer.discount / 100));
  }

  savings(product: Product): number {
    return product.price - this.discountedPrice(product);
  }
}