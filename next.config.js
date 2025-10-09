/** @type {import('next').NextConfig} */
const imageDomains = ['replicate.com']

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL

if (supabaseUrl) {
  try {
    const { hostname } = new URL(supabaseUrl)
    if (hostname && !imageDomains.includes(hostname)) {
      imageDomains.push(hostname)
    }
  } catch (error) {
    console.warn('Invalid Supabase URL provided in environment variables', error)
  }
}

const nextConfig = {
  images: {
    domains: imageDomains,
  },
}

module.exports = nextConfig