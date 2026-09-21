import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import { seedDatabase } from './seed';

import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import coachRoutes from './routes/coachRoutes';
import interactionRoutes from './routes/interactionRoutes';
import otpRoutes from './routes/otpRoutes';
import studentRoutes from './routes/studentRoutes';
import User from './models/User';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'Success Coach Interaction & Progress Tracking System',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/student', studentRoutes);

// Seed API trigger for testing environment
app.post('/api/seed', async (req: Request, res: Response) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Database re-seeded successfully with demo accounts' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to seed database', error: err.message });
  }
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server & Connect Database
const startServer = async () => {
  await connectDB();


  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Success Coach Backend Server running on port ${PORT}`);
  });
};

startServer();
