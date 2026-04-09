import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRoutes from './routes/apiRoutes';

const app = express();

// ── PAYMENT GATEWAY PRE-CORS BYPASS ─────────────────────────────────────────
// CCAvenue POSTs to /api/payment/response from their own servers with no
// Origin header (server-to-server redirect). We must set CORS headers
// BEFORE the general cors() middleware runs, otherwise it throws 500.
app.use('/api/payment/response', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ── GENERAL CORS ─────────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://gagnersports.com',
  'https://www.gagnersports.com',
  'http://localhost:3000',
  'http://localhost:3008',
  'http://localhost:3009',
  'http://localhost:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin header (server-to-server, curl, payment gateways)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// Root Health Check
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Gagner Sports API is running',
    version: '1.0.0-TS-PROD',
  });
});

// ── GENERIC ERROR HANDLER ────────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('SERVER_ERROR:', err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
