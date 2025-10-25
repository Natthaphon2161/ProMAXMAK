import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.css']
})
export class ServiceComponent {
  services = [
    { name: 'ล้างภายใน (Interior Wash)', description: 'ทำความสะอาดภายในอย่างครบถ้วน รวมถึงการดูดฝุ่นและทำความสะอาดพื้นผิวต่างๆ', prices: { S: 150, M: 150, L: 150, XL: 150 }, image: 'https://cdn.carsome.co.th/news/shutterstock_338971187-1-re.jpg' },
    { name: 'ล้างภายนอก (Exterior Wash)', description: 'ทำความสะอาดผิวภายนอกของรถเพื่อลบสิ่งสกปรกและฝุ่น', prices: { S: 100, M: 100, L: 100, XL: 100 }, image: 'https://autolifethailand.tv/wp-content/uploads/2022/03/shutterstock_1859193349s.jpg' },
    { name: 'เคลือบเงา (Polishing)', description: 'เพิ่มความเงางามของรถและปกป้องสีจากรังสี UV และฝุ่น', prices: { S: 150, M: 150, L: 150, XL: 150 }, image: 'https://upic.me/i/ty/resized_resized_img_4804.jpg' },
    { name: 'ขัดสี (Color Correction)', description: 'ลบรอยขีดข่วนเล็กน้อยและคืนความเงางามให้กับสีรถ', prices: { S: 220, M: 250, L: 280, XL: 300 }, image: 'https://kleansquare.com/wp-content/uploads/2023/03/%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%82%E0%B8%B1%E0%B8%94%E0%B8%AA%E0%B8%B5%E0%B8%A3%E0%B8%96-%E0%B8%94%E0%B9%89%E0%B8%A7%E0%B8%A2%E0%B8%97%E0%B8%B5%E0%B8%A1%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%AD%E0%B8%B2%E0%B8%8A%E0%B8%B5%E0%B8%9E-1024x675.jpg' },
    { name: 'ลบลอย (Scratch Removal)', description: 'ซ่อมแซมและลบรอยขีดข่วนหรือลอยบุบจากผิวรถ', prices: { S: 2500, M: 3000, L: 3500, XL: 4000 }, image: 'https://kleansquare.com/wp-content/uploads/2022/12/%E0%B8%A7%E0%B8%B4%E0%B8%98%E0%B8%B5%E0%B8%82%E0%B8%B1%E0%B8%94%E0%B8%AA%E0%B8%B5%E0%B8%A3%E0%B8%96%E0%B8%AD%E0%B8%A2%E0%B9%88%E0%B8%B2%E0%B8%87%E0%B9%84%E0%B8%A3%E0%B9%83%E0%B8%AB%E0%B9%89%E0%B8%96%E0%B8%B9%E0%B8%81%E0%B8%A7%E0%B8%B4%E0%B8%98%E0%B8%B5.png' },
    { name: 'ซักเบาะพรม (Seat and Carpet Cleaning)', description: 'ทำความสะอาดเบาะและพรมภายในโดยการซักเพื่อขจัดสิ่งสกปรกและคราบ', prices: { S: 100, M: 100, L: 100, XL: 100 }, image: 'https://www.carsome.co.th/news/wp-content/uploads/news/%E0%B8%8B%E0%B8%B1%E0%B8%81%E0%B9%80%E0%B8%9A%E0%B8%B2%E0%B8%B0%E0%B8%9C%E0%B9%89%E0%B8%B2%E0%B8%96%E0%B9%89%E0%B8%B2%E0%B8%88%E0%B8%B3%E0%B9%80%E0%B8%9B%E0%B9%87%E0%B8%99-re-1024x683.jpg' },
    { name: 'เคลือบแก้ว (Glass Coating)', description: 'เคลือบแก้วเพื่อปกป้องสีรถจากรอยขีดข่วนและสิ่งสกปรก', prices: { S: 8500, M: 9500, L: 12500, XL: 14500 }, image: 'https://cdn.carsome.co.th/news/Car-coating_11zon.jpg' },
    { name: 'เคลือบเซรามิก (Ceramic Coating)', description: 'เคลือบเซรามิกเพื่อเพิ่มการปกป้องสีและคงความเงางามได้นานขึ้น', prices: { S: 8500, M: 9500, L: 12500, XL: 14500 }, image: 'https://thailand-forex.com/attachment.php?attachmentid=9257&d=1655364044' },
    { name: 'ล้างห้องเครื่อง (Engine Bay Cleaning)', description: 'ทำความสะอาดห้องเครื่องเพื่อลบคราบน้ำมันและฝุ่น', prices: { S: 500, M: 500, L: 500, XL: 500 }, image: 'https://www.tqm.co.th/gallery/6682.jpg' },
    { name: 'ติดฟิล์มกรองแสง (Tinting Film)', description: 'ติดฟิล์มกรองแสงเพื่อช่วยลดความร้อนและป้องกันรังสี UV', prices: { S: 1500, M: 2500, L: 3500, XL: 4500 }, image: 'https://f.ptcdn.info/237/081/000/ryfqjn23myps9ws1CrY13-o.jpg' },
  ];

  filteredServices = this.services;

  searchQuery: string = '';

  constructor(private router: Router) {}

  searchServices() {
    if (this.searchQuery) {
      this.filteredServices = this.services.filter(service =>
        service.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    } else {
      this.filteredServices = this.services;
    }
  }

  bookService(service: any) {
    this.router.navigate(['/booking'], { queryParams: { serviceId: service.name } });
  }
}
