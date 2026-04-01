const express = require('express');
const cors = require('cors');
const session = require('express-session');
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

// Middlewares
app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 5 * 60 * 1000 } // 5 min (only used during OAuth handshake)
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

// Error handling global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
