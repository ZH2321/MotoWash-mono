import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { config } from './common/config';
import cors from '@fastify/cors';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        level: 'debug',
      },
    }),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, {
      headers: req.headers,
      body: req.method !== 'GET' ? req.body : undefined,
    });
    next();
  });

  // Register CORS
  function parseOrigins(v?: string | string[]) {
    if (Array.isArray(v)) return v;
    return (v || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  const envAllowed = parseOrigins(process.env.ALLOWED_ORIGINS);
  if (process.env.FRONTEND_ORIGIN) envAllowed.push(process.env.FRONTEND_ORIGIN.trim());
  // Add localhost for development
  envAllowed.push('http://localhost:3000');
  envAllowed.push('http://127.0.0.1:3000');
  const allowSet = new Set(envAllowed);

  console.log('Allowed CORS origins:', Array.from(allowSet));

  await app.register(cors, {
    origin: (origin, cb) => {
      // non-browser tools (curl/postman) ไม่มี origin → อนุญาต
      if (!origin) return cb(null, true);

      try {
        const u = new URL(origin);

        // 1) exact allow จาก .env
        if (allowSet.has(origin)) return cb(null, true);

        // 2) localhost:* (http/https)
        if (u.hostname === 'localhost') return cb(null, true);

        // 3) *.ngrok-free.app / *.ngrok.app
        if (u.hostname.endsWith('.ngrok-free.app') || u.hostname.endsWith('.ngrok.app')) {
          return cb(null, true);
        }

        // ถ้าจะเพิ่มโดเมนโปรดักชัน ให้เช็กตรงนี้เพิ่มได้
        console.log('CORS rejected origin:', origin);
        return cb(new Error(`Not allowed by CORS: ${origin}`), false);
      } catch {
        console.log('Invalid origin format:', origin);
        return cb(new Error('Invalid Origin'), false);
      }
    },
    credentials: true,
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    maxAge: 86400,
  });

  // Register rate limit
  await app.register(require('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  });

  // Register multipart
  await app.register(require('@fastify/multipart'));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 8000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Motorcycle Wash API is running on: http://localhost:${port}/api/v1`);
  console.log(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌍 Timezone: ${config.TZ}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});