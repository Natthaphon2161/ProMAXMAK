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
  filteredBookings: any[] = [];
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

  loadBookings(): void {
  this.http.get(`${this.baseUrl}/${this.userId}`).subscribe(
    (data: any) => {
      this.bookings = (Array.isArray(data) ? data : [])
        .sort((a, b) => b.bookingId - a.bookingId); // มาก→น้อยเริ่มต้น

      // ✅ โคลนไปที่ filteredBookings เพื่อไว้ใช้ sort/paginate
      this.filteredBookings = [...this.bookings];

      console.log('Sorted bookings:', this.bookings);
    },
    (error) => {
      console.error('Error fetching bookings:', error);
    }
  );
}


  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

sortTable(column: string): void {
  // คลิกซ้ำ → สลับทิศทาง
  if (this.sortColumn === column) {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }

  // ✅ จัดเรียงบน filteredBookings ที่ใช้แสดงจริง
  this.filteredBookings.sort((a: any, b: any) => {
    let valueA = a[column];
    let valueB = b[column];

    // วันที่: ใช้ฟิลด์ 'datetime' แล้วแปลงเป็น Date
    if (column === 'datetime') {
      valueA = new Date(a.datetime);
      valueB = new Date(b.datetime);
    }

    // ตัวอักษร: เปรียบเทียบแบบไม่สนตัวพิมพ์
    if (typeof valueA === 'string') valueA = valueA.toLowerCase();
    if (typeof valueB === 'string') valueB = valueB.toLowerCase();

    if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return this.sortDirection === 'asc' ?  1 : -1;
    return 0;
  });
}
  // แสดง icon ▲▼ ในหัวตาราง
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '';
    return this.sortDirection === 'asc' ? 'bi bi-caret-up-fill' : 'bi bi-caret-down-fill';
  }

}
