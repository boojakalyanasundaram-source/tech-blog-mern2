const bool = (v) => String(v).toLowerCase() === 'true';

export const env = {
  port: Number(process.env.PORT) || 5000,
  isProd: process.env.NODE_ENV === 'production',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/techblog',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSecure: bool(process.env.COOKIE_SECURE),
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim()),
  siteUrl: (process.env.SITE_URL || 'http://localhost:5000').replace(/\/$/, ''),
  siteName: process.env.SITE_NAME || 'TechPulse',
  siteDescription:
    process.env.SITE_DESCRIPTION ||
    'Technology insights, tutorials and company news on software, AI, cloud and security.',
  gaId: process.env.GA_MEASUREMENT_ID || '',
  gscVerification: process.env.GOOGLE_SITE_VERIFICATION || '',
  admin: {
    name: process.env.ADMIN_NAME || 'Site Admin',
    email: (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'ChangeMe@123',
  },
};

if (env.isProd && env.jwtSecret === 'dev-secret-change-me') {
  throw new Error('JWT_SECRET must be set in production');
}
