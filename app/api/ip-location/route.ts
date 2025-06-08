import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the client's real IP address from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
    
    // Priority: CF-Connecting-IP (Cloudflare) > X-Forwarded-For > X-Real-IP
    let clientIp = cfConnectingIp || forwardedFor?.split(',')[0].trim() || realIp;
    
    console.log('[IP Location API] Client IP detection:', {
      'x-forwarded-for': forwardedFor,
      'x-real-ip': realIp,
      'cf-connecting-ip': cfConnectingIp,
      'detected': clientIp
    });

    // Construct API URL with client IP if available
    const apiUrl = clientIp 
      ? `https://ipapi.co/${clientIp}/json/`
      : 'https://ipapi.co/json/';
      
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for server requests

    console.log('[IP Location API] Fetching IP data from ipapi.co for IP:', clientIp || 'auto-detect');
    
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { 
        'User-Agent': 'LodgeTix-Registration/1.0',
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[IP Location API] ipapi.co failed (${response.status}): ${errorText}`);
      
      // Return default location data for Australia if service fails
      return NextResponse.json({
        ip: '0.0.0.0',
        version: 'IPv4',
        city: 'Unknown',
        region: 'Unknown',
        region_code: '',
        country: 'AU',
        country_name: 'Australia',
        country_code: 'AU',
        country_code_iso3: 'AUS',
        latitude: -33.86,
        longitude: 151.20,
        network: undefined,
        country_capital: undefined,
        country_tld: undefined,
        continent_code: undefined,
        in_eu: false,
        postal: undefined,
        timezone: undefined,
        utc_offset: undefined,
        country_calling_code: undefined,
        currency: undefined,
        currency_name: undefined,
        languages: undefined,
        country_area: undefined,
        country_population: undefined,
        asn: undefined,
        org: undefined,
      });
    }

    const ipData = await response.json();
    console.log('[IP Location API] Successfully retrieved IP data:', {
      ip: ipData.ip,
      country: ipData.country,
      country_name: ipData.country_name,
      region: ipData.region,
      city: ipData.city
    });
    
    // Ensure the actual client IP is included if we detected it
    if (clientIp && ipData.ip !== clientIp) {
      console.log('[IP Location API] Warning: API returned different IP than detected client IP');
    }
    
    return NextResponse.json(ipData);
  } catch (error: any) {
    console.error('[IP Location API] Error fetching IP data:', error);
    
    // Return default location data on any error
    return NextResponse.json({
      ip: '0.0.0.0',
      version: 'IPv4',
      city: 'Unknown',
      region: 'Unknown',
      region_code: '',
      country: 'AU',
      country_name: 'Australia',
      country_code: 'AU',
      country_code_iso3: 'AUS',
      latitude: -33.86,
      longitude: 151.20,
      network: undefined,
      country_capital: undefined,
      country_tld: undefined,
      continent_code: undefined,
      in_eu: false,
      postal: undefined,
      timezone: undefined,
      utc_offset: undefined,
      country_calling_code: undefined,
      currency: undefined,
      currency_name: undefined,
      languages: undefined,
      country_area: undefined,
      country_population: undefined,
      asn: undefined,
      org: undefined,
    });
  }
}