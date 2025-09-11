"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const config_1 = require("./common/config");
const cors_1 = require("@fastify/cors");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter({
        logger: {
            level: 'info',
        },
    }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    function parseOrigins(v) {
        if (Array.isArray(v))
            return v;
        return (v || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
    }
    const envAllowed = parseOrigins(process.env.ALLOWED_ORIGINS);
    if (process.env.FRONTEND_ORIGIN)
        envAllowed.push(process.env.FRONTEND_ORIGIN.trim());
    const allowSet = new Set(envAllowed);
    await app.register(cors_1.default, {
        origin: (origin, cb) => {
            if (!origin)
                return cb(null, true);
            try {
                const u = new URL(origin);
                if (allowSet.has(origin))
                    return cb(null, true);
                if (u.hostname === 'localhost')
                    return cb(null, true);
                if (u.hostname.endsWith('.ngrok-free.app') || u.hostname.endsWith('.ngrok.app')) {
                    return cb(null, true);
                }
                return cb(new Error(`Not allowed by CORS: ${origin}`), false);
            }
            catch {
                return cb(new Error('Invalid Origin'), false);
            }
        },
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400,
    });
    await app.register(require('@fastify/rate-limit'), {
        max: 100,
        timeWindow: '1 minute',
    });
    await app.register(require('@fastify/multipart'));
    app.setGlobalPrefix('api/v1');
    const port = process.env.PORT || 8000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Motorcycle Wash API is running on: http://localhost:${port}/api/v1`);
    console.log(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌍 Timezone: ${config_1.config.TZ}`);
}
bootstrap().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map