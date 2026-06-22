const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Import all models to register them with Mongoose before routes
require('./models/User');
require('./models/Complaint');
require('./models/IncidentGroup');
require('./models/Notification');
require('./models/Feedback');
require('./models/Department');
require('./models/DepartmentAuthority');
require('./models/DuplicateComplaintCluster');
require('./models/WorkerPerformance');
require('./models/WorkerTask');
require('./models/RecurrenceLog');
require('./models/NotificationLog');
require('./models/CentralAdmin');
require('./models/Worker');
require('./models/Thread');
require('./models/Reply');
require('./models/ForecastCache');
require('./models/AutomationReport');
require('./models/AutomationLog');

const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');
const citizenRoutes = require('./routes/citizenRoutes');
const adminRoutes = require('./routes/adminRoutes');
const officerRoutes = require('./routes/officerRoutes');
const workerRoutes = require('./routes/workerRoutes');
const complaintsRoutes = require('./routes/complaintsRoutes');
const notificationsRoutes = require('./routes/notificationRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const communityRoutes = require('./routes/communityRoutes');
const forecastRoutes = require('./routes/forecastRoutes');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false, // allow images to be served cross-origin
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.use(express.json({ limit: '10mb' }));

const configuredOrigins = (process.env.CLIENT_ORIGIN || process.env.CLIENT_URL || '')
	.split(',')
	.map((origin) => origin.trim().replace(/\/$/, ''))
	.filter(Boolean);

const localhostOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true); // Allow non-browser clients like Postman or server-to-server

			const normalizedOrigin = origin.replace(/\/$/, '');

			const allowedByConfig = configuredOrigins.includes(normalizedOrigin);
			const allowedLocalhost = process.env.NODE_ENV !== 'production' && localhostOriginRegex.test(origin);

			if (allowedByConfig || allowedLocalhost) {
				return callback(null, true);
			}

			return callback(new Error(`CORS blocked for origin: ${origin}`));
		},
		credentials: true,
	})
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
	res.json({ ok: true, service: 'smart-civic-server' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/forecast', forecastRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
