import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
    fname='';
    lname='';
    email='';
    password='';
    constructor(private router: Router){}
    register(){
      console.log(this.fname,this.email,this.password);
      this.router.navigate(['/home']);
    }

}
