require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const ensureAdmin = require('./utils/ensureAdmin');

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  await ensureAdmin();

  const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      // eslint-disable-next-line no-console
      console.error(`Port ${PORT} is already in use.`);
      process.exit(1);
    }

    // eslint-disable-next-line no-console
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

startServer().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});