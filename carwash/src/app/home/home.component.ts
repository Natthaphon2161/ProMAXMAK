import { Component } from '@angular/core';

interface ChatMessage {
  type: 'user' | 'bot';
  text: string;
  timestamp?: Date;
}

interface Intent {
  keywords: string[];
  responses: string[];
  followUp?: string[];
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  chatMessages: ChatMessage[] = [];
  chatInput = '';
  showChatModal = false;
  isTyping = false;
  
  // Context tracking for AI-like behavior
  private conversationContext: string[] = [];
  private lastIntent: string = '';
  private userName: string = '';

  // Mock AI Agent Knowledge Base
  private intents: { [key: string]: Intent } = {
    greeting: {
      keywords: ['สวัสดี', 'หวัดดี', 'ดีจ้า', 'hello', 'hi', 'hey'],
      responses: [
        'สวัสดีครับ! 😊 ยินดีต้อนรับสู่ Shine & Drive ผมชื่อ Shine Bot พร้อมช่วยเหลือคุณเรื่องบริการล้างรธและโปรโมชั่นพิเศษ! 🎃',
        'หวัดดีครับ! 🙋‍♂️ ผมคือ Shine Bot ผู้ช่วยจาก Shine & Drive มีอะไรให้ช่วยไหมครับ?',
        'สวัสดีครับคุณลูกค้า! ✨ ยินดีที่ได้รู้จักนะครับ วันนี้มีโปรโมชั่นพิเศษด้วยนะ!'
      ],
      followUp: ['ลองถามเรื่องโปรโมชั่นหรือราคาบริการได้เลยครับ!']
    },
    
    halloween_promo: {
      keywords: ['โปรโมชั่น', 'โปร', 'ส่วนลด', 'ลด', 'ฮาโลวีน', 'halloween', 'ออฟเฟอร์'],
      responses: [
        '🎃 โปรโมชั่นฮาโลวีนพิเศษ! 🎃\n\n✨ ลด 20% ทุกบริการล้างรถ ตลอดเดือนตุลาคม!\n🎁 ฟรี! เคลือบแว็กซ์ + ตรวจเช็คฟรี\n⏰ โปรนี้ใช้ได้ถึงวันที่ 31 ตุลาคมนี้เท่านั้น!\n\nสนใจจองคิวไหมครับ? 😊',
        '🔥 โปรฮาโลวีนสุดพิเศษ! 🔥\n\nคุณจะได้:\n• ส่วนลด 20% ทันที\n• เคลือบแว็กซ์ฟรี (มูลค่า 500 บาท)\n• ตรวจเช็คสภาพรถฟรี\n\nคุ้มมากๆ ครับ! อยากจองเลยไหมครับ?'
      ],
      followUp: ['อยากทราบรายละเอียดเพิ่มเติมหรือจองคิวไหมครับ?']
    },
    
    pricing: {
      keywords: ['ราคา', 'ค่าบริการ', 'เท่าไหร่', 'เท่าไร', 'ค่าใช้จ่าย', 'price', 'cost'],
      responses: [
        '💰 รายการบริการและราคาของเรา:\n\n🚗 ล้างรถทั่วไป: 150 บาท\n✨ ล้างรถพร้อมแว็กซ์: 350 บาท  \n🌟 ล้างรถพรีเมียม (รวมดูดฝุ่น): 500 บาท\n💎 ล้างรถ VIP (รวมเคลือบสี): 800 บาท\n\n*ราคานี้ยังไม่รวมส่วนลดโปรโมชั่นนะครับ! 🎃',
        '📊 ราคาบริการของเรา:\n\nแพ็คเกจทั่วไป 150 บาท\nแพ็คเกจพร้อมแว็กซ์ 350 บาท\nแพ็คเกจพรีเมียม 500 บาท\nแพ็คเกจ VIP 800 บาท\n\nตอนนี้มีโปรฮาโลวีน ลด 20% ทุกแพ็คเกจด้วยนะครับ! 🎃'
      ],
      followUp: ['สนใจแพ็คเกจไหนครับ? แนะนำได้เลยครับ!']
    },
    
    services: {
      keywords: ['บริการ', 'ล้างรถ', 'service', 'ทำอะไรบ้าง', 'มีอะไรบ้าง'],
      responses: [
        '🚗 บริการของ Shine & Drive:\n\n✅ ล้างรถภายนอก-ภายใน\n✅ ขัดเคลือบสี\n✅ เคลือบแว็กซ์\n✅ ดูดฝุ่นภายในรถ\n✅ ทำความสะอาดพรมและเบาะ\n✅ ตรวจเช็คสภาพรถฟรี\n\nทุกบริการทำด้วยมืออาชีพและผลิตภัณฑ์คุณภาพครับ! ✨'
      ],
      followUp: ['สนใจบริการไหนเป็นพิเศษไหมครับ?']
    },
    
    booking: {
      keywords: ['จอง', 'นัดหมาย', 'booking', 'book', 'reserve', 'คิว'],
      responses: [
        '📅 การจองบริการ Shine & Drive:\n\n1️⃣ โทร: 02-XXX-XXXX\n2️⃣ Line: @shinedrive\n3️⃣ Facebook: Shine & Drive Official\n4️⃣ หน้าเว็บ: กดปุ่ม "จองเลย" ด้านล่าง\n\nแนะนำจองล่วงหน้า 1 วันเพื่อรับบริการที่ดีที่สุดครับ! 😊',
        '✨ จองง่ายมาก! เลือกช่องทางที่สะดวกเลยครับ:\n\n📞 โทรศัพท์: 02-XXX-XXXX\n💬 Line: @shinedrive  \n📘 Facebook Messenger\n🌐 จองผ่านเว็บไซต์\n\nช่วงไหนสะดวกครับ? ผมจะช่วยแนะนำเวลาที่ว่างให้!'
      ],
      followUp: ['ต้องการจองช่วงเวลาไหนครับ? เช้า บ่าย หรือเย็น?']
    },
    
    location: {
      keywords: ['สาขา', 'ที่ไหน', 'ที่อยู่', 'location', 'address', 'แผนที่'],
      responses: [
        '📍 สาขา Shine & Drive:\n\n🏢 สาขาหลัก: ถ.สุขุมวิท กรุงเทพฯ\n🏢 สาขา 2: ถ.พระราม 2 สมุทรสาคร\n🏢 สาขา 3: ถ.เทพารักษ์ สมุทรปราการ\n\n🕐 เปิดบริการ: 08:00 - 20:00 (ทุกวัน)\n\nต้องการดูแผนที่หรือเส้นทางไหมครับ? 🗺️'
      ],
      followUp: ['สาขาไหนใกล้คุณที่สุดครับ? จะได้แนะนำเส้นทางให้!']
    },
    
    time: {
      keywords: ['เวลา', 'เปิด', 'ปิด', 'กี่โมง', 'time', 'hours', 'open'],
      responses: [
        '🕐 เวลาทำการ Shine & Drive:\n\nเปิดบริการ: 08:00 - 20:00 น.\n📅 ทุกวัน (รวมวันหยุด)\n\n⏱️ ระยะเวลาในการล้างรถ:\n• แพ็คเกจทั่วไป: 30-45 นาที\n• แพ็คเกจพรีเมียม: 1-1.5 ชั่วโมง\n• แพ็คเกจ VIP: 2-3 ชั่วโมง\n\nวันนี้สะดวกมาช่วงไหนครับ? 😊'
      ]
    },
    
    quality: {
      keywords: ['คุณภาพ', 'ดีไหม', 'เป็นอย่างไร', 'รีวิว', 'review', 'quality'],
      responses: [
        '⭐ คุณภาพบริการของเรา:\n\n✅ ช่างมืออาชีพ มีประสบการณ์ 10+ ปี\n✅ ใช้ผลิตภัณฑ์นำเข้าคุณภาพสูง\n✅ การันตีความพึงพอใจ 100%\n✅ รีวิว 4.8/5 ดาว จากลูกค้ากว่า 10,000 คน\n✅ มีประกันความเสียหาย\n\nลองมาใช้บริการสักครั้งจะรู้เลยครับว่าคุ้มค่า! 💯'
      ],
      followUp: ['อยากลองใช้บริการไหมครับ? จองเลยได้นะ!']
    },
    
    payment: {
      keywords: ['จ่าย', 'ชำระ', 'payment', 'บัตร', 'เงินสด', 'โอน'],
      responses: [
        '💳 ช่องทางการชำระเงิน:\n\n✅ เงินสด\n✅ บัตรเครดิต/เดบิต (Visa, Master, JCB)\n✅ QR Code พร้อมเพย์\n✅ โอนผ่านธนาคาร\n✅ True Money Wallet\n\nสะดวก ปลอดภัย ครบทุกช่องทาง! 💰'
      ]
    },
    
    thanks: {
      keywords: ['ขอบคุณ', 'thank', 'ขอบใจ', 'คับ'],
      responses: [
        'ยินดีครับ! 😊 มีอะไรอีกไหมครับที่ผมช่วยได้?',
        'ด้วยความยินดีครับ! 🙏 Shine & Drive ยินดีให้บริการเสมอครับ',
        'เป็นเกียรติที่ได้ช่วยครับ! ✨ อย่าลืมโปรโมชั่นฮาโลวีนนะครับ 🎃'
      ]
    },
    
    goodbye: {
      keywords: ['บาย', 'ไป่ละ', 'bye', 'สวัสดี', 'ไปก่อน'],
      responses: [
        'บายบายครับ! 👋 แวะมาใช้บริการนะครับ ดูแลรถให้สะอาดสวยเสมอ! 🚗✨',
        'ไปละครับ! 😊 อย่าลืมโปรฮาโลวีนนะครับ รอคุณอยู่! 🎃',
        'แล้วพบกันใหม่ครับ! 🙏 ขอบคุณที่สนทนากับ Shine Bot นะครับ!'
      ]
    }
  };

  // Fallback responses when bot doesn't understand
  private fallbackResponses = [
    'ขอโทษครับ ผมไม่ค่อยเข้าใจคำถามนี้เท่าไหร่ 😅 ลองถามเรื่อง "โปรโมชั่น" "ราคา" "บริการ" หรือ "จองคิว" ได้เลยครับ!',
    'อืม... คำถามนี้ยากสำหรับผมนะครับ 🤔 ลองถามเรื่องบริการล้างรถ หรือโปรโมชั่นฮาโลวีนดูไหมครับ?',
    'เอ่อ... ผมไม่แน่ใจว่าจะตอบอย่างไรดีครับ 😊 ลองถามง่ายๆ เช่น "มีบริการอะไรบ้าง" หรือ "ราคาเท่าไร" ได้เลยครับ!'
  ];

  constructor() {
    this.initializeChat();
  }

  private initializeChat(): void {
    this.chatMessages = [
      { 
        type: 'bot', 
        text: 'สวัสดีครับ! ผมคือ Shine Bot 🤖 จาก Shine & Drive 🚗✨\n\nวันนี้มีโปรโมชั่นฮาโลวีนพิเศษ! ลด 20% ทุกบริการ 🎃\n\nอยากรู้อะไรเกี่ยวกับบริการล้างรถหรือโปรโมชั่นไหมครับ? 😊', 
        timestamp: new Date() 
      },
      { 
        type: 'bot', 
        text: '💡 ลองถามผมเรื่อง:\n• โปรโมชั่น\n• ราคาบริการ\n• จองคิว\n• สาขาและเวลาทำการ', 
        timestamp: new Date() 
      }
    ];
  }

  toggleChatModal(): void {
    this.showChatModal = !this.showChatModal;
    if (this.showChatModal) {
      setTimeout(() => this.scrollToBottom(), 300);
    }
  }

  closeChatModal(): void {
    this.showChatModal = false;
  }

  sendMessage(): void {
    if (this.chatInput.trim()) {
      const userMessage = this.chatInput.trim();
      
      // Add user message
      this.chatMessages.push({ 
        type: 'user', 
        text: userMessage, 
        timestamp: new Date() 
      });
      
      this.chatInput = '';
      this.isTyping = true;
      
      // Add to conversation context
      this.conversationContext.push(userMessage);
      if (this.conversationContext.length > 5) {
        this.conversationContext.shift(); // Keep only last 5 messages for context
      }

      // Simulate thinking time (more realistic)
      const thinkingTime = 800 + Math.random() * 700; // 800-1500ms
      
      setTimeout(() => {
        const botResponse = this.generateResponse(userMessage);
        this.chatMessages.push({ 
          type: 'bot', 
          text: botResponse, 
          timestamp: new Date() 
        });
        this.isTyping = false;
        this.scrollToBottom();
      }, thinkingTime);
    }
  }

  private generateResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    // Check for user name in greeting
    if (message.includes('ชื่อ') && !this.userName) {
      const nameMatch = message.match(/ชื่อ\s*(\S+)/);
      if (nameMatch) {
        this.userName = nameMatch[1];
        return `ยินดีที่ได้รู้จักครับคุณ${this.userName}! 😊 วันนี้มีอะไรให้ผมช่วยไหมครับ?`;
      }
    }

    // Intent recognition
    let bestMatch: string | null = null;
    let maxScore = 0;

    for (const [intentName, intent] of Object.entries(this.intents)) {
      let score = 0;
      for (const keyword of intent.keywords) {
        if (message.includes(keyword.toLowerCase())) {
          score++;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = intentName;
      }
    }

    // Generate response based on intent
    if (bestMatch && maxScore > 0) {
      this.lastIntent = bestMatch;
      const intent = this.intents[bestMatch];
      const response = intent.responses[Math.floor(Math.random() * intent.responses.length)];
      
      // Add follow-up if available
      if (intent.followUp && intent.followUp.length > 0) {
        const followUp = intent.followUp[Math.floor(Math.random() * intent.followUp.length)];
        return `${response}\n\n${followUp}`;
      }
      
      return response;
    }

    // Context-aware fallback
    if (this.lastIntent) {
      const contextResponse = this.getContextualResponse();
      if (contextResponse) {
        return contextResponse;
      }
    }

    // Generic fallback
    return this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)];
  }

  private getContextualResponse(): string | null {
    // Provide contextual help based on last intent
    const contextualHelp: { [key: string]: string } = {
      'halloween_promo': 'ถ้าสนใจโปรโมชั่นฮาโลวีน สามารถจองคิวได้เลยครับ! พิมพ์ "จอง" มาได้เลยครับ 😊',
      'pricing': 'ถ้าอยากรู้รายละเอียดแพ็คเกจเพิ่มเติม หรืออยากจองคิว บอกผมได้เลยครับ!',
      'services': 'สนใจบริการไหนเป็นพิเศษไหมครับ? หรืออยากรู้ราคาไหมครับ?',
      'booking': 'พร้อมช่วยจองคิวให้เลยครับ! บอกวันและเวลาที่สะดวกมาได้เลยครับ 😊'
    };

    return contextualHelp[this.lastIntent] || null;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.getElementById('chatContainer');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  scrollToBooking(): void {
    const bookingSection = document.getElementById('booking-section');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}