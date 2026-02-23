// next.config.js
const createNextIntlPlugin = require('next-intl/plugin');

// Gib den Pfad zu deiner request.js-Datei an
const withNextIntl = createNextIntlPlugin('./i18n/request.js');

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = withNextIntl(nextConfig);
