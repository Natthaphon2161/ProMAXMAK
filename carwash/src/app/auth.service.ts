import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  userId: string;
  private apiUrl = 'http://localhost:3000'; // Your API backend URL
  private loggedIn = new BehaviorSubject<boolean>(false);
  private username: string | null = null;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      this.loggedIn.next(!!token);
      this.username = localStorage.getItem('username');
      this.isAuthenticatedSubject.next(!!token);
    }
  }

  getUserDetails() {
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null; // If not in browser, return null or handle accordingly
  }

  // Check if user is logged in
  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  // Login function
  login(username: string, password: string): Observable<any> {
    const credentials = { username, password };
    return this.http.post<any>(`${this.apiUrl}/api/login`, credentials)
      .pipe(
        map(response => {
          if (response.token) {
            this.setLoginData(response.token, username, response.user.role, response.userId); // Ensure userId is set
            return response;
          }
          throw new Error('Invalid login response');
        }),
        catchError(error => {
          console.error('Login error:', error);
          const errorMessage = error.error.message || 'Login failed';
          return throwError(() => new Error(errorMessage));
        })            
      );
  }

  // Get user profile with token
  getUserProfile(): Observable<any> {
    const token = localStorage.getItem('token');
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      return this.http.get<any>(`${this.apiUrl}/api/protected`, { headers })
        .pipe(
          catchError(error => {
            console.error('Profile fetch error:', error);
            return throwError(() => new Error('Failed to fetch user profile'));
          })
        );
    }
    return throwError(() => new Error('No token found'));
  }

  // Logout function
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
    }
    this.loggedIn.next(false);
    this.username = null;
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  // Set login data and update state
  setLoginData(token: string, username: string, role: string, userId: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      localStorage.setItem('role', role);
      localStorage.setItem('userId', userId); // Ensure userId is stored
      this.loggedIn.next(true);
      this.username = username;
      this.userId = userId; // Store the userId in the service
      this.isAuthenticatedSubject.next(true); // Update authentication state
    }
  }

  // Get username from the current session
  getUsername(): string | null {
    return this.username;
  }
  
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
  
  getUserId(): number | null {
    const userIdString = localStorage.getItem('userId');
    return userIdString ? Number(userIdString) : null; // Convert to number or return null
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }
}
