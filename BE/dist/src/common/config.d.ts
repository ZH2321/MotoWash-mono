interface Config {
    TZ: string;
    FRONTEND_ORIGIN: string;
    BACKEND_BASE_URL: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    SUPABASE_JWT_SECRET: string;
    LINE_CHANNEL_ID: string;
    LINE_CHANNEL_SECRET: string;
    LINE_MESSAGING_ACCESS_TOKEN: string;
    LIFF_AUDIENCE: string;
    BOOKING_TIMEBLOCK_MINUTES: number;
    HOLD_TTL_MINUTES: number;
    CUT_OFF_MINUTES_TODAY: number;
    RECEIPT_BASE_URL: string;
}
export declare const config: Config;
export {};
