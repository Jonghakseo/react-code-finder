const { withReactCodeFinder } = require('react-code-finder/next')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = withReactCodeFinder()(nextConfig)
