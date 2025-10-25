import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Chart, ChartConfiguration, ChartData } from 'chart.js';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';

interface Booking {
  bookingId: number;
  firstname: string;
  lastname: string;
  phonenumber: string;
  servicetype: string;
  datetime: string;
  status: string;
  totalPrice: number;
  formattedDateTime?: string;
}

@Component({
  selector: 'app-booking-dashboard',
  templateUrl: './booking-dashboard.component.html',
  styleUrls: ['./booking-dashboard.component.css']
})
export class BookingDashboardComponent implements OnInit, AfterViewInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  dailySummary: { date: string; totalBookings: number; totalRevenue: number }[] = [];
  monthlySummary: { month: string; totalBookings: number; totalRevenue: number }[] = [];
  yearlySummary: { year: string; totalBookings: number; totalRevenue: number }[] = [];
  pendingBookings = 0;
  inProgressBookings = 0;
  completedBookings = 0;
  rejectedBookings = 0;
  searchTerm = '';
  filterStatus = '';
  filterDate = '';
  filterTime = '';
  filterServiceType = '';
  serviceTypes = [
    'Interior Wash', 'Exterior Wash', 'Polishing', 'Color Correction', 'Scratch Removal',
    'Seat and Carpet Cleaning', 'Glass Coating', 'Ceramic Coating', 'Engine Bay Cleaning', 'Tinting Film'
  ];
  apiUrl = 'http://localhost:3000/api/bookings';
  isLoading = false;
  message = '';
  selectedDailySummary: any;
  selectedMonthlySummary: any;
  selectedYearlySummary: any;
  private bookingChart: Chart | undefined;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.http.get<Booking[]>(this.apiUrl).subscribe(
      (data) => {
        this.bookings = data.map(booking => ({ ...booking, formattedDateTime: this.formatDateTime(booking.datetime) }));
        this.filteredBookings = this.bookings;
        this.updateBookingSummary();
        this.generateDailySummary();
        this.generateMonthlySummary();
        this.generateYearlySummary();
        this.createChart();
      },
      (error) => this.handleError('Failed to load bookings', error),
      () => this.isLoading = false
    );
  }

  formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);
    date.setHours(date.getHours() - 7);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
    return date.toLocaleString('en-GB', options);
  }

  generateDailySummary(): void {
    const summaryMap: { [key: string]: { totalBookings: number; totalRevenue: number } } = {};
    this.bookings.forEach(booking => {
      if (booking.status !== 'rejected') {
        const date = this.formatDateTime(booking.datetime).split(',')[0];
        const totalPrice = booking.totalPrice || 0;
        if (!summaryMap[date]) {
          summaryMap[date] = { totalBookings: 0, totalRevenue: 0 };
        }
        summaryMap[date].totalBookings += 1;
        summaryMap[date].totalRevenue += totalPrice;
      }
    });
    this.dailySummary = Object.entries(summaryMap).map(([date, { totalBookings, totalRevenue }]) => ({ date, totalBookings, totalRevenue }));
  }

  generateMonthlySummary(): void {
    const summaryMap: { [key: string]: { totalBookings: number; totalRevenue: number } } = {};
    this.bookings.forEach(booking => {
      if (booking.status !== 'rejected') {
        const date = new Date(booking.datetime);
        const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const totalPrice = booking.totalPrice || 0;
        if (!summaryMap[month]) {
          summaryMap[month] = { totalBookings: 0, totalRevenue: 0 };
        }
        summaryMap[month].totalBookings += 1;
        summaryMap[month].totalRevenue += totalPrice;
      }
    });
    this.monthlySummary = Object.entries(summaryMap).map(([month, { totalBookings, totalRevenue }]) => ({ month, totalBookings, totalRevenue }));
  }

  generateYearlySummary(): void {
    const summaryMap: { [key: string]: { totalBookings: number; totalRevenue: number } } = {};
    this.bookings.forEach(booking => {
      if (booking.status !== 'rejected') {
        const date = new Date(booking.datetime);
        const year = date.getFullYear().toString();
        const totalPrice = booking.totalPrice || 0;
        if (!summaryMap[year]) {
          summaryMap[year] = { totalBookings: 0, totalRevenue: 0 };
        }
        summaryMap[year].totalBookings += 1;
        summaryMap[year].totalRevenue += totalPrice;
      }
    });
    this.yearlySummary = Object.entries(summaryMap).map(([year, { totalBookings, totalRevenue }]) => ({ year, totalBookings, totalRevenue }));
  }

  applyFilter(): void {
    this.filteredBookings = this.bookings.filter(booking => this.isMatch(booking));
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterStatus = '';
    this.filterDate = '';
    this.filterTime = '';
    this.filterServiceType = '';
    this.applyFilter();
  }

  isMatch(booking: Booking): boolean {
    const fullName = `${booking.firstname} ${booking.lastname}`.toLowerCase();
    const serviceTypesArray = booking.servicetype.split(',').map(type => type.trim());
    return (
      (!this.searchTerm || fullName.includes(this.searchTerm.toLowerCase())) &&
      (!this.filterStatus || booking.status === this.filterStatus) &&
      (!this.filterDate || booking.datetime.startsWith(this.filterDate)) &&
      (!this.filterTime || this.formatDateTime(booking.datetime).startsWith(this.filterTime)) &&
      (!this.filterServiceType || serviceTypesArray.includes(this.filterServiceType))
    );
  }

  updateBookingSummary(): void {
    this.pendingBookings = this.bookings.filter(b => b.status === 'pending').length;
    this.inProgressBookings = this.bookings.filter(b => b.status === 'in-progress').length;
    this.completedBookings = this.bookings.filter(b => b.status === 'complete').length;
    this.rejectedBookings = this.bookings.filter(b => b.status === 'rejected').length;
  }

  updateStatus(bookingId: number, newStatus: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to update the booking status to "${newStatus}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'No, cancel!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.message = `Updating booking status to "${newStatus}"...`;
        this.http.patch(`${this.apiUrl}/${bookingId}/status`, { status: newStatus }).subscribe(
          () => {
            this.message = 'Booking status updated successfully.';
            this.loadBookings();
          },
          (error) => this.handleError('Failed to update booking status', error)
        );
      } else {
        this.message = 'Booking status update canceled.';
      }
    });
  }

  rejectBooking(bookingId: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You are about to reject this booking.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, reject it!',
      cancelButtonText: 'No, cancel!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.message = 'Rejecting booking...';
        this.http.patch(`${this.apiUrl}/${bookingId}/status`, { status: 'rejected' }).subscribe(
          () => {
            this.message = 'Booking has been rejected.';
            this.loadBookings();
          },
          (error) => this.handleError('Failed to reject booking', error)
        );
      } else {
        this.message = 'Booking rejection canceled.';
      }
    });
  }

  bookingsForDate(date: string) {
    return this.bookings.filter(booking => this.formatDateTime(booking.datetime).split(',')[0] === date);
  }

  bookingsForMonth(month: string) {
    return this.bookings.filter(booking => {
      const date = new Date(booking.datetime);
      const bookingMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      return bookingMonth === month && booking.status !== 'rejected';
    });
  }

  bookingsForYear(year: string) {
    return this.bookings.filter(booking => {
      const date = new Date(booking.datetime);
      return date.getFullYear().toString() === year && booking.status !== 'rejected';
    });
  }

  toggleDailyDetails(summary: { date: string }): void {
    if (this.selectedDailySummary && this.selectedDailySummary.date === summary.date) {
      this.selectedDailySummary = null;
    } else {
      this.selectedDailySummary = summary;
    }
  }

  toggleMonthlyDetails(summary: { month: string }): void {
    if (this.selectedMonthlySummary && this.selectedMonthlySummary.month === summary.month) {
      this.selectedMonthlySummary = null;
    } else {
      this.selectedMonthlySummary = summary;
    }
  }

  toggleYearlyDetails(summary: { year: string }): void {
    if (this.selectedYearlySummary && this.selectedYearlySummary.year === summary.year) {
      this.selectedYearlySummary = null;
    } else {
      this.selectedYearlySummary = summary;
    }
  }

  handleError(message: string, error: any): void {
    console.error(message, error);
    this.message = message;
    this.isLoading = false;
  }

  // ฟังก์ชัน map สถานะไปยัง Bootstrap badge class (เพิ่ม debug และ fallback)
  getStatusClass(status: string): string {
    const normalizedStatus = status.toLowerCase().trim();
    console.log('Checking status:', status, 'Normalized:', normalizedStatus); // Debug log
    switch (normalizedStatus) {
      case 'pending':
        return 'bg-warning text-dark'; // เหลือง
      case 'in-progress':
      case 'in progress':
        return 'bg-info text-white'; // น้ำเงิน
      case 'complete':
      case 'completed':
        return 'bg-success text-white'; // เขียว
      case 'rejected':
        return 'bg-danger text-white'; // แดง
      default:
        console.warn('Unknown status detected:', normalizedStatus); // Debug warn
        return 'bg-secondary text-white'; // สีเทา ถ้าไม่รู้จัก
    }
  }

  createChart(): void {
    if (isPlatformBrowser(this.platformId)) {
      const ctx = document.getElementById('bookingChart') as HTMLCanvasElement | null;
      if (ctx) {
        if (this.bookingChart) {
          this.bookingChart.destroy();
        }
        const chartData: ChartData<'doughnut'> = {
          labels: ['Pending', 'In Progress', 'Completed', 'Rejected'],
          datasets: [{
            data: [this.pendingBookings, this.inProgressBookings, this.completedBookings, this.rejectedBookings],
            backgroundColor: [
              'rgba(255, 206, 86, 0.8)',   // Yellow for Pending
              'rgba(54, 162, 235, 0.8)',   // Blue for In Progress
              'rgba(75, 192, 192, 0.8)',   // Teal for Completed
              'rgba(255, 99, 132, 0.8)'    // Red for Rejected
            ],
            borderColor: [
              'rgba(255, 206, 86, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 1
          }]
        };

        const chartConfig: ChartConfiguration = {
          type: 'doughnut' as const,
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Booking Status Distribution' }
            }
          }
        };

        this.bookingChart = new Chart(ctx, chartConfig);
      }
    }
  }
}