# Campus MotoWash - Frontend

A production-ready Next.js 14 application for motorcycle wash booking service with LINE LIFF integration, admin panel, and PWA capabilities.

## Features

### Customer Features (LIFF)
- 📱 LINE LIFF integration for seamless user authentication
- 🏍️ Motorcycle wash package selection with add-ons
- 📍 Interactive map for pickup/dropoff location selection with service area validation
- ⏰ Time slot booking with real-time availability
- 💳 Multi-channel payment with slip upload
- 📊 Real-time booking status tracking with timeline
- ⭐ Review and rating system
- 📱 PWA support for app-like experience

### Admin Features
- 🔐 Secure admin authentication
- 📋 Drag-and-drop Kanban board for booking management
- 🧾 Payment slip review system
- ⚙️ Business settings management (hours, service area, payment channels)
- 🗺️ Service area configuration with map interface
- 📊 Real-time booking status updates

### Technical Features
- ⚡ Next.js 14 with App Router
- 🎨 Beautiful UI with Tailwind CSS + shadcn/ui
- 🔄 TanStack Query for state management
- 🗺️ OpenStreetMap integration with Leaflet
- 📱 PWA capabilities with offline support
- 🔒 JWT-based authentication
- 📝 Form validation with Zod
- 🎯 TypeScript throughout

## Setup Instructions

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### 1. Environment Configuration

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://wash-frontend.yourdomain.com
NEXT_PUBLIC_BACKEND_BASE_URL=https://wash-api.yourdomain.com

# LINE LIFF Configuration
NEXT_PUBLIC_LIFF_ID=YOUR_LIFF_ID_HERE

# App Configuration
NEXT_PUBLIC_APP_NAME="Campus MotoWash"
NEXT_PUBLIC_DEFAULT_LAT=13.7563
NEXT_PUBLIC_DEFAULT_LNG=100.5018
```

### 2. Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

### 3. Build for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## LIFF Configuration

### Setting up LINE LIFF App

1. **Create LINE Login Channel**
   - Go to [LINE Developers Console](https://developers.line.biz/console/)
   - Create a new LINE Login channel
   - Note down the Channel ID

2. **Create LIFF App**
   - In your LINE Login channel, go to LIFF tab
   - Add a new LIFF app with these settings:
     - **LIFF app name**: Campus MotoWash
     - **Size**: Full
     - **Endpoint URL**: `https://yourdomain.com/liff`
     - **Scope**: `profile`, `openid`
   - Note down the LIFF ID (format: `LIFF-XXXXXXXX`)

3. **Update Environment**
   ```env
   NEXT_PUBLIC_LIFF_ID=YOUR_LIFF_ID_HERE
   ```

### Testing LIFF

- **Development**: Use LINE app's QR code scanner to test `http://localhost:3000/liff`
- **Production**: Share LIFF URL or add to LINE Bot menu

> **Note**: PWA installation works best outside LINE WebView. Users can add to home screen for better experience.

## PWA Configuration

The app includes basic PWA support:

- **Manifest**: `/public/manifest.webmanifest`
- **Icons**: Place icons in `/public/` (icon-192.png, icon-512.png, etc.)
- **Service Worker**: Basic offline support via `/public/sw.js`
- **Offline Page**: `/app/offline/page.tsx`

### PWA Icons Required

Create the following icons in `/public/`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `icon-maskable-192.png` (192x192, maskable)
- `icon-maskable-512.png` (512x512, maskable)

## API Integration

### Authentication Flow

1. **LIFF Users**: 
   - LIFF SDK → ID Token → Backend verification → App JWT
   - JWT stored in sessionStorage

2. **Admin Users**:
   - Email/password → Backend authentication → App JWT
   - JWT stored in localStorage

### API Client

All API calls use Axios interceptors for:
- Automatic Bearer token attachment
- 401 error handling and redirect
- Request/response logging (development)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (public)/          # Public pages
│   ├── liff/              # LIFF customer flow
│   ├── admin/             # Admin panel
│   └── offline/           # PWA offline page
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── booking/          # Booking flow components
│   └── admin/            # Admin-specific components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and API client
└── __tests__/            # Test files
```

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

Key test coverage:
- Slot availability logic
- Booking conflict handling (409 errors)
- Form validation
- Authentication flows

## Deployment

### Static Export (Recommended)

```bash
pnpm build
```

Outputs to `out/` directory, ready for static hosting.

### Environment Variables for Production

Ensure all `NEXT_PUBLIC_*` variables are set:
- `NEXT_PUBLIC_SITE_URL`: Your production domain
- `NEXT_PUBLIC_BACKEND_BASE_URL`: Your API endpoint
- `NEXT_PUBLIC_LIFF_ID`: Your LIFF app ID

## Known Limitations & Caveats

### LIFF Integration
- PWA install prompt won't show inside LINE WebView
- Best experience when app is added to home screen
- LIFF SDK requires HTTPS in production

### Map Features
- Uses OpenStreetMap tiles (no API key required)
- Service worker caches map tiles for offline use
- Location permissions required for auto-centering

### Payment Integration
- Currently supports manual slip upload
- Future: Integrate with payment gateways
- QR code generation requires backend support

### Browser Support
- Modern browsers with ES6+ support
- PWA features require HTTPS
- Service worker requires secure context

## Development Tips

### Hot Reloading
- API changes require server restart
- Component changes hot reload automatically
- Environment variable changes need restart

### Debugging
- Enable React DevTools
- Use browser network tab for API debugging
- Console logs available in development

### Performance
- Images are optimized with Next.js Image component
- API responses cached with TanStack Query
- Static assets served from CDN in production

## Contributing

1. Follow TypeScript strict mode
2. Use Prettier for formatting
3. Write tests for new features
4. Update documentation

## Support

For issues and questions:
- Check the issue tracker
- Review the documentation
- Contact the development team

---

Built with ❤️ using Next.js 14, TypeScript, and modern web technologies.