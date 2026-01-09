import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import pool from './database.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;

        const result = await pool.query(
          'SELECT * FROM users WHERE google_id = $1 OR email = $2',
          [googleId, email]
        );

        let user;

        if (result.rows.length === 0) {
          const insert = await pool.query(
            `
            INSERT INTO users (email, google_id, role, first_name, last_name, is_verified)
            VALUES ($1, $2, 'talent', $3, $4, true)
            RETURNING *
            `,
            [
              email,
              googleId,
              profile.name.givenName,
              profile.name.familyName,
            ]
          );
          user = insert.rows[0];
        } else {
          user = result.rows[0];
        }

        const token = jwt.sign(
          { userId: user.id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        done(null, { token });
      } catch (err) {
        done(err, null);
      }
    }
  )
);
