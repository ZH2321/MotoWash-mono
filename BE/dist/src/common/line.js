"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineHelper = void 0;
const axios_1 = require("axios");
const crypto = require("crypto");
const config_1 = require("./config");
class LineHelper {
    static verifySignature(body, signature) {
        const hash = crypto
            .createHmac('SHA256', config_1.config.LINE_CHANNEL_SECRET)
            .update(body, 'utf8')
            .digest('base64');
        return hash === signature;
    }
    static async getProfile(accessToken) {
        try {
            const response = await axios_1.default.get(`${this.LINE_API_BASE}/profile`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get LINE profile: ${error.message}`);
        }
    }
    static async pushMessage(userId, messages) {
        try {
            await axios_1.default.post(`${this.MESSAGING_API_BASE}/message/push`, {
                to: userId,
                messages,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config_1.config.LINE_MESSAGING_ACCESS_TOKEN}`,
                },
            });
        }
        catch (error) {
            console.error('Failed to push LINE message:', error.response?.data || error.message);
            throw new Error(`Failed to push LINE message: ${error.message}`);
        }
    }
    static async replyMessage(replyToken, messages) {
        try {
            await axios_1.default.post(`${this.MESSAGING_API_BASE}/message/reply`, {
                replyToken,
                messages,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config_1.config.LINE_MESSAGING_ACCESS_TOKEN}`,
                },
            });
        }
        catch (error) {
            console.error('Failed to reply LINE message:', error.response?.data || error.message);
            throw new Error(`Failed to reply LINE message: ${error.message}`);
        }
    }
    static createBookingHoldMessage(bookingId, slotStart, expiresAt) {
        return {
            type: 'text',
            text: `🎯 จองคิวสำเร็จ!\n\n📅 วันที่: ${slotStart}\n⏰ หมดอายุ: ${expiresAt}\n🆔 รหัสจอง: ${bookingId}\n\n💳 กรุณาชำระเงินมัดจำ 20 บาท และอัปโหลดสลิปภายในเวลาที่กำหนด`,
        };
    }
    static createPaymentPendingMessage() {
        return {
            type: 'text',
            text: '📋 จองแล้ว (รอตรวจสลิป)\n\nเรากำลังตรวจสอบสลิปการชำระเงินของคุณ กรุณารอสักครู่...',
        };
    }
    static createBookingConfirmedMessage() {
        return {
            type: 'text',
            text: '✅ ร้านยืนยันคิวของคุณแล้ว\n\nเรียบร้อย! คิวของคุณได้รับการยืนยันแล้ว เตรียมรถให้พร้อมนะคะ',
        };
    }
    static createPaymentRejectedMessage(reason) {
        return {
            type: 'text',
            text: `❌ สลิปไม่ผ่าน\n\nเหตุผล: ${reason}\n\nกรุณาอัปโหลดสลิปใหม่หรือติดต่อเรา`,
        };
    }
    static createStatusUpdateMessage(status, statusText) {
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
    static createBookingExpiredMessage() {
        return {
            type: 'text',
            text: '⏰ คิวหมดอายุแล้ว\n\nคิวของคุณหมดอายุเนื่องจากไม่ได้ชำระเงินภายในเวลาที่กำหนด',
        };
    }
    static createLiffFlexMessage() {
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
                                uri: `https://liff.line.me/${config_1.config.LIFF_AUDIENCE}`,
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
exports.LineHelper = LineHelper;
LineHelper.LINE_API_BASE = 'https://api.line.me/v2';
LineHelper.MESSAGING_API_BASE = 'https://api.line.me/v2/bot';
//# sourceMappingURL=line.js.map