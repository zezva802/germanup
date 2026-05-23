export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/words/:path*',
    '/grammar/:path*',
    '/progress/:path*',
    '/settings/:path*',
  ],
};
