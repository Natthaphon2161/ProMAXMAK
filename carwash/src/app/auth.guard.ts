import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
  })
  export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) {}
  
    canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      const requiredRoles: string[] = route.data['roles'] || [];
      
      return this.authService.isAuthenticated$.pipe(  
        map(isAuthenticated => {
          if (!isAuthenticated) {
            this.router.navigate(['/login']);
            return false;
          }
  
          const userRole = this.authService.getRole();
          if (requiredRoles.length === 0 || requiredRoles.includes(userRole || '')) {
            return true;
          } else {
            this.router.navigate(['/home']);
            return false;
          }
        }),
        tap(isAuthenticated => {
          if (!isAuthenticated) {
            console.log('Access denied');
          }
        })
      );
    }
  }
  