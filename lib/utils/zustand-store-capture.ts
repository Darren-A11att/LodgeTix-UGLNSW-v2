/**
 * Zustand Store Capture Utility
 * 
 * This utility captures complete Zustand store state for raw_registrations
 * as requested by the user to ensure 100% data fidelity.
 */

export interface ZustandStoreCaptureResult {
  source: string;
  timestamp: string;
  capture_location: string;
  registration_type: 'individual' | 'lodge' | 'delegation';
  zustand_store_state: any;
  calculated_pricing?: {
    totalAmount: number;
    subtotal: number;
    stripeFee: number;
  };
  metadata: {
    store_type: string;
    field_count: number;
    has_attendees: boolean;
    has_pricing: boolean;
  };
}

/**
 * Filter out sensitive credit card fields only
 * All other fields including paymentIntentId should be preserved
 */
export function filterSensitiveFields(storeState: any): any {
  if (!storeState || typeof storeState !== 'object') {
    return storeState;
  }

  // Create a deep copy to avoid mutating original
  const filtered = JSON.parse(JSON.stringify(storeState));
  
  // Recursively remove credit card fields
  function removeCreditCardFields(obj: any): void {
    if (!obj || typeof obj !== 'object') return;
    
    // Remove credit card specific fields
    const creditCardFields = ['cardNumber', 'expiryDate', 'cvc', 'cardName', 'creditCardData'];
    creditCardFields.forEach(field => {
      if (field in obj) {
        delete obj[field];
      }
    });
    
    // Recursively check nested objects
    Object.values(obj).forEach(value => {
      if (typeof value === 'object' && value !== null) {
        removeCreditCardFields(value);
      }
    });
  }
  
  removeCreditCardFields(filtered);
  return filtered;
}

/**
 * Capture complete Zustand store state for individual registrations
 */
export async function captureCompleteRegistrationStoreState(
  registrationData: any,
  calculatedPricing?: { totalAmount: number; subtotal: number; stripeFee: number }
): Promise<ZustandStoreCaptureResult> {
  
  // Extract the complete store state from the request data
  const completeStoreState = registrationData.completeZustandStoreState;
  
  if (!completeStoreState) {
    throw new Error('Complete Zustand store state not provided in registration data');
  }
  
  // Filter out credit card fields only
  const filteredStoreState = filterSensitiveFields(completeStoreState);
  
  // Count fields for metadata
  const fieldCount = countDeepFields(filteredStoreState);
  
  return {
    source: 'complete_zustand_store_state',
    timestamp: new Date().toISOString(),
    capture_location: 'individuals_registration_api',
    registration_type: 'individual',
    zustand_store_state: filteredStoreState,
    calculated_pricing: calculatedPricing,
    metadata: {
      store_type: 'useRegistrationStore',
      field_count: fieldCount,
      has_attendees: Array.isArray(filteredStoreState.attendees) && filteredStoreState.attendees.length > 0,
      has_pricing: !!(calculatedPricing?.totalAmount && calculatedPricing.totalAmount > 0)
    }
  };
}

/**
 * Capture complete Zustand store state for lodge registrations
 */
export async function captureCompleteLodgeStoreState(
  registrationData: any,
  calculatedPricing?: { totalAmount: number; subtotal: number; stripeFee: number }
): Promise<ZustandStoreCaptureResult> {
  
  const completeLodgeStoreState = registrationData.completeLodgeZustandStoreState;
  
  if (!completeLodgeStoreState) {
    throw new Error('Complete Lodge Zustand store state not provided in registration data');
  }
  
  // Filter out credit card fields only
  const filteredStoreState = filterSensitiveFields(completeLodgeStoreState);
  
  // Count fields for metadata
  const fieldCount = countDeepFields(filteredStoreState);
  
  return {
    source: 'complete_lodge_zustand_store_state',
    timestamp: new Date().toISOString(),
    capture_location: 'lodge_registration_api',
    registration_type: 'lodge',
    zustand_store_state: filteredStoreState,
    calculated_pricing: calculatedPricing,
    metadata: {
      store_type: 'useLodgeRegistrationStore',
      field_count: fieldCount,
      has_attendees: !!(filteredStoreState.customer || filteredStoreState.lodgeDetails),
      has_pricing: !!(calculatedPricing?.totalAmount && calculatedPricing.totalAmount > 0)
    }
  };
}

/**
 * Capture complete Zustand store state for delegation registrations
 */
export async function captureCompleteDelegationStoreState(
  registrationData: any,
  calculatedPricing?: { totalAmount: number; subtotal: number; stripeFee: number }
): Promise<ZustandStoreCaptureResult> {
  
  const completeDelegationStoreState = registrationData.completeDelegationZustandStoreState;
  
  if (!completeDelegationStoreState) {
    throw new Error('Complete Delegation Zustand store state not provided in registration data');
  }
  
  // Filter out credit card fields only
  const filteredStoreState = filterSensitiveFields(completeDelegationStoreState);
  
  // Count fields for metadata
  const fieldCount = countDeepFields(filteredStoreState);
  
  return {
    source: 'complete_delegation_zustand_store_state',
    timestamp: new Date().toISOString(),
    capture_location: 'delegation_registration_api',
    registration_type: 'delegation',
    zustand_store_state: filteredStoreState,
    calculated_pricing: calculatedPricing,
    metadata: {
      store_type: 'useDelegationRegistrationStore',
      field_count: fieldCount,
      has_attendees: !!(filteredStoreState.delegationLeader || filteredStoreState.delegationInfo),
      has_pricing: !!(calculatedPricing?.totalAmount && calculatedPricing.totalAmount > 0)
    }
  };
}

/**
 * Count total fields in nested object for metadata
 */
function countDeepFields(obj: any): number {
  if (!obj || typeof obj !== 'object') return 0;
  
  let count = 0;
  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) {
      count += countDeepFields(value);
    } else {
      count += 1;
    }
  }
  return count;
}

/**
 * Store the captured state in raw_registrations table
 */
export async function storeZustandCaptureInRawRegistrations(
  supabase: any,
  captureResult: ZustandStoreCaptureResult,
  registrationId?: string | null
): Promise<{ success: boolean; error?: any }> {
  try {
    const registrationType = `${captureResult.registration_type}_complete_zustand_store`;
    
    const { error } = await supabase
      .from('raw_registrations')
      .insert({
        raw_data: captureResult,
        registration_id: registrationId || null,
        registration_type: registrationType,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error storing Zustand capture:', error);
      return { success: false, error };
    } else {
      console.log(`✅ Complete ${captureResult.registration_type} Zustand store state captured (${captureResult.metadata.field_count} fields)`);
      return { success: true };
    }
  } catch (logError) {
    console.error('Failed to store Zustand capture:', logError);
    return { success: false, error: logError };
  }
}