import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router'; // Import Router
import { AuthService } from './auth.service'; // Adjust the path as necessary

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  username: string | null = null;
  userRole: string = '';

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router // Inject Router
  ) {}

  ngOnInit(): void {
    this.authService.isLoggedIn().subscribe(
      loggedIn => {
        this.isLoggedIn = loggedIn;
        if (this.isLoggedIn) {
          this.username = this.authService.getUsername();
          this.userRole = this.authService.getRole();
          console.log('Is Logged In:', this.isLoggedIn);
          console.log('Username:', this.username); // Debug statement
        } else {
          this.username = null; // Clear username if not logged in
          this.userRole = ''; // Clear user role if not logged in
        }
        this.cdr.detectChanges(); // Ensure Angular detects changes
      },
      error => {
        console.error('Error fetching login status', error);
      }
    );
  }

  onLogout(): void {
    this.authService.logout();
    // Redirect to the login page or home page after logout
    this.router.navigate(['/login']); // Adjust to your login route
  }
}
