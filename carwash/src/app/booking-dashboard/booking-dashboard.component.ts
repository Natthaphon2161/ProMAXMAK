import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import Chart, { ChartConfiguration, ChartData } from 'chart.js/auto';
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
  licenseplate: string;
}

@Component({
  selector: 'app-booking-dashboard',
  templateUrl: './booking-dashboard.component.html',
  styleUrls: ['./booking-dashboard.component.css']
})
export class BookingDashboardComponent implements OnInit, AfterViewInit {

  currentPage = 1;
  itemsPerPage = 10; 

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
  private bookingChart: Chart<'doughnut'> | null = null;
  private chartdaily: Chart | null = null;
  private chartmonthly: Chart | null = null;
  private chartyearly: Chart | null = null;

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
        this.renderDailySummaryChart();
        this.renderMonthlySummaryChart();
        this.renderYearlySummaryChart();
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

    this.dailySummary = Object.entries(summaryMap)
      .map(([date, { totalBookings, totalRevenue }]) => ({ date, totalBookings, totalRevenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // เรียงวัน
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
    this.monthlySummary = Object.entries(summaryMap)
    .map(([month, { totalBookings, totalRevenue }]) => ({ month, totalBookings, totalRevenue }))
    .sort((a, b) => {
      const [yearA, monthA] = a.month.split('-').map(Number);
      const [yearB, monthB] = b.month.split('-').map(Number);
      return yearA === yearB ? monthA - monthB : yearA - yearB;
    });
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
        console.warn('Unknown status detected:', normalizedStatus); // Debug warn3
        return 'bg-secondary text-white'; // สีเทา ถ้าไม่รู้จัก
    }
  }

  createChart(): void {
  if (!isPlatformBrowser(this.platformId)) return;

  const canvas = document.getElementById('bookingChart') as HTMLCanvasElement | null;
  if (!canvas) return;

  // เคลียร์กราฟเดิม
  if (this.bookingChart) {
    this.bookingChart.destroy();
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // ไล่เฉดสีให้ดูมีมิติเหมือน 3D
  const gradY = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradY.addColorStop(0, 'rgba(255, 206, 86, 1)');
  gradY.addColorStop(1, 'rgba(200, 160, 40, 1)');

  const gradB = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradB.addColorStop(0, 'rgba(54, 162, 235, 1)');
  gradB.addColorStop(1, 'rgba(30, 110, 180, 1)');

  const gradTeal = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradTeal.addColorStop(0, 'rgba(75, 192, 192, 1)');
  gradTeal.addColorStop(1, 'rgba(40, 140, 140, 1)');

  const gradR = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradR.addColorStop(0, 'rgba(255, 99, 132, 1)');
  gradR.addColorStop(1, 'rgba(200, 50, 90, 1)');

  // เงาให้ชิ้นกราฟดูนูน (type แคสต์ any กัน type error)
  const shadowPlugin: any = {
    id: 'sliceShadow',
    beforeDatasetDraw: (chart: any) => {
      const { ctx } = chart;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 10;
    },
    afterDatasetDraw: (chart: any) => {
      chart.ctx.restore();
    }
  };

  const chartData: ChartData<'doughnut', number[], string> = {
    labels: ['Pending', 'In Progress', 'Completed', 'Rejected'],
    datasets: [{
      data: [
        this.pendingBookings,
        this.inProgressBookings,
        this.completedBookings,
        this.rejectedBookings
      ],
      backgroundColor: [gradY, gradB, gradTeal, gradR],
      borderColor: 'rgba(255,255,255,0.9)',
      borderWidth: 2,
      hoverOffset: 10,
      spacing: 2
      // ❌ ห้ามใส่ cutout ตรงนี้
    }]
  };

  const chartConfig: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      // ✅ ใส่ cutout ที่ options ของ doughnut
      cutout: '35%',
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Booking Status Distribution' }
      },
      // ลด option animation ให้เรียบๆ กัน type mismatch
      animation: {
        duration: 900
      }
    },
    plugins: [shadowPlugin]
  };

