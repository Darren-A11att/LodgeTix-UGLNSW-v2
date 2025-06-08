import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get all possible IP headers
  const headers = {
    'x-forwarded-for': request.headers.get('x-forwarded-for'),
    'x-real-ip': request.headers.get('x-real-ip'),
    'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
    'true-client-ip': request.headers.get('true-client-ip'),
    'x-client-ip': request.headers.get('x-client-ip'),
    'x-forwarded': request.headers.get('x-forwarded'),
    'forwarded-for': request.headers.get('forwarded-for'),
    'forwarded': request.headers.get('forwarded'),
  };

  // Get the detected IP using the same logic as ip-location route
  const clientIp = headers['cf-connecting-ip'] || 
    headers['x-forwarded-for']?.split(',')[0].trim() || 
    headers['x-real-ip'];

  return NextResponse.json({
    detectedIp: clientIp || 'Could not detect client IP',
    allHeaders: headers,
    userAgent: request.headers.get('user-agent'),
    host: request.headers.get('host'),
    timestamp: new Date().toISOString()
  });
}