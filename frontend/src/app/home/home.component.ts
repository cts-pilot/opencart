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
      image: 'assets/Open cart logo.jpg',
      desc: 'Intel processor',
      price: '$602'
    },
    {
      name: 'iPhone',
      image: 'assets/Open cart logo.jpg',
      desc: 'Mobile phone',
      price: '$123'
    },
    {
      name: 'Monitor',
      image: 'assets/Open cart logo.jpg',
      desc: 'HD display',
      price: '$110'
    },
    {
      name: 'Camera',
      image: 'assets/Open cart logo.jpg',
      desc: 'DSLR',
      price: '$98'
    }
  ];
}
