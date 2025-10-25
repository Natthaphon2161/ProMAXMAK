import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service'; // Ensure the correct path
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  isLoading: boolean = false; // Added loading state
  message: any;

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit(): void {
    if (this.username && this.password) {
      this.isLoading = true;
      this.authService.login(this.username, this.password).subscribe(
        response => {
          this.isLoading = false;
          const token = response.token;
          const userRole = response.user.role;
          const userId = response.user.id;
  
          this.authService.setLoginData(token, this.username, userRole, userId);
  
          console.log('Login response:', response);
          console.log('User role:', userRole);
  
          setTimeout(() => {
            if (userRole === 'manager') {
              console.log('Navigating to booking-dashboard');
              this.router.navigate(['/booking-dashboard']);
            } else {
              console.log('Navigating to home');
              this.router.navigate(['/home']);
            }
          }, 0);
  
          Swal.fire({
            icon: 'success',
            title: 'Login successfully'
          });
        },
        error => {
          this.isLoading = false;
          console.error('Login error:', error);
  
          Swal.fire({
            icon: 'error',
            title: 'Login failed',
            text: error.error?.message || 'Invalid username or password'
          });
        }
      );
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Missing fields',
        text: 'Please enter both username and password'
      });
    }
  }
}
