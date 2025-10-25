import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  model: any = {};

  constructor(private http: HttpClient, private router: Router) {}
  
  onSubmit(signupForm: NgForm) {
    if (signupForm.invalid) {
      Swal.fire({
        icon: 'warning',
        text: 'Please fill in all required fields correctly.'
      });
      return;
    }

    if (this.model.password !== this.model.confirmpassword) {
      Swal.fire({
        icon: 'error',
        text: 'Passwords do not match',
      });
      return;
    }

    this.http.post('http://localhost:3000/signup', this.model)
      .subscribe(
        response => {
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 500,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.onmouseenter = Swal.stopTimer;
              toast.onmouseleave = Swal.resumeTimer;
            }
          });

          Swal.fire({
            icon: 'success',
            title: 'Registered successfully'
          });

          this.router.navigate(['/login']);
        },
        error => {
      
          console.error('Registration error:', error);
          
   
          let errorMessage = 'Registration failed';
          if (error.status === 400) {
            errorMessage = 'Username or Email already exists';
          }

          Swal.fire({
            icon: 'error',
            text: errorMessage,
          });
        }
      );
  }
}
