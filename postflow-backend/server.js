require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { getDB } = require('./src/config/database');
const scheduler = require('./src/services/schedulerService');

const app = express();

// Init Supabase connection
getDB();

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Routes
app.use('/api/auth',       require('./src/routes/authRoutes'));
app.use('/api/platforms',  require('./src/routes/platformRoutes'));
app.use('/api/posts',      require('./src/routes/postRoutes'));
app.use('/api/ai',         require('./src/routes/aiRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

// Start scheduler
scheduler.start();

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`
🚀 PostFlow backend running!
📡 URL:    http://localhost:${PORT}
❤️  Health: http://localhost:${PORT}/health
  `);
});