import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service'; // Adjust path as necessary

@Component({
  selector: 'app-booking-status',
  templateUrl: './booking-status.component.html',
  styleUrls: ['./booking-status.component.css'],
})
export class BookingStatusComponent implements OnInit {

  currentPage = 1;
  itemsPerPage = 10; 

  bookings: any[] = [];
  userId: number; // Ensure userId is of type number
  private baseUrl = 'http://localhost:3000/bookings/user'; // Base URL without :userId

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    // Retrieve user ID from local storage or AuthService
    const userIdString = this.authService.getUserId(); // Get userId as string
    this.userId = Number(userIdString); // Convert userId to number
    this.loadBookings();
  }

  formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);
    date.setHours(date.getHours() - 7); 
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    };
    return date.toLocaleString('en-GB', options); 
  }
  
  // loadBookings(): void {
  //   this.http.get(`${this.baseUrl}/${this.userId}`).subscribe(
  //     (data: any) => {
  //       this.bookings = data;
  //     },
  //     (error) => {
  //       console.error('Error fetching bookings:', error);
  //     }
  //   );
  // }
  loadBookings(): void {
  this.http.get(`${this.baseUrl}/${this.userId}`).subscribe(
    (data: any) => {
      // แปลงข้อมูลให้เป็น array แล้วจัดเรียงจาก bookingId มาก → น้อย
      this.bookings = (Array.isArray(data) ? data : [])
        .sort((a, b) => b.bookingId - a.bookingId);

      console.log('Sorted bookings:', this.bookings); // debug ดูได้
    },
    (error) => {
      console.error('Error fetching bookings:', error);
    }
  );
}

}
