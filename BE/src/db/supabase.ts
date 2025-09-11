// src/db/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { config } from '../common/config';

export let DB_READY = false;

export const supabaseService = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function initializeDatabase(): Promise<void> {
  const url = (config.SUPABASE_URL || '').trim();
  const srk = (config.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url) throw new Error('Missing SUPABASE_URL');
  if (!/^https:\/\/.+\.supabase\.co$/.test(url)) throw new Error(`Invalid SUPABASE_URL: "${url}"`);
  if (!srk || srk.length < 50) throw new Error('Missing/invalid SUPABASE_SERVICE_ROLE_KEY');

  // 1) Health check - แยกชั้น network/SSL/proxy
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: process.env.SUPABASE_ANON_KEY ?? srk }
    });
    console.log('🔎 Supabase health status:', res.status);
  } catch (e: any) {
    throw new Error(`Network/TLS to Supabase failed: ${e?.message || e}`);
  }

  // 2) DB connectivity
  try {
    const { error } = await supabaseService.from('users').select('id', { head: true, count: 'exact' }).limit(1);
    if (error && !`${error.message}`.includes('relation "users" does not exist')) {
      throw error;
    }
    console.log('✅ Database connection OK');
  } catch (e: any) {
    throw new Error(`Database connection failed: ${e?.message || e}`);
  }

  // 3) Storage buckets
  try {
    const { StorageHelper } = await import('../common/storage');
    await StorageHelper.ensureBuckets(); // ตรงนี้ถ้าพัง จะได้ข้อความที่ชี้ว่า Storage ล้ม
    console.log('✅ Storage buckets OK');
  } catch (e: any) {
    throw new Error(`Storage initialization failed: ${e?.message || e}`);
  }
}

// อย่าลืมเรียกตอนบูต
initializeDatabase().catch((e) => {
  console.error('❌ Database initialization failed:', e.message);
});

console.log('✅ Database connection OK');
DB_READY = true;