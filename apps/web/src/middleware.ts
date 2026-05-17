export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/vocabulary/:path*',
    '/verbs/:path*',
    '/grammar/:path*',
    '/progress/:path*',
    '/settings/:path*',
  ],
};
