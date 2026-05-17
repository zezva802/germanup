import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import type { JWT } from 'next-auth/jwt';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function refreshAccessToken(token: {
  refreshToken: string;
  [key: string]: unknown;
}) {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });
    if (!res.ok) throw new Error('Refresh failed');
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    return {
      ...token,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessTokenExpires: Date.now() + 14 * 60 * 1000,
      error: undefined,
    };
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' as const };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });
        if (!res.ok) return null;
        const data = await res.json() as {
          accessToken: string;
          refreshToken: string;
          user: { id: string; email: string; name?: string; plan: 'FREE' | 'PRO' };
        };
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name ?? null,
          plan: data.user.plan,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],

  callbacks: {
    async jwt({ token, user, account, trigger }): Promise<JWT> {
      // Force-refresh plan from DB (called via update())
      if (trigger === 'update' && token.accessToken) {
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token.accessToken as string}` },
          });
          if (res.ok) {
            const fresh = await res.json() as { id: string; email: string; plan: 'FREE' | 'PRO' };
            return { ...token, user: { ...token.user, plan: fresh.plan } };
          }
        } catch { /* fall through to existing token */ }
        return token;
      }

      // Credentials sign-in
      if (account?.provider === 'credentials' && user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: Date.now() + 14 * 60 * 1000,
          user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
        };
      }

      // Google sign-in
      if (account?.provider === 'google') {
        const res = await fetch(`${API_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: token.email,
            name: token.name,
            avatar: token.picture,
          }),
        });
        if (!res.ok) return { ...token, error: 'GoogleAuthError' };
        const data = await res.json() as {
          accessToken: string;
          refreshToken: string;
          user: { id: string; email: string; name?: string; plan: 'FREE' | 'PRO' };
        };
        return {
          ...token,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accessTokenExpires: Date.now() + 14 * 60 * 1000,
          user: { id: data.user.id, email: data.user.email, name: data.user.name, plan: data.user.plan },
        };
      }

      // Token still valid
      if (Date.now() < (token.accessTokenExpires as number)) return token;

      // Refresh expired token
      return refreshAccessToken(token as Parameters<typeof refreshAccessToken>[0]) as Promise<JWT>;
    },

    async session({ session, token }) {
      session.user = token.user as typeof session.user;
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },

  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};
