"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../db/supabase");
const line_1 = require("../common/line");
let LineService = class LineService {
    constructor() {
        this.supabase = supabase_1.supabaseService;
    }
    async handleEvent(event) {
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
        }
        catch (error) {
            console.error('Error handling LINE event:', error.message);
        }
    }
    async handleMessage(event) {
        if (!event.message || event.message.type !== 'text') {
            return;
        }
        const userId = event.source.userId;
        const messageText = event.message.text.toLowerCase().trim();
        const replyToken = event.replyToken;
        if (!replyToken) {
            return;
        }
        let replyMessages = [];
        switch (messageText) {
            case 'จองคิว':
            case 'book':
            case 'booking':
                replyMessages = [
                    {
                        type: 'text',
                        text: '🏍️ ยินดีต้อนรับสู่บริการจองคิวล้างรถมอเตอร์ไซค์!\n\nกดปุ่มด้านล่างเพื่อเริ่มจองคิว',
                    },
                    line_1.LineHelper.createLiffFlexMessage(),
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
                }
                else {
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
            await line_1.LineHelper.replyMessage(replyToken, replyMessages);
        }
    }
    async handleFollow(event) {
        const userId = event.source.userId;
        const replyToken = event.replyToken;
        console.log(`User ${userId} followed the bot`);
        if (replyToken) {
            const welcomeMessages = [
                {
                    type: 'text',
                    text: '🎉 ยินดีต้อนรับสู่บริการจองคิวล้างรถมอเตอร์ไซค์!\n\n✨ บริการของเรา:\n• ล้างรถมอเตอร์ไซค์\n• รับ-ส่งถึงที่\n• จองคิวล่วงหน้า\n\nพิมพ์ "จองคิว" เพื่อเริ่มใช้งาน',
                },
                line_1.LineHelper.createLiffFlexMessage(),
            ];
            await line_1.LineHelper.replyMessage(replyToken, welcomeMessages);
        }
    }
    async handleUnfollow(event) {
        const userId = event.source.userId;
        console.log(`User ${userId} unfollowed the bot`);
    }
    async getUserBookings(lineUserId) {
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
    getStatusText(status) {
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
};
exports.LineService = LineService;
exports.LineService = LineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LineService);
//# sourceMappingURL=line.service.js.map