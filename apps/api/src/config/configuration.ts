export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  jwt: {
    secret: process.env.JWT_SECRET ?? 'fallback-jwt-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'fallback-refresh-secret',
    expiresIn: '15m',
    refreshExpiresIn: '30d',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  frontend: {
    url: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
});
