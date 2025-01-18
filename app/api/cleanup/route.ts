import { cleanExpiredLinks } from '@/app/lib/mongodb'
import { NextResponse } from 'next/server'

// This endpoint can be called by a CRON job
export async function POST() {
  try {
    await cleanExpiredLinks()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in cleanup:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 