import app from './app';
import connectDB from './config/db';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database before starting the server
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`\x1b[32m%s\x1b[0m`, `────────────────────────────────────────────────`);
      console.log(`\x1b[32m%s\x1b[0m`, `🚀 Gagner Sports Backend [TS] is LIVE`);
      console.log(`\x1b[32m%s\x1b[0m`, `🌐 Port: ${PORT}`);
      console.log(`\x1b[32m%s\x1b[0m`, `📅 Timestamp: ${new Date().toISOString()}`);
      console.log(`\x1b[32m%s\x1b[0m`, `────────────────────────────────────────────────`);
    });
  } catch (error: any) {
    console.error('\x1b[31m%s\x1b[0m', '❌ FAILED TO START SERVER:', error.message);
    process.exit(1);
  }
};

startServer();
