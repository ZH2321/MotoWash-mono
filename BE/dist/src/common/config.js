"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const process = require("process");
function getEnvVar(name, defaultValue) {
    const value = process.env[name];
    if (!value && !defaultValue) {
        throw new Error(`Environment variable ${name} is required`);
    }
    return value || defaultValue;
}
function getEnvVarAsNumber(name, defaultValue) {
    const value = process.env[name];
    if (!value && defaultValue === undefined) {
        throw new Error(`Environment variable ${name} is required`);
    }
    const numValue = value ? parseInt(value, 10) : defaultValue;
    if (isNaN(numValue)) {
        throw new Error(`Environment variable ${name} must be a valid number`);
    }
    return numValue;
}
exports.config = {
    TZ: getEnvVar('TZ', 'Asia/Bangkok'),
    FRONTEND_ORIGIN: getEnvVar('FRONTEND_ORIGIN', 'http://localhost:3000'),
    BACKEND_BASE_URL: getEnvVar('BACKEND_BASE_URL', 'http://localhost:8000'),
    SUPABASE_URL: getEnvVar('SUPABASE_URL', 'https://your-project.supabase.co'),
    SUPABASE_ANON_KEY: getEnvVar('SUPABASE_ANON_KEY', 'your-anon-key'),
    SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY', 'your-service-role-key'),
    SUPABASE_JWT_SECRET: getEnvVar('SUPABASE_JWT_SECRET', 'your-jwt-secret'),
    LINE_CHANNEL_ID: getEnvVar('LINE_CHANNEL_ID', 'your-channel-id'),
    LINE_CHANNEL_SECRET: getEnvVar('LINE_CHANNEL_SECRET', 'your-channel-secret'),
    LINE_MESSAGING_ACCESS_TOKEN: getEnvVar('LINE_MESSAGING_ACCESS_TOKEN', 'your-messaging-token'),
    LIFF_AUDIENCE: getEnvVar('LIFF_AUDIENCE', 'your-liff-id'),
    BOOKING_TIMEBLOCK_MINUTES: getEnvVarAsNumber('BOOKING_TIMEBLOCK_MINUTES', 60),
    HOLD_TTL_MINUTES: getEnvVarAsNumber('HOLD_TTL_MINUTES', 15),
    CUT_OFF_MINUTES_TODAY: getEnvVarAsNumber('CUT_OFF_MINUTES_TODAY', 15),
    RECEIPT_BASE_URL: getEnvVar('RECEIPT_BASE_URL', 'https://your-project.supabase.co/storage/v1/object/public/slips'),
};
try {
    const tz = exports.config.TZ || 'Asia/Bangkok';
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: tz });
    }
    catch {
        throw new Error(`Invalid timezone: ${tz}`);
    }
    const locale = process.env.APP_LOCALE || 'th-TH';
    if (!Intl.DateTimeFormat.supportedLocalesOf([locale]).length) {
        throw new Error(`Incorrect locale information provided: ${locale}`);
    }
    console.log('✅ Configuration loaded successfully');
}
catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
    process.exit(1);
}
//# sourceMappingURL=config.js.map