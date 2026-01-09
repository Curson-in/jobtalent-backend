import express from 'express';
import passport from 'passport';

const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: 'http://localhost:3000/login',
  }),
  (req, res) => {
    // passport returns { token }
    const { token } = req.user;
    res.redirect(`http://localhost:3000/oauth-success?token=${token}`);
  }
);

export default router;
