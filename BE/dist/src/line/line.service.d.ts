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
export declare class LineService {
    private readonly supabase;
    constructor();
    handleEvent(event: LineEvent): Promise<void>;
    private handleMessage;
    private handleFollow;
    private handleUnfollow;
    private getUserBookings;
    private getStatusText;
}
export {};
