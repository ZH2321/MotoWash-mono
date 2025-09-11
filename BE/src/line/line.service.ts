import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseService } from '../db/supabase';
import { LineHelper, LineMessage } from '../common/line';
import { config } from '../common/config';

interface LineEvent {
  type: string;
  source: {
    type: string;
    userId: string;
  };
  replyToken?: string;
  message?: {
    type: string;
    text: string;
  };
  follow?: any;
  unfollow?: any;
}

@Injectable()
export class LineService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = supabaseService;
  }

  async handleEvent(event: LineEvent): Promise<void> {
    console.log('Handling LINE event:', event.type);

    try {
      switch (event.type) {
        case 'message':
          await this.handleMessage(event);
          break;
        case 'follow':
          await this.handleFollow(event);
          break;
        case 'unfollow':
          await this.handleUnfollow(event);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling LINE event:', error.message);
    }
  }

  private async handleMessage(event: LineEvent): Promise<void> {
    if (!event.message || event.message.type !== 'text') {
      return;
    }

    const userId = event.source.userId;
    const messageText = event.message.text.toLowerCase().trim();
    const replyToken = event.replyToken;

    if (!replyToken) {
      return;
    }

    let replyMessages: LineMessage[] = [];

    switch (messageText) {
      case 'จองคิว':
      case 'book':
      case 'booking':
        replyMessages = [
          {
            type: 'text',
            text: '🏍️ ยินดีต้อนรับสู่บริการจองคิวล้างรถมอเตอร์ไซค์!\n\nกดปุ่มด้านล่างเพื่อเริ่มจองคิว',
          },
          LineHelper.createLiffFlexMessage(),
        ];
        break;

      case 'เช็คสถานะ':
      case 'สถานะ':
      case 'status':
        const userBookings = await this.getUserBookings(userId);
        if (userBookings.length > 0) {
          const latestBooking = userBookings[0];
          replyMessages = [{
            type: 'text',
            text: `📋 สถานะล่าสุดของคุณ\n\n🆔 รหัสจอง: ${latestBooking.id}\n📅 วันที่: ${latestBooking.slotStart}\n📊 สถานะ: ${this.getStatusText(latestBooking.status)}`,
          }];
        } else {
          replyMessages = [{
            type: 'text',
            text: '📋 คุณยังไม่มีการจองคิว\n\nพิมพ์ "จองคิว" เพื่อเริ่มจองคิว',
          }];
        }
        break;

      case 'help':
      case 'ช่วยเหลือ':
      case 'คำสั่ง':
        replyMessages = [{
          type: 'text',
          text: '📖 คำสั่งที่ใช้ได้:\n\n• "จองคิว" - เริ่มจองคิวล้างรถ\n• "เช็คสถานะ" - ดูสถานะการจอง\n• "ช่วยเหลือ" - แสดงคำสั่งนี้\n\nหรือติดต่อเราโดยตรงได้เลย!',
        }];
        break;

      default:
        replyMessages = [{
          type: 'text',
          text: 'สวัสดีครับ! 👋\n\nพิมพ์ "จองคิว" เพื่อจองคิวล้างรถ\nพิมพ์ "เช็คสถานะ" เพื่อดูสถานะการจอง\nพิมพ์ "ช่วยเหลือ" เพื่อดูคำสั่งที่ใช้ได้',
        }];
        break;
    }

    if (replyMessages.length > 0) {
      await LineHelper.replyMessage(replyToken, replyMessages);
    }
  }

  private async handleFollow(event: LineEvent): Promise<void> {
    const userId = event.source.userId;
    const replyToken = event.replyToken;

    console.log(`User ${userId} followed the bot`);

    if (replyToken) {
      const welcomeMessages: LineMessage[] = [
        {
          type: 'text',
          text: '🎉 ยินดีต้อนรับสู่บริการจองคิวล้างรถมอเตอร์ไซค์!\n\n✨ บริการของเรา:\n• ล้างรถมอเตอร์ไซค์\n• รับ-ส่งถึงที่\n• จองคิวล่วงหน้า\n\nพิมพ์ "จองคิว" เพื่อเริ่มใช้งาน',
        },
        LineHelper.createLiffFlexMessage(),
      ];

      await LineHelper.replyMessage(replyToken, welcomeMessages);
    }
  }

  private async handleUnfollow(event: LineEvent): Promise<void> {
    const userId = event.source.userId;
    console.log(`User ${userId} unfollowed the bot`);
    
    // Optionally clean up user data or log the event
  }

  private async getUserBookings(lineUserId: string): Promise<any[]> {
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('id')
      .eq('line_user_id', lineUserId)
      .single();

    if (userError || !user) {
      return [];
    }

    const { data: bookings, error: bookingsError } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (bookingsError) {
      console.error('Failed to get user bookings:', bookingsError);
      return [];
    }

    return bookings || [];
  }

  private getStatusText(status: string): string {
    const statusTexts = {
      'HOLD_PENDING_PAYMENT': 'รอชำระเงิน',
      'AWAIT_SHOP_CONFIRM': 'รอตรวจสอบสลิป',
      'CONFIRMED': 'ยืนยันแล้ว',
      'PICKUP_ASSIGNED': 'พนักงานกำลังไปรับรถ',
      'PICKED_UP': 'รับรถแล้ว',
      'IN_WASH': 'กำลังล้างรถ',
      'READY_FOR_RETURN': 'พร้อมส่งคืน',
      'ON_THE_WAY_RETURN': 'กำลังส่งรถคืน',
      'COMPLETED': 'เสร็จสิ้น',
      'REVIEWED': 'รีวิวแล้ว',
      'REJECTED': 'ปฏิเสธ',
      'HOLD_EXPIRED': 'หมดอายุ',
      'CANCELLED': 'ยกเลิกแล้ว',
      'NO_SHOW': 'ไม่มาตามนัด',
    };

    return statusTexts[status] || status;
  }
}