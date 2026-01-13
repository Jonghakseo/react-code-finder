import type { NextConfig } from 'next'
import { withReactCodeFinder } from '@react-code-finder/nextjs'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false
    }
    return config
  },
}

export default withReactCodeFinder()(nextConfig)
