const { withReactCodeFinder } = require('@react-code-finder/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = withReactCodeFinder()(nextConfig)
