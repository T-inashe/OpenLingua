const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../lib/prisma');

// Only initialize GoogleStrategy if required env vars are present.
// This prevents the module from throwing during tests or in environments
// where Google OAuth credentials aren't configured (for example, CI).
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8080/auth/google/callback',
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const googleId = profile.id;
          const name = profile.displayName;
          const avatar = profile.photos[0]?.value;

          const user = await prisma.user.upsert({
            where: { googleId: googleId },
            update: {
              name: name,
              avatar: avatar,
              email: email,
              updatedAt: new Date()
            },
            create: {
              email: email,
              name: name,
              avatar: avatar,
              googleId: googleId,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });

          return done(null, user);
        } catch (error) {
          console.error('❌ Error in Google Strategy:', error);
          return done(error, null);
        }
      }
    )
  );
} else {
  // If env vars are missing, log a helpful message in non-test environments.
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.warn('Google OAuth not configured: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing.');
  }
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: id }
    });
    done(null, user);
  } catch (error) {
    console.error('Deserialize error:', error);
    done(error, null);
  }
});

module.exports = passport;