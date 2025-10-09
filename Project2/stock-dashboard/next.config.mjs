/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['https://m.stock.naver.com']
    }
  }
};

export default nextConfig;
