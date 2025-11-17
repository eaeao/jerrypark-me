const isLocalHost = (host) => {
  if (!host) return false
  return ['localhost', '127.0.0.1'].includes(host.replace(/:\d+$/, ''))
}

const isDevMode = () => process.env.NODE_ENV === 'development'

export default function ({ req, redirect }) {
  if (isDevMode()) {
    return
  }

  if (process.server && req) {
    const protoHeader = req.headers['x-forwarded-proto']
    const protocol = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader || req.protocol
    const host = req.headers.host

    if (protocol !== 'https' && host && !isLocalHost(host)) {
      redirect(301, `https://${host}${req.url}`)
    }
    return
  }

  if (process.client && typeof window !== 'undefined') {
    const { protocol, host, pathname, search, hash, hostname } = window.location
    if (protocol === 'http:' && host && !isLocalHost(hostname)) {
      window.location.replace(`https://${host}${pathname}${search}${hash}`)
    }
  }
}

