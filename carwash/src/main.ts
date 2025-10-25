/// <reference types="@angular/localize" />

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import 'bootstrap';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => {
    console.error('Error during bootstrap:', err);
    // สามารถเพิ่มการแจ้งเตือน UI ได้ที่นี่ถ้าต้องการ
  });