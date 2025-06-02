import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = 'https://ipapi.co/json/';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for server requests

    console.log('[IP Location API] Fetching IP data from ipapi.co...');
    
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
    console.log('[IP Location API] Successfully retrieved IP data');
    
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