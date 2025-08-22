import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SUPPORTED = ['en', 'es'] as const
const DEFAULT = 'en'

function negotiate(req: NextRequest) {
  const c = req.cookies.get('po_locale')?.value as 'en'|'es'|undefined
  if (c && SUPPORTED.includes(c)) return c
  
  const h = req.headers.get('accept-language') || ''
  const parts = h.split(',').map(s => {
    const [t, q] = s.trim().split(';')
    const qq = q?.split('=')[1] ? parseFloat(q.split('=')[1]) : 1
    const b = (t || '').split('-')[0].toLowerCase()
    return { b, qq }
  }).sort((a, b) => b.qq - a.qq)
  
  for (const p of parts) {
    if (SUPPORTED.includes(p.b as any)) return p.b as any
  }
  return DEFAULT as any
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next()
  }
  
  const seg = pathname.split('/').filter(Boolean)[0]
  if (SUPPORTED.includes(seg as any)) return NextResponse.next()
  
  const loc = negotiate(req)
  const url = req.nextUrl.clone()
  url.pathname = `/${loc}${pathname}`
  const res = NextResponse.redirect(url)
  res.cookies.set('po_locale', loc, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  return res
}

export const config = { matcher: ['/((?!_next|.*\\..*).*)', '/'] }
