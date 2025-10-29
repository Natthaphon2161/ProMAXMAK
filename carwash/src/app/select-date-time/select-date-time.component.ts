import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

type DayCell = {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isDisabled: boolean;
  selected: boolean;
};

interface ApiAvailabilityResponse {
  /** แบบเก่า: รายชื่อชั่วโมงที่ถูกจองในวันนั้น (เช่น ['09:00','13:00']) */
  occupied?: string[];

  bookedDateTimes?: string[];
}
@Component({
  selector: 'app-select-date-time',
  templateUrl: './select-date-time.component.html',
  styleUrl: './select-date-time.component.css'
})
export class SelectDateTimeComponent implements OnInit {
  @Input() selectedStaff: string | null = null;

  /** ตั้งค่าได้ เช่น 09:00-18:00 รอบละ 1 ชม. */
  @Input() openingHour = 9;
  @Input() closingHour = 18;

  /** endpoint เช่น GET /api/availability?date=YYYY-MM-DD */
  @Input() availabilityApi = 'http://localhost:3000/api/availability';

  /** ถ้า API ส่ง 'YYYY-MM-DDTHH:mm' ที่ "หมายถึง UTC" แต่ไม่มี Z/offset ให้ตั้ง true */
  @Input() apiTimesAreUtc = true;

  /** ส่งผลลัพธ์กลับให้ parent */
  @Output() picked = new EventEmitter<{ date: string; time: string }>();

  // UI state
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthLabel = '';
  days: DayCell[] = [];
  displayedMonth = new Date(); // เดือนที่แสดง
  selectedDate: Date | null = null;
  selectedSlot: string | null = null;

  slots: string[] = [];
  isLoadingSlots = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // เริ่มที่ต้นเดือนปัจจุบัน
    const today = new Date();
    this.displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.buildCalendar();
  }

  /** สร้างกริดปฏิทินของเดือนที่กำลังแสดง */
  buildCalendar(): void {
    const y = this.displayedMonth.getFullYear();
    const m = this.displayedMonth.getMonth();
    this.monthLabel = this.displayedMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const firstOfMonth = new Date(y, m, 1);

    // เริ่มวันอาทิตย์
    const startOffset = firstOfMonth.getDay(); // 0..6 (Sun..Sat)

    // จำนวน cell = 42 (6 สัปดาห์)
    const cells: DayCell[] = [];
    const startDate = new Date(y, m, 1 - startOffset);

    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const inMonth = d.getMonth() === m;

      const today = new Date();
      const isToday =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();

      // ห้ามเลือกวันอดีต
      const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const midnightToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isDisabled = midnight < midnightToday;

      const selected =
        !!this.selectedDate &&
        d.getFullYear() === this.selectedDate.getFullYear() &&
        d.getMonth() === this.selectedDate.getMonth() &&
        d.getDate() === this.selectedDate.getDate();

      cells.push({ date: d, inMonth, isToday, isDisabled, selected });
    }

    this.days = cells;
  }

  prevMonth(): void {
    this.displayedMonth = new Date(this.displayedMonth.getFullYear(), this.displayedMonth.getMonth() - 1, 1);
    this.selectedDate = null;
    this.selectedSlot = null;
       this.slots = [];
    this.buildCalendar();
  }

  nextMonth(): void {
    this.displayedMonth = new Date(this.displayedMonth.getFullYear(), this.displayedMonth.getMonth() + 1, 1);
    this.selectedDate = null;
    this.selectedSlot = null;
    this.slots = [];
    this.buildCalendar();
  }

  selectDate(cell: DayCell): void {
    if (cell.isDisabled) return;
    this.selectedDate = new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate());
    this.selectedSlot = null;
    this.slots = [];
    this.days = this.days.map(c => ({ ...c, selected: c.date.toDateString() === this.selectedDate!.toDateString() }));
    this.loadSlotsForSelectedDate();
  }

  /** โหลด slot (ทุก 1 ชั่วโมง) และ filter ช่องที่ถูกจองออก */
  loadSlotsForSelectedDate(): void {
    if (!this.selectedDate) return;
    this.isLoadingSlots = true;

    // สร้างรายการ slot ทั้งวันก่อน (เช่น 09:00 .. 17:00)
    const allSlots: string[] = [];
    for (let h = this.openingHour; h < this.closingHour; h++) {
      allSlots.push(this.formatTime(h, 0)); // 09:00, 10:00, ...
    }

    // เรียก API เพื่อเอาเวลาที่ถูกจองไปแล้วของวันนั้น
    const ymd = this.toYMD(this.selectedDate);
    const params = new HttpParams().set('date', ymd); // e.g. '2025-10-30'

    this.http.get<ApiAvailabilityResponse>(this.availabilityApi, { params }).subscribe({
      next: (resp) => {
        const rawTimes = (resp?.bookedDateTimes ?? resp?.occupied ?? []).map(t => t.trim());

        // แปลงเวลาให้เป็น local 'YYYY-MM-DDTHH:mm'
        const localTimes = rawTimes.map(t => {
          const hasTZ = /Z$|[+\-]\d{2}:\d{2}$/.test(t);                   // มี Z หรือ +07:00
          const bareIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t);     // ไม่มีโซน
          if (hasTZ) {
            return this.convertUtcIsoToLocalString(t);                   // มีโซน → แปลงเป็น local
          } else if (bareIso && this.apiTimesAreUtc) {
            return this.convertBareUtcToLocalString(t);                  // ไม่มีโซนแต่เป็น UTC → แปลง
          } else {
            return t;                                                    // เป็น local อยู่แล้ว
          }
        });

        // สกัดเฉพาะ 'HH:mm'
        const occupied = new Set(localTimes.map(t => t.slice(11, 16)));

        // เอาช่องว่างที่ยังไม่ถูกจองออกมาแสดง
        this.slots = allSlots.filter(t => !occupied.has(t));
        this.isLoadingSlots = false;
      },
      error: () => {
        // ถ้า API ยังไม่พร้อม: แสดงทั้งหมดก่อนก็ได้
        this.slots = allSlots;
        this.isLoadingSlots = false;
      },
    });
  }

  selectSlot(t: string): void {
    this.selectedSlot = t;
  }

  clearSelection(): void {
    this.selectedSlot = null;
  }

  confirmSelection(): void {
    if (!this.selectedDate || !this.selectedSlot) return;
    this.picked.emit({
      date: this.toYMD(this.selectedDate),
      time: this.selectedSlot,
    });
  }

  // ===== Helpers =====

  private toYMD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatTime(h: number, m: number): string {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /** แปลง ISO (เช่น '2025-10-30T02:00:00Z' หรือมี offset) -> local 'YYYY-MM-DDTHH:mm' */
  private convertUtcIsoToLocalString(iso: string): string {
    const d = new Date(iso); // parse พร้อม timezone
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    const hh   = String(d.getHours()).padStart(2, '0');
    const mi   = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  /** รับ 'YYYY-MM-DDTHH:mm' (ไม่มี Z) แต่หมายถึง UTC -> คืน local 'YYYY-MM-DDTHH:mm' */
  private convertBareUtcToLocalString(bareIso: string): string {
    const m = bareIso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!m) return bareIso; // รูปแบบไม่ตรงก็ปล่อยกลับ
    const [_, y, mo, d, h, mi] = m;
    // สร้าง Date จาก UTC ชัดเจน แล้วให้ JS แปลงเป็น local
    const dt = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi));
    const yyyy = dt.getFullYear();
    const mm2  = String(dt.getMonth() + 1).padStart(2, '0');
    const dd2  = String(dt.getDate()).padStart(2, '0');
    const hh2  = String(dt.getHours()).padStart(2, '0');
    const mi2  = String(dt.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm2}-${dd2}T${hh2}:${mi2}`;
  }

}