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
export declare class LineHelper {
    private static readonly LINE_API_BASE;
    private static readonly MESSAGING_API_BASE;
    static verifySignature(body: string, signature: string): boolean;
    static getProfile(accessToken: string): Promise<LineProfile>;
    static pushMessage(userId: string, messages: LineMessage[]): Promise<void>;
    static replyMessage(replyToken: string, messages: LineMessage[]): Promise<void>;
    static createBookingHoldMessage(bookingId: string, slotStart: string, expiresAt: string): TextMessage;
    static createPaymentPendingMessage(): TextMessage;
    static createBookingConfirmedMessage(): TextMessage;
    static createPaymentRejectedMessage(reason: string): TextMessage;
    static createStatusUpdateMessage(status: string, statusText: string): TextMessage;
    static createBookingExpiredMessage(): TextMessage;
    static createLiffFlexMessage(): FlexMessage;
}
