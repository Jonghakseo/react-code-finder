// @ts-check
import { withReactCodeFinder } from '@react-code-finder/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false
    }
    return config
  },
}

export default withReactCodeFinder()(nextConfig)
