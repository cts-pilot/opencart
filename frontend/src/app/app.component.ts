import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { NavbarComponent } from './navbar/navbar.component';
import { CarouselComponent } from './carousel/carousel.component';
import { ProductCardComponent } from './product-card/product-card.component';
import { BrandsComponent } from './brands/brands.component';
import { FooterComponent } from './footer/footer.component';
import { NgFor } from '@angular/common';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,HeaderComponent,NavbarComponent,CarouselComponent,ProductCardComponent,BrandsComponent,NgFor,FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'democart';
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
