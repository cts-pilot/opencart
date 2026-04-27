import { Component, OnInit } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements OnInit {

  images = [
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1555117391-6c0795768da8?w=1400&q=80&auto=format&fit=crop'
  ];

  currentIndex = 0;

  ngOnInit() {
    setInterval(() => {
      this.next();
    }, 3000); // auto slide every 3 sec
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  prev() {
    this.currentIndex =
      (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  setSlide(index: number) {
    this.currentIndex = index;
  }
}