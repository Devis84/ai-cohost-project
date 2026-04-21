const nextConfig = {
  reactStrictMode: true,

  experimental: {
    serverActions: true
  },

  webpack: (config: any) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false
    }
    return config
  }
}

export default nextConfig