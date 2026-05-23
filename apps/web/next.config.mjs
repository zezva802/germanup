/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@germanup/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async redirects() {
    return [
      { source: '/vocabulary', destination: '/words', permanent: true },
      { source: '/vocabulary/flashcards', destination: '/words/flashcards', permanent: true },
      { source: '/verbs', destination: '/words', permanent: true },
      { source: '/verbs/practice', destination: '/words', permanent: true },
    ];
  },
};

export default nextConfig;
