import { NextRequest, NextResponse } from 'next/server';
import { calculateSquareFeesWithDb } from '@/lib/utils/square-fee-calculator';

// Track fee configuration version to detect changes
let configVersion: string | null = null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subtotal, isDomestic, userCountry, forceRefresh = false } = body;

    console.log('📊 [calculate-fees] Request received:', { subtotal, isDomestic, userCountry, forceRefresh });

    if (typeof subtotal !== 'number' || subtotal < 0) {
      console.error('❌ [calculate-fees] Invalid subtotal:', subtotal);
      return NextResponse.json(
        { error: 'Invalid subtotal amount' },
        { status: 400 }
      );
    }

    // Force cache refresh if requested (useful for testing)
    if (forceRefresh) {
      const { paymentGatewayService } = await import('@/lib/services/payment-gateway-service');
      paymentGatewayService.clearCache();
      console.log('🔄 [calculate-fees] Cache cleared due to forceRefresh flag');
    }

    // Calculate fees using database configuration
    console.log('🔄 [calculate-fees] Calculating fees...');
    const feeCalculation = await calculateSquareFeesWithDb(subtotal, {
      isDomestic,
      userCountry
    });

    // Get cache status for monitoring
    const { paymentGatewayService } = await import('@/lib/services/payment-gateway-service');
    const cacheStatus = paymentGatewayService.getCacheStatus();

    console.log('✅ [calculate-fees] Fees calculated:', {
      ...feeCalculation,
      cacheStatus
    });
    
    return NextResponse.json({
      success: true,
      fees: feeCalculation,
      meta: {
        cacheStatus,
        configVersion
      }
    });
  } catch (error) {
    console.error('🚨 [calculate-fees] Fee calculation error:', error);
    console.error('🚨 [calculate-fees] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error 
      ? error.message 
      : 'Failed to calculate fees';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}