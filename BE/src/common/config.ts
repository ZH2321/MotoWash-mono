import * as process from 'process';

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

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue!;
}

function getEnvVarAsNumber(name: string, defaultValue?: number): number {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  const numValue = value ? parseInt(value, 10) : defaultValue!;
  if (isNaN(numValue)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return numValue;
}

export const config: Config = {
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

// Validate configuration on load
try {
  // ✅ ตรวจ timezone ให้ถูกต้อง
  const tz = config.TZ || 'Asia/Bangkok';
  try {
    // ถ้าไม่ใช่ timezone ที่ถูกต้อง Intl จะโยน RangeError
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
  } catch {
    throw new Error(`Invalid timezone: ${tz}`);
  }

  // (ออปชัน) ตรวจ locale ถ้าคุณเพิ่มตัวแปร APP_LOCALE ไว้ใช้ฟอร์แมตภาษา
  const locale = process.env.APP_LOCALE || 'th-TH';
  if (!Intl.DateTimeFormat.supportedLocalesOf([locale]).length) {
    throw new Error(`Incorrect locale information provided: ${locale}`);
  }

  console.log('✅ Configuration loaded successfully');
} catch (error: any) {
  console.error('❌ Configuration validation failed:', error.message);
  process.exit(1);
}