const { PrismaClient } = require('@prisma/client');

// Build an effective DATABASE_URL with required options at runtime (no .env edits)
function buildEffectiveDbUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.error('❌ DATABASE_URL is not set');
    return undefined;
  }
  try {
    const u = new URL(raw);
    // Ensure SSL for Supabase
    if (!u.searchParams.get('sslmode')) {
      u.searchParams.set('sslmode', 'require');
    }
    // Hint Prisma about PgBouncer when using pooled connection strings
    if (!u.searchParams.get('pgbouncer')) {
      u.searchParams.set('pgbouncer', 'true');
    }
    // Limit connections per Prisma instance when behind PgBouncer
    if (!u.searchParams.get('connection_limit')) {
      u.searchParams.set('connection_limit', '1');
    }
    // Set a reasonable connect timeout
    if (!u.searchParams.get('connect_timeout')) {
      u.searchParams.set('connect_timeout', '30');
    }
    return u.toString();
  } catch (e) {
    console.warn('⚠️ Could not parse DATABASE_URL, using as-is');
    return raw;
  }
}

const effectiveDbUrl = buildEffectiveDbUrl();

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error'], // Only log errors for better performance
    datasources: effectiveDbUrl
      ? { db: { url: effectiveDbUrl } }
      : undefined,
    // Keep Prisma's pool tiny when using PgBouncer (Supabase pooler)
    pool: {
      max: 1,        // default is 5; 1 is recommended with PgBouncer
      timeout: 30,   // seconds; default 10
    },
  });
};

const globalForPrisma = global;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Test connection on startup with better diagnostics
prisma
  .$connect()
  .then(() => {
    try {
      const u = new URL(effectiveDbUrl || process.env.DATABASE_URL || '');
      const redacted = `${u.protocol}//${u.username ? u.username + ':***@' : ''}${u.host}${u.pathname}`;
      console.log('✅ Database connected successfully ->', redacted);
    } catch {
      console.log('✅ Database connected successfully');
    }
  })
  .catch((err) => {
    // Print helpful hints without leaking secrets
    console.error('❌ Database connection failed:', err.message);
    try {
      const u = new URL(process.env.DATABASE_URL || '');
      console.error('Host:', u.hostname, 'Port:', u.port || '5432');
      console.error('SSL mode required: yes (sslmode=require)');
      console.error('PgBouncer hint: pgbouncer=true');
    } catch {}
  });

// Graceful shutdown
const gracefulShutdown = async () => {
  await prisma.$disconnect();
  console.log('Database disconnected');
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = prisma;