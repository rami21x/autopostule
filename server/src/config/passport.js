const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../db/pool');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT id, email, avatar_url, auth_provider FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});

// Only configure Google strategy if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const googleId = profile.id;
      const avatarUrl = profile.photos?.[0]?.value || null;

      // 1. Check if user exists by google_id
      let result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);

      if (result.rows.length > 0) {
        return done(null, result.rows[0]);
      }

      // 2. Check if user exists by email (link accounts)
      result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length > 0) {
        const user = result.rows[0];
        await pool.query(
          'UPDATE users SET google_id = $1, avatar_url = $2, auth_provider = $3 WHERE id = $4',
          [googleId, avatarUrl, user.password_hash ? 'both' : 'google', user.id]
        );
        user.google_id = googleId;
        user.avatar_url = avatarUrl;
        return done(null, user);
      }

      // 3. Create new user
      result = await pool.query(
        'INSERT INTO users (email, google_id, avatar_url, auth_provider) VALUES ($1, $2, $3, $4) RETURNING *',
        [email, googleId, avatarUrl, 'google']
      );

      return done(null, result.rows[0]);
    } catch (err) {
      return done(err, null);
    }
  }));

  console.log('Google OAuth configuré');
} else {
  console.log('Google OAuth non configuré (GOOGLE_CLIENT_ID manquant)');
}

module.exports = passport;
