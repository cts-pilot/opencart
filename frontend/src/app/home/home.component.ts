import { Component } from '@angular/core';
import { CarouselComponent } from '../carousel/carousel.component';
import { ProductCardComponent } from '../product-card/product-card.component';
import { BrandsComponent } from '../brands/brands.component';
import { FooterComponent } from '../footer/footer.component';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CarouselComponent, ProductCardComponent, BrandsComponent, FooterComponent, NgFor],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  products = [
    {
      name: 'MacBook',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
      desc: 'Powerful laptop for work and creativity',
      price: '$1,299'
    },
    {
      name: 'iPhone',
      image: 'https://images.unsplash.com/photo-1594859275898-3022b3be0b98?auto=format&fit=crop&w=900&q=80',
      desc: 'Premium smartphone with smooth performance',
      price: '$999'
    },
    {
      name: 'Monitor',
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80',
      desc: 'Crisp display for productivity and entertainment',
      price: '$349'
    },
    {
      name: 'Camera',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
      desc: 'Capture moments with professional quality',
      price: '$749'
    },
    {
      name: 'Wireless Headphones',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
      desc: 'Premium audio with noise cancellation',
      price: '$299'
    },
    {
      name: 'Smart Watch',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
      desc: 'Stay connected with stylish tech',
      price: '$399'
    },
    {
      name: 'Tablet',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=80',
      desc: 'Portable tablet for work and entertainment',
      price: '$599'
    },
    {
      name: 'Mouse',
      image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80',
      desc: 'Precision gaming mouse with great accuracy',
      price: '$79'
    }
  ];
}
