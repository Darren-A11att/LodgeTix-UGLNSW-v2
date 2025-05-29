import { NextResponse } from 'next/server'
import { clearEventCache } from '@/lib/event-facade'

export async function POST() {
  try {
    // Clear the event cache
    clearEventCache()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Event cache cleared successfully' 
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST method to clear the cache' 
  })
}