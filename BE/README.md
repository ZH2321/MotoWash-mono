# Motorcycle Wash Booking API

Production-ready NestJS API for campus motorcycle wash booking system with LINE LIFF integration.

## Features

- **Time-based Slot Booking**: 60-minute slots with atomic reservation
- **Service Area Validation**: PostGIS-powered location validation
- **Payment Verification**: Deposit system with slip upload verification
- **LINE Integration**: LIFF authentication and push notifications
- **Real-time Capacity**: Hold system with TTL expiry
- **Admin Dashboard**: Payment verification and job management
- **Production Ready**: Comprehensive logging, rate limiting, CORS

## Tech Stack

- NestJS 10 + Fastify
- Supabase Postgres + PostGIS + Storage
- JWT Authentication (HS256)
- LINE Messaging API + LIFF
- Luxon for timezone handling
- Class-validator for DTOs

## Setup

### 1. Environment Configuration

```bash
cp .env.example .env
# Fill in your Supabase and LINE credentials
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Database Migration

```bash
# Run database migrations
pnpm migrate
```

This will:
- Enable PostGIS extension
- Create all tables with proper schema
- Set up RLS policies
- Create SQL functions
- Insert seed data

### 4. Run Application

```bash
# Development
pnpm start:dev

# Production
pnpm build
pnpm start:prod
```

## API Endpoints

### Authentication
- `POST /auth/liff/verify` - Verify LINE LIFF ID token
- `POST /auth/admin/login` - Admin login

### Settings
- `GET /settings/service-area` - Get service area configuration
- `POST /settings/service-area` - Update service area
- `GET /settings/business-hours` - Get business hours
- `POST /settings/business-hours` - Update business hours
- `GET /settings/payment-channels` - Get payment information

### Capacity
- `GET /capacity/availability?date=YYYY-MM-DD` - Check slot availability

### Bookings (Customer)
- `POST /bookings/hold` - Create slot hold
- `POST /bookings/:id/payment-slip` - Upload payment slip
- `POST /bookings/:id/cancel-hold` - Cancel slot hold
- `GET /bookings/:id` - Get booking details

### Admin
- `GET /admin/bookings` - List bookings with filters
- `POST /admin/bookings/:id/verify-payment` - Verify payment
- `POST /admin/bookings/:id/reject-payment` - Reject payment
- `POST /admin/bookings/:id/assign-runner` - Assign runner
- `POST /admin/bookings/:id/transition` - Update booking status

### LINE Webhook
- `POST /webhook/line` - Handle LINE bot messages

## Business Rules

- **Slot Duration**: 60 minutes (configurable via `BOOKING_TIMEBLOCK_MINUTES`)
- **Hold TTL**: 15 minutes (configurable via `HOLD_TTL_MINUTES`)
- **Cutoff Time**: 15 minutes before slot start on current day
- **Service Area**: Circular area with configurable center and radius
- **Deposit**: 20 THB (2000 minor units)

## State Transitions

```
HOLD_PENDING_PAYMENT → AWAIT_SHOP_CONFIRM (slip upload)
AWAIT_SHOP_CONFIRM → CONFIRMED (admin verify)
AWAIT_SHOP_CONFIRM → REJECTED (admin reject)
CONFIRMED → PICKUP_ASSIGNED → PICKED_UP → IN_WASH → READY_FOR_RETURN → ON_THE_WAY_RETURN → COMPLETED → REVIEWED
```

## LINE Webhook Setup

1. Set webhook URL: `https://your-domain.com/webhook/line`
2. Enable "Message API" in LINE Developers Console
3. Configure LIFF app with your frontend URL

## Testing

```bash
# Unit tests
pnpm test

# Test coverage
pnpm test:cov

# Specific test files
pnpm test time-cutoff.spec.ts
pnpm test reserve-concurrency.spec.ts
pnpm test transitions.spec.ts
```

## Production Deployment

```bash
# Build Docker image
docker build -t motorcycle-wash-api .

# Run container
docker run -p 8000:8000 --env-file .env motorcycle-wash-api
```

## Security Features

- CORS protection
- Rate limiting on public endpoints
- JWT authentication with role-based access
- Input validation and sanitization
- File upload restrictions
- Signed URLs for sensitive content

## Logging

All requests include:
- Request ID for tracing
- User identification (line_user_id)
- Business context (booking_id, slot_start)
- No PII in logs