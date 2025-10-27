import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import localeTh from '@angular/common/locales/th';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { SignupComponent } from './signup/signup.component';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { BookingComponent } from './booking/booking.component';
import { BookingDashboardComponent } from './booking-dashboard/booking-dashboard.component';
import { BookingStatusComponent } from './booking-status/booking-status.component';
import { ServiceTypeComponent } from './service-type/service-type.component';
import { ServiceComponent } from './service/service.component';
import { CarsizeComponent } from './carsize/carsize.component';
import { NgxPaginationModule } from 'ngx-pagination';
// Register Thai locale
registerLocaleData(localeTh, 'th');

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SignupComponent,
    LoginComponent,
    ProfileComponent,
    BookingComponent,
    BookingDashboardComponent,
    BookingStatusComponent,
    ServiceTypeComponent,
    ServiceComponent,
    CarsizeComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    CommonModule,
    AppRoutingModule,
    FormsModule,
    NgxPaginationModule,
    ReactiveFormsModule,
    
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: LOCALE_ID, useValue: 'th' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }