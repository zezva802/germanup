import { DefaultSession } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      plan: 'FREE' | 'PRO';
    } & DefaultSession['user'];
    accessToken: string;
    error?: string;
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    plan: 'FREE' | 'PRO';
    accessToken: string;
    refreshToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    user: {
      id: string;
      email: string;
      name?: string | null;
      plan: 'FREE' | 'PRO';
    };
    error?: string;
  }
}
