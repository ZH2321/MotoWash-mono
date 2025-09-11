"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseService = exports.DB_READY = void 0;
exports.initializeDatabase = initializeDatabase;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../common/config");
exports.DB_READY = false;
exports.supabaseService = (0, supabase_js_1.createClient)(config_1.config.SUPABASE_URL, config_1.config.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
async function initializeDatabase() {
    const url = (config_1.config.SUPABASE_URL || '').trim();
    const srk = (config_1.config.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    if (!url)
        throw new Error('Missing SUPABASE_URL');
    if (!/^https:\/\/.+\.supabase\.co$/.test(url))
        throw new Error(`Invalid SUPABASE_URL: "${url}"`);
    if (!srk || srk.length < 50)
        throw new Error('Missing/invalid SUPABASE_SERVICE_ROLE_KEY');
    try {
        const res = await fetch(`${url}/auth/v1/health`, {
            headers: { apikey: process.env.SUPABASE_ANON_KEY ?? srk }
        });
        console.log('🔎 Supabase health status:', res.status);
    }
    catch (e) {
        throw new Error(`Network/TLS to Supabase failed: ${e?.message || e}`);
    }
    try {
        const { error } = await exports.supabaseService.from('users').select('id', { head: true, count: 'exact' }).limit(1);
        if (error && !`${error.message}`.includes('relation "users" does not exist')) {
            throw error;
        }
        console.log('✅ Database connection OK');
    }
    catch (e) {
        throw new Error(`Database connection failed: ${e?.message || e}`);
    }
    try {
        const { StorageHelper } = await Promise.resolve().then(() => require('../common/storage'));
        await StorageHelper.ensureBuckets();
        console.log('✅ Storage buckets OK');
    }
    catch (e) {
        throw new Error(`Storage initialization failed: ${e?.message || e}`);
    }
}
initializeDatabase().catch((e) => {
    console.error('❌ Database initialization failed:', e.message);
});
console.log('✅ Database connection OK');
exports.DB_READY = true;
//# sourceMappingURL=supabase.js.map