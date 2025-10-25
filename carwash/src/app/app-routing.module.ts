import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ProfileComponent } from './profile/profile.component';
import { BookingComponent } from './booking/booking.component';
import { BookingDashboardComponent } from './booking-dashboard/booking-dashboard.component';
import { BookingStatusComponent } from './booking-status/booking-status.component';
import { ServiceTypeComponent } from './service-type/service-type.component';
import { ServiceComponent } from './service/service.component';
import { CarsizeComponent } from './carsize/carsize.component';
import { AuthGuard } from './auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent },
  { path: 'service', component: ServiceComponent },
  { path: 'carsize', component: CarsizeComponent },
  { 
    path: 'service-type', 
    component: ServiceTypeComponent, 
    canActivate: [AuthGuard], 
    data: { roles: ['manager'] }
  },
  { 
    path: 'booking-dashboard', 
    component: BookingDashboardComponent, 
    canActivate: [AuthGuard], 
    data: { roles: ['manager'] }
  },
  { 
    path: 'profile', 
    component: ProfileComponent, 
    canActivate: [AuthGuard], 
    data: { roles: ['manager', 'customer'] }
  },
  { 
    path: 'booking', 
    component: BookingComponent, 
    canActivate: [AuthGuard], 
    data: { roles: ['manager', 'customer'] }
  },
  { 
    path: 'booking-status', 
    component: BookingStatusComponent, 
    canActivate: [AuthGuard], 
    data: { roles: ['manager', 'customer'] }
  },
  { path: '**', redirectTo: '/home', pathMatch: 'full' } // Wildcard route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }