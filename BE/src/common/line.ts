import axios from 'axios';
import * as crypto from 'crypto';
import { config } from './config';

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface FlexMessage {
  type: 'flex';
  altText: string;
  contents: any;
}

export interface TextMessage {
  type: 'text';
  text: string;
}

export type LineMessage = TextMessage | FlexMessage;

export class LineHelper {
  private static readonly LINE_API_BASE = 'https://api.line.me/v2';
  private static readonly MESSAGING_API_BASE = 'https://api.line.me/v2/bot';

  static verifySignature(body: string, signature: string): boolean {
    const hash = crypto
      .createHmac('SHA256', config.LINE_CHANNEL_SECRET)
      .update(body, 'utf8')
      .digest('base64');
    
    return hash === signature;
  }

  static async getProfile(accessToken: string): Promise<LineProfile> {
    try {
      const response = await axios.get(`${this.LINE_API_BASE}/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get LINE profile: ${error.message}`);
    }
  }

  static async pushMessage(userId: string, messages: LineMessage[]): Promise<void> {
    try {
      await axios.post(
        `${this.MESSAGING_API_BASE}/message/push`,
        {
          to: userId,
          messages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.LINE_MESSAGING_ACCESS_TOKEN}`,
          },
        },
      );
    } catch (error) {
      console.error('Failed to push LINE message:', error.response?.data || error.message);
      throw new Error(`Failed to push LINE message: ${error.message}`);
    }
  }

  static async replyMessage(replyToken: string, messages: LineMessage[]): Promise<void> {
    try {
      await axios.post(
        `${this.MESSAGING_API_BASE}/message/reply`,
        {
          replyToken,
          messages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.LINE_MESSAGING_ACCESS_TOKEN}`,
          },
        },
      );
    } catch (error) {
      console.error('Failed to reply LINE message:', error.response?.data || error.message);
      throw new Error(`Failed to reply LINE message: ${error.message}`);
    }
  }

  // Thai message templates
  static createBookingHoldMessage(bookingId: string, slotStart: string, expiresAt: string): TextMessage {
    return {
      type: 'text',
      text: `🎯 จองคิวสำเร็จ!\n\n📅 วันที่: ${slotStart}\n⏰ หมดอายุ: ${expiresAt}\n🆔 รหัสจอง: ${bookingId}\n\n💳 กรุณาชำระเงินมัดจำ 20 บาท และอัปโหลดสลิปภายในเวลาที่กำหนด`,
    };
  }

  static createPaymentPendingMessage(): TextMessage {
    return {
      type: 'text',
      text: '📋 จองแล้ว (รอตรวจสลิป)\n\nเรากำลังตรวจสอบสลิปการชำระเงินของคุณ กรุณารอสักครู่...',
    };
  }

  static createBookingConfirmedMessage(): TextMessage {
    return {
      type: 'text',
      text: '✅ ร้านยืนยันคิวของคุณแล้ว\n\nเรียบร้อย! คิวของคุณได้รับการยืนยันแล้ว เตรียมรถให้พร้อมนะคะ',
    };
  }

  static createPaymentRejectedMessage(reason: string): TextMessage {
    return {
      type: 'text',
      text: `❌ สลิปไม่ผ่าน\n\nเหตุผล: ${reason}\n\nกรุณาอัปโหลดสลิปใหม่หรือติดต่อเรา`,
    };
  }

  static createStatusUpdateMessage(status: string, statusText: string): TextMessage {
    const statusEmojis = {
      'PICKUP_ASSIGNED': '🏃‍♂️',
      'PICKED_UP': '🚗',
      'IN_WASH': '🧽',
      'READY_FOR_RETURN': '✨',
      'ON_THE_WAY_RETURN': '🚚',
      'COMPLETED': '🎉',
    };

    const emoji = statusEmojis[status] || '📋';
    
    return {
      type: 'text',
      text: `${emoji} สถานะอัปเดต\n\n${statusText}`,
    };
  }

  static createBookingExpiredMessage(): TextMessage {
    return {
      type: 'text',
      text: '⏰ คิวหมดอายุแล้ว\n\nคิวของคุณหมดอายุเนื่องจากไม่ได้ชำระเงินภายในเวลาที่กำหนด',
    };
  }

  static createLiffFlexMessage(): FlexMessage {
    return {
      type: 'flex',
      altText: 'จองคิวล้างรถมอเตอร์ไซค์',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '🏍️ จองคิวล้างรถ',
              weight: 'bold',
              size: 'xl',
              color: '#ffffff',
            },
          ],
          backgroundColor: '#3B82F6',
          paddingAll: 'lg',
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'กดปุ่มด้านล่างเพื่อจองคิวล้างรถมอเตอร์ไซค์',
              wrap: true,
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                uri: `https://liff.line.me/${config.LIFF_AUDIENCE}`,
                label: 'จองคิวเลย',
              },
              style: 'primary',
              color: '#3B82F6',
            },
          ],
        },
      },
    };
  }
}