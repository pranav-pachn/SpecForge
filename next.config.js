/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Environment variables required by the frontend/API layer
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3000',
  }
};

module.exports = nextConfig;
