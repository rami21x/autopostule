const express = require('express');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
require('dotenv').config();

const passport = require('./config/passport');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const searchRoutes = require('./routes/search');
const analyseRoutes = require('./routes/analyse');
const lettreRoutes = require('./routes/lettre');
const candidaturesRoutes = require('./routes/candidatures');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Désactivé car le frontend est séparé (SPA)
  crossOriginEmbedderPolicy: false,
}));

// CORS — restreint à l'origine du frontend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers avec limites
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Session (pour OAuth handshake uniquement)
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 5 * 60 * 1000, // 5 min
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // lax pour permettre le redirect OAuth
  },
}));
app.use(passport.initialize());
app.use(passport.session());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/search', searchRoutes);
app.use('/analyse', analyseRoutes);
app.use('/lettre', lettreRoutes);
app.use('/candidatures', candidaturesRoutes);

// Error handling global — messages génériques, pas de stack traces
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: 'Une erreur est survenue. Réessaye plus tard.' });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
