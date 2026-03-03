// next.config.js
const createNextIntlPlugin = require('next-intl/plugin');

// Gib den Pfad zu deiner request.js-Datei an
const withNextIntl = createNextIntlPlugin('./i18n/request.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔥 NEU: Automatisch alle console.log in Produktion entfernen
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = withNextIntl(nextConfig);