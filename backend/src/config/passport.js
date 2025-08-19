/* istanbul ignore file */

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { prisma } = require('../lib/prisma');

// Configure Google OAuth strategy
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  // Avoid throwing during tests/CI or local dev without Google creds
  console.warn('Google OAuth env vars are missing; skipping GoogleStrategy setup.');
} else {
  try {
    passport.use(new GoogleStrategy({
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google profile:', profile);

        // Extract user info from Google profile
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const avatar = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error('No email found in Google profile'));
        }

        // Check if user already exists with this Google ID
        let user = await prisma.user.findUnique({
          where: { googleId },
        });

        if (user) {
          // User exists, log them in
          return done(null, user);
        }

        // Check if user exists with this email (manual registration)
        const existingUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (existingUser) {
          // Link Google account to existing user
          user = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              googleId,
              avatar: avatar || existingUser.avatar,
            },
          });
          return done(null, user);
        }

        // Create new user
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name: name || 'Google User',
            googleId,
            avatar,
            // Note: password is null for OAuth users
          },
        });

        return done(null, user);

      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error);
      }
    }));
  } catch (initError) {
    console.warn('Failed to initialize GoogleStrategy; skipping setup:', initError?.message || initError);
  }
}

// Serialize user for session (we won't use sessions, but Passport requires this)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;