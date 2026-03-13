import app from './app';
import { pool } from './db';

const PORT = Number(process.env.PORT || 3000);

const start = async () => {
  let dbStatus = 'connection_failed';

  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch (error) {
    console.error('DB connection error:', error);
  }

  app.listen(PORT, () => {
    console.log('🚀 HomeBudget API успешно запущен');
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🩺 Health: http://localhost:${PORT}/health`);
    console.log(`🗄️ PostgreSQL: ${dbStatus}`);
    console.log('🛡️ Security: helmet, cors, rate-limit, request-id');
  });
};

start();