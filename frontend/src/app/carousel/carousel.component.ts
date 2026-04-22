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
    'assets/Open cart logo.png',
    'assets/Open cart logo.png',
    'assets/Open cart logo.png'
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