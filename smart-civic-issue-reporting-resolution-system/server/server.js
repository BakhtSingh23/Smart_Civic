require('dotenv').config();

const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
	// eslint-disable-next-line no-console
	console.error(`Missing required environment variables: ${missing.join(', ')}`);
	// eslint-disable-next-line no-console
	console.error('Copy server/.env.example to server/.env and fill in the values.');
	process.exit(1);
}

const app = require('./app');
const connectDB = require('./config/db');
const ensureAdmin = require('./utils/ensureAdmin');

const PORT = process.env.PORT || 5000;

function listenWithRetry(port, retriesLeft = 5) {
	const server = app.listen(port, () => {
		// eslint-disable-next-line no-console
		console.log(`Server listening on port ${port}`);
	});

	server.on('error', (err) => {
		if (err && err.code === 'EADDRINUSE' && retriesLeft > 0) {
			// eslint-disable-next-line no-console
			console.warn(`Port ${port} in use, retrying in 1s... (${retriesLeft} left)`);
			setTimeout(() => listenWithRetry(port, retriesLeft - 1), 1000);
			return;
		}

		// eslint-disable-next-line no-console
		console.error('Failed to start server:', err);
		process.exit(1);
	});
}

(async () => {
	await connectDB();
	await ensureAdmin();
	listenWithRetry(PORT);
})().catch((err) => {
	// eslint-disable-next-line no-console
	console.error('Failed to start server:', err);
	process.exit(1);
});
