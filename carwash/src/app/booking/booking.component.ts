import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { ProfileService } from '../profile.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {
  firstname: string = '';
  lastname: string = '';
  phonenumber: string = '';
  userId: number | null = null;
  servicetypes: { name: string; price: number; size: string }[] = [];
  selectedServices: { name: string; price: number }[] = [];
  totalPrice: number = 0;
  datetime: string = '';
  licenseplate: string = '';
  size: string = '';
  isLoading: boolean = false;
  filteredServices: { name: string; price: number; size: string }[] = [];
  sizes: string[] = ['S', 'M', 'L', 'XL'];
  maxSelectedServices: number = 3; 
  minDateTime: string = '';

  private apiUrl = 'http://localhost:3000/api/bookings';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadServiceTypes();
    this.setMinDateTime();
  }

  setMinDateTime(): void {
    const now = new Date();
    // Set minimum date and time to the current date and time
    this.minDateTime = now.toISOString().slice(0, 16);
  }

  loadUserProfile(): void {
    const username = this.authService.getUsername();
    if (username) {
      this.profileService.getProfile(username).subscribe(
        (profile) => {
          this.firstname = profile.firstname;
          this.lastname = profile.lastname;
          this.phonenumber = profile.phonenumber || '';
          this.userId = Number(profile.userId);
        },
        (error) => {
          console.error('Failed to load user profile', error);
        }
      );
    }
  }

  loadServiceTypes(): void {
    this.http.get<{ name: string; price: number; size: string }[]>('http://localhost:3000/api/servicetypes').subscribe(
      (data) => {
        this.servicetypes = data;
      },
      (error) => {
        console.error('Failed to load service types', error);
      }
    );
  }

  onSizeChange(): void {
    this.filteredServices = this.servicetypes.filter(service => service.size === this.size);
    this.selectedServices = [];
    this.totalPrice = 0;
  }

  onServiceTypeChange(service: string, price: number, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (isChecked) {
      if (this.selectedServices.length < this.maxSelectedServices) {
        this.selectedServices.push({ name: service, price });
      } else {
        (event.target as HTMLInputElement).checked = false;
        Swal.fire({
          title: 'Warning',
          text: `You can only select up to ${this.maxSelectedServices} services.`,
          icon: 'warning',
          confirmButtonText: 'OK',
        });
      }
    } else {
      this.selectedServices = this.selectedServices.filter(s => s.name !== service);
    }

    this.calculateTotalPrice();
  }

  calculateTotalPrice(): void {
    this.totalPrice = this.selectedServices.reduce((total, service) => total + service.price, 0);
  }

  onSubmit(bookingForm: NgForm): void {
    if (bookingForm.invalid || this.selectedServices.length === 0 || this.userId === null) {
      Swal.fire({
        title: 'Validation Error!',
        text: 'Please fill out all required fields and select at least one service.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }

    const selectedDateTime = new Date(this.datetime);
    const now = new Date();
    // Check if the selected date is in the past
    if (selectedDateTime < now) {
      Swal.fire({
        title: 'Invalid Date & Time!',
        text: 'Please select a date and time that is in the future.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }

    const serviceNames = this.selectedServices.map(service => service.name).join(', ');

    const bookingData = {
      firstname: this.firstname,
      lastname: this.lastname,
      phonenumber: this.phonenumber,
      services: this.selectedServices,
      datetime: this.datetime,
      licenseplate: this.licenseplate,
      size: this.size,
      userId: this.userId,
      totalPrice: this.totalPrice,
    };

    Swal.fire({
      title: 'Confirm Booking',
      text: `Are you sure you want to book: ${serviceNames}? Total Price: $${this.totalPrice}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, book it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;

        this.http.post(this.apiUrl, bookingData).subscribe(
          (response) => {
            this.isLoading = false;
            Swal.fire({
              title: 'Success!',
              text: 'Your booking has been confirmed.',
              icon: 'success',
              confirmButtonText: 'OK',
            }).then(() => {
              this.router.navigate(['/booking-status']);
            });
          },
          (error) => {
            this.isLoading = false;
            const errorMessage = error.error.message || 'Please try again.';
            Swal.fire({
              title: 'Error!',
              text: errorMessage,
              icon: 'error',
              confirmButtonText: 'OK',
            });
          }
        );
      }
    });
  }
}