  // แนะนำให้ประกาศตัวแปรเป็น Chart<'doughnut'> เพื่อให้ type ตรง
  this.bookingChart = new Chart(canvas, chartConfig);
}


  renderDailySummaryChart(): void {
  if (this.chartdaily) {
    this.chartdaily.destroy();
  }

  // 🔹 เอาเฉพาะ 5 วันล่าสุด
  const recentData = this.dailySummary
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-5);

  const labels = recentData.map(s => s.date);
  const bookingsData = recentData.map(s => s.totalBookings);
  const revenueData = recentData.map(s => s.totalRevenue);

  const data: ChartConfiguration<'line'>['data'] = {
    labels,
    datasets: [
      {
        label: 'Total Bookings',
        data: bookingsData,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.2)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Total Revenue (THB)',
        data: revenueData,
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.2)',
        fill: true,
        tension: 0.3,
        yAxisID: 'y1', // ใช้แกน y ขวา
      },
    ],
  };

  const config: ChartConfiguration<'line'> = {
    type: 'line',
    data,
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        title: {
          display: true,
          text: 'Last 5 Days — Bookings & Revenue',
          font: { size: 16 },
        },
        tooltip: { enabled: true },
        legend: { position: 'top' },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Bookings' },
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Revenue (THB)' },
        },
      },
    },
  };

  this.chartdaily = new Chart('dailySummaryChart', config);
}


  renderMonthlySummaryChart(): void {
    if (this.chartmonthly) {
      this.chartmonthly.destroy();
    }

    const labels = this.monthlySummary.map(s => {
    const [y, m] = s.month.split('-').map(Number);
    return new Date(y, m - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
    });
    const bookingsData = this.monthlySummary.map(s => s.totalBookings);
    const revenueData = this.monthlySummary.map(s => s.totalRevenue);

    const data: ChartConfiguration<'line'>['data'] = {
      labels,
      datasets: [
        {
          label: 'Total Bookings',
          data: bookingsData,
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.2)',
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Total Revenue (THB)',
          data: revenueData,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.2)',
          fill: true,
          tension: 0.3,
          yAxisID: 'y1', // ใช้แกน y ขวา
        },
      ],
    };

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data,
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          title: {
            display: true,
            text: 'Monthly Bookings',
            font: { size: 16 },
          },
          tooltip: { enabled: true },
          legend: { position: 'top' },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Bookings' },
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Revenue (THB)' },
          },
        },
      },
    };

    this.chartmonthly = new Chart('monthlySummaryChart', config);
  }

  renderYearlySummaryChart(): void {
    if (this.chartyearly) {
      this.chartyearly.destroy();
    }

    const labels = this.yearlySummary.map(s => s.year);
    const bookingsData = this.yearlySummary.map(s => s.totalBookings);
    const revenueData = this.yearlySummary.map(s => s.totalRevenue);

    const data: ChartConfiguration<'line'>['data'] = {
      labels,
      datasets: [
        {
          label: 'Total Bookings',
          data: bookingsData,
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.2)',
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Total Revenue (THB)',
          data: revenueData,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.2)',
          fill: true,
          tension: 0.3,
          yAxisID: 'y1', // ใช้แกน y ขวา
        },
      ],
    };

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data,
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          title: {
            display: true,
            text: 'Yearly Bookings & Revenue',
            font: { size: 16 },
          },
          tooltip: { enabled: true },
          legend: { position: 'top' },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Bookings' },
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Revenue (THB)' },
          },
        },
      },
    };

    this.chartyearly = new Chart('YearlySummaryChart', config);
  }
  sortColumn: string = '';
sortDirection: 'asc' | 'desc' = 'asc';

sortTable(column: string): void {
  // ถ้าคลิกคอลัมน์เดิม → สลับทิศทาง asc/desc
  if (this.sortColumn === column) {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }

  // จัดเรียง
  this.filteredBookings.sort((a: any, b: any) => {
    let valueA = a[column];
    let valueB = b[column];

    // แปลงวันที่ให้เทียบได้ถูก
    if (column === 'formattedDateTime') {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    }

    // แปลง string → lowercase เพื่อเทียบไม่สนตัวพิมพ์
    if (typeof valueA === 'string') valueA = valueA.toLowerCase();
    if (typeof valueB === 'string') valueB = valueB.toLowerCase();

    if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

// แสดง icon ▲▼ ในหัวตาราง
getSortIcon(column: string): string {
  if (this.sortColumn !== column) return '';
  return this.sortDirection === 'asc' ? 'bi bi-caret-up-fill' : 'bi bi-caret-down-fill';
}
}