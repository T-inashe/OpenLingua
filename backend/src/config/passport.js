const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../lib/prisma');

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