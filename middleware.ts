import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SUPPORTED_LOCALES = ['en', 'es'] as const
const DEFAULT_LOCALE = 'en'

// Mapeo de idiomas y regiones
const LOCALE_MAPPING: Record<string, 'en' | 'es'> = {
  // English variants
  'en': 'en',
  'en-us': 'en',
  'en-gb': 'en',
  'en-ca': 'en',
  'en-au': 'en',
  'en-nz': 'en',
  'en-za': 'en',
  
  // Spanish variants
  'es': 'es',
  'es-es': 'es',
  'es-mx': 'es',
  'es-ar': 'es',
  'es-cl': 'es',
  'es-co': 'es',
  'es-pe': 'es',
  'es-ve': 'es',
  'es-ec': 'es',
  'es-gt': 'es',
  'es-cu': 'es',
  'es-bo': 'es',
  'es-do': 'es',
  'es-hn': 'es',
  'es-py': 'es',
  'es-sv': 'es',
  'es-ni': 'es',
  'es-cr': 'es',
  'es-pa': 'es',
  'es-uy': 'es',
}

function parseAcceptLanguage(acceptLanguage: string): Array<{ locale: string; quality: number }> {
  return acceptLanguage
    .split(',')
    .map(lang => {
      const [locale, qValue] = lang.trim().split(';')
      const quality = qValue ? parseFloat(qValue.split('=')[1]) || 1 : 1
      return { locale: locale.toLowerCase().trim(), quality }
    })
    .sort((a, b) => b.quality - a.quality)
}

function negotiateLocale(req: NextRequest): 'en' | 'es' {
  // 1. Check cookie preference first (highest priority)
  const cookieLocale = req.cookies.get('po_locale')?.value as 'en' | 'es' | undefined
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale
  }
  
  // 2. Check Accept-Language header
  const acceptLanguage = req.headers.get('accept-language')
  if (acceptLanguage) {
    const languages = parseAcceptLanguage(acceptLanguage)
    
    for (const { locale } of languages) {
      // Direct match
      if (LOCALE_MAPPING[locale]) {
        return LOCALE_MAPPING[locale]
      }
      
      // Language code only (e.g., "es" from "es-MX")
      const langCode = locale.split('-')[0]
      if (LOCALE_MAPPING[langCode]) {
        return LOCALE_MAPPING[langCode]
      }
    }
  }
  
  // 3. Check user's timezone for Spanish-speaking regions
  // This is a fallback heuristic
  const timezone = req.headers.get('cf-timezone') // Cloudflare provides this
  if (timezone) {
    const spanishTimezones = [
      'America/Mexico_City', 'America/Bogota', 'America/Lima', 'America/Santiago',
      'America/Buenos_Aires', 'America/Caracas', 'Europe/Madrid', 'America/Guatemala',
      'America/Tegucigalpa', 'America/El_Salvador', 'America/Managua', 'America/Costa_Rica',
      'America/Panama', 'America/Montevideo', 'America/La_Paz', 'America/Asuncion'
    ]
    if (spanishTimezones.includes(timezone)) {
      return 'es'
    }
  }
  
  // 4. Default fallback
  return DEFAULT_LOCALE
}

export function middleware(req: NextRequest) {
  const { pathname, search, hash } = req.nextUrl
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next()
  }
  
  // Extract the locale from the pathname
  const segments = pathname.split('/').filter(Boolean)
  const potentialLocale = segments[0]?.toLowerCase()
  
  // If path already has a valid locale, continue
  if (SUPPORTED_LOCALES.includes(potentialLocale as any)) {
    // Update cookie if it's different
    const response = NextResponse.next()
    const currentCookie = req.cookies.get('po_locale')?.value
    if (currentCookie !== potentialLocale) {
      response.cookies.set('po_locale', potentialLocale, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60, // 1 year
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
    }
    return response
  }
  
  // Negotiate the best locale
  const negotiatedLocale = negotiateLocale(req)
  
  // Build the new URL with the negotiated locale
  const newUrl = req.nextUrl.clone()
  newUrl.pathname = `/${negotiatedLocale}${pathname}`
  newUrl.search = search
  newUrl.hash = hash
  
  // Create redirect response
  const response = NextResponse.redirect(newUrl)
  
  // Set the locale cookie
  response.cookies.set('po_locale', negotiatedLocale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
}
