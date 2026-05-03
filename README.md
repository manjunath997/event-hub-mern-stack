# Event Management System

Full-stack event platform: **Express.js + MongoDB (Mongoose)** API with **JWT** auth, **role-based access** (admin / user), **Multer** image uploads, **Socket.IO** booking notifications, optional **Stripe Checkout** payments, **QR code** tickets, and **reviews**. The **React (Vite)** client provides browsing, booking, dashboards, and admin event management.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MongoDB](https://www.mongodb.com/) running locally or a connection string (MongoDB Atlas)

## Step-by-step setup

### 1. Clone / open the project

The repo root contains `server/` (API) and `client/` (React UI).

### 2. Configure the API

```bash
cd server
copy .env.example .env
```

Edit `server/.env`:

- `MONGODB_URI` — e.g. `mongodb://127.0.0.1:27017/event_management`
- `JWT_SECRET` — long random string (required for production)
- `CLIENT_URL` — frontend origin, e.g. `http://localhost:5173`
- **Optional Stripe:** set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (see [Stripe payments](#stripe-payments) below). Leave empty for free instant bookings.

### 3. Install and seed admin

```bash
cd server
npm install
npm run seed
```

Default admin (change after first login in production):

- Email: `admin@events.local`
- Password: `admin123`

Override with `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` in `.env`.

### 4. Start the API

```bash
cd server
npm run dev
```

API: `http://localhost:5000`  
Health check: `GET http://localhost:5000/api/health`

### 5. Install and run the React client

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` and `/uploads` to port 5000.

### 6. Production build (client)

```bash
cd client
npm run build
```

Serve the `client/dist` folder behind your static host. Set `VITE_API_URL` to your public API origin before `npm run build` so API calls and Socket.IO target the correct server.

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register (always `user` role) |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Current user |
| GET | `/api/events` | — | List; query: `q`, `location`, `dateFrom`, `dateTo` (ISO) |
| GET | `/api/events/:id` | — | Event detail |
| POST | `/api/events` | Admin + JWT | Create (multipart: `image` optional) |
| PUT | `/api/events/:id` | Admin + JWT | Update |
| DELETE | `/api/events/:id` | Admin + JWT | Delete (no active/pending bookings) |
| POST | `/api/bookings` | JWT | Body: `{ eventId, seats }` — returns `checkoutUrl` if Stripe enabled |
| GET | `/api/bookings/mine` | JWT | User bookings |
| DELETE | `/api/bookings/:id` | JWT | Cancel (owner or admin) |
| GET | `/api/dashboard/admin` | Admin + JWT | Totals + recent bookings |
| GET | `/api/dashboard/user` | JWT | Confirmed count + full booking history |
| GET | `/api/events/:eventId/reviews` | — | Reviews + average rating |
| POST | `/api/events/:eventId/reviews` | JWT | Review (requires confirmed booking for that event) |
| POST | `/api/payments/webhook` | Stripe signature | Stripe webhook (raw body) |

## Postman

Import `docs/Event-Management-API.postman_collection.json`. Set collection variables:

- `baseUrl` — `http://localhost:5000`
- `token` — paste JWT from login response
- `eventId` / `bookingId` — from list/detail responses

## Stripe payments

1. Create a [Stripe](https://stripe.com/) account and get test **Secret key**.
2. Add to `server/.env`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, optional `STRIPE_CURRENCY`, `STRIPE_AMOUNT_CENTS_PER_SEAT`.
3. Run [Stripe CLI](https://stripe.com/docs/stripe-cli) for local webhooks:

   ```bash
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```

   Paste the signing secret as `STRIPE_WEBHOOK_SECRET`.

4. Booking flow: API returns `checkoutUrl`; after payment, webhook confirms the booking, decrements seats, and generates the QR ticket. If seats are gone between checkout and webhook, manual refund may be needed.

**Razorpay:** Not wired in code; you would add a similar flow (create order → verify signature on callback → call the same `finalizeBooking` logic).

## Security features

- Passwords hashed with **bcrypt**
- **JWT** on protected routes; **admin** middleware for management routes
- **express-validator** on inputs
- **express-rate-limit** on API and stricter limits on auth routes
- Central **error handler**; Multer errors mapped to 400

## Real-time notifications

When a booking is **confirmed**, the server emits `booking:confirmed` to the Socket.IO room `user:<userId>`. The React app connects with `userId` in the query after login.

## Project structure (server)

```
server/
  config/db.js
  controllers/
  middleware/     auth, upload, rateLimiter, validateRequest, errorHandler
  models/         User, Event, Booking, Review
  routes/
  scripts/seedAdmin.js
  uploads/events/
  server.js
```

## License

Educational / demonstration use.
