import { NextResponse } from 'next/server'
import { cleanExpiredLinks } from './lib/mongodb'

let lastCleanup = 0
const CLEANUP_INTERVAL = 1000 * 60 * 60 // 1 hour

export async function middleware() {
  const now = Date.now()
  
  // Run cleanup if it hasn't been run in the last hour
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    lastCleanup = now
    cleanExpiredLinks().catch(console.error)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/:path*'
} 