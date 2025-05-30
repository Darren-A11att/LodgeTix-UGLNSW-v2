import { createClient } from '@supabase/supabase-js'
import { Database } from '@/shared/types/database'
import { supabase, getServerClient } from '@/lib/supabase-singleton'

// Types for Package CRUD operations
export interface PackageInput {
  package_id?: string;
  name: string;
  parent_event_id: string;
  discount_percentage?: number;
  discount_amount?: number;
  package_price?: number;
  includes_all_events?: boolean;
  early_bird_discount?: number;
  early_bird_end_date?: string;
  min_tickets_required?: number;
  max_tickets_allowed?: number;
  package_description?: string;
  terms_and_conditions?: string;
  is_active?: boolean;
  child_event_ids?: string[];
  package_tickets?: PackageTicketInput[];
}

export interface PackageTicketInput {
  name: string;
  description?: string;
  price: number;
  quantity_total?: number;
  quantity_sold?: number;
  min_per_order?: number;
  max_per_order?: number;
  attendee_type?: string;
  is_active?: boolean;
  sort_order?: number;
  includes_events?: string[];
  valid_from?: string;
  valid_until?: string;
}

export interface PackageUpdateInput {
  discount_percentage?: number;
  discount_amount?: number;
  package_price?: number;
  includes_all_events?: boolean;
  early_bird_discount?: number;
  early_bird_end_date?: string;
  min_tickets_required?: number;
  max_tickets_allowed?: number;
  package_description?: string;
  terms_and_conditions?: string;
  is_active?: boolean;
  add_event_ids?: string[];
  remove_event_ids?: string[];
}

export interface PackageDetails {
  package_id: string;
  package_name: string;
  parent_event_id: string;
  parent_event_title: string;
  discount_percentage: number | null;
  discount_amount: number | null;
  package_price: number | null;
  includes_all_events: boolean;
  early_bird_discount: number | null;
  early_bird_end_date: string | null;
  min_tickets_required: number | null;
  max_tickets_allowed: number | null;
  package_description: string | null;
  terms_and_conditions: string | null;
  is_active: boolean;
  events: Array<{
    event_id: string;
    title: string;
    subtitle: string | null;
    event_start: string;
    event_end: string | null;
    location: string;
    type: string | null;
    is_parent: boolean;
    individual_price: number | null;
  }>;
  tickets: Array<{
    ticket_id: string;
    name: string;
    description: string | null;
    price: number;
    quantity_total: number;
    quantity_available: number;
    attendee_type: string | null;
    includes_events: string[] | null;
    valid_from: string | null;
    valid_until: string | null;
  }>;
  total_value: number;
  savings: number;
}

export interface PriceCalculation {
  success: boolean;
  package_id: string;
  attendee_count: number;
  base_price: number;
  package_discount: number;
  early_bird_discount: number;
  total_savings: number;
  final_price: number;
  price_per_attendee: number;
  early_bird_active: boolean;
  early_bird_end_date: string | null;
}

export interface ValidationResult {
  success: boolean;
  valid: boolean;
  package_id?: string;
  total_tickets?: number;
  errors?: string[];
  message: string;
  error?: string;
  detail?: string;
}

export interface TicketSelection {
  ticket_id: string;
  quantity: number;
}

export class PackageCrudService {
  private client: ReturnType<typeof createClient<Database>>;

  constructor(isServer: boolean = false) {
    this.client = isServer ? getServerClient() : supabase;
  }

  // ============================================
  // PACKAGE OPERATIONS
  // ============================================

  /**
   * Create a new event package
   */
  async createPackage(packageData: PackageInput): Promise<any> {
    const { data, error } = await this.client.rpc('create_event_package', {
      p_package: packageData
    });

    if (error) {
      console.error('Error creating package:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update an existing package
   */
  async updatePackage(packageId: string, updates: PackageUpdateInput): Promise<any> {
    const { data, error } = await this.client.rpc('update_event_package', {
      p_package_id: packageId,
      p_updates: updates
    });

    if (error) {
      console.error('Error updating package:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a package
   */
  async deletePackage(packageId: string, unlinkEvents: boolean = true): Promise<any> {
    const { data, error } = await this.client.rpc('delete_event_package', {
      p_package_id: packageId,
      p_unlink_events: unlinkEvents
    });

    if (error) {
      console.error('Error deleting package:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create tickets for a package
   */
  async createPackageTickets(packageId: string, tickets: PackageTicketInput[]): Promise<any> {
    const { data, error } = await this.client.rpc('create_package_tickets', {
      p_package_id: packageId,
      p_tickets: tickets
    });

    if (error) {
      console.error('Error creating package tickets:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get detailed package information
   */
  async getPackageDetails(packageId: string): Promise<PackageDetails | null> {
    const { data, error } = await this.client.rpc('get_package_details', {
      p_package_id: packageId
    });

    if (error) {
      console.error('Error fetching package details:', error);
      throw error;
    }

    // RPC returns an array, get first item
    const result = Array.isArray(data) ? data[0] : data;
    return result || null;
  }

  /**
   * Calculate package price with discounts
   */
  async calculatePackagePrice(
    packageId: string, 
    attendeeCount: number = 1,
    applyEarlyBird?: boolean
  ): Promise<PriceCalculation> {
    const { data, error } = await this.client.rpc('calculate_package_price', {
      p_package_id: packageId,
      p_attendee_count: attendeeCount,
      p_apply_early_bird: applyEarlyBird
    });

    if (error) {
      console.error('Error calculating package price:', error);
      throw error;
    }

    return data as PriceCalculation;
  }

  /**
   * Validate package purchase before checkout
   */
  async validatePackagePurchase(
    packageId: string,
    attendeeCount: number,
    ticketSelections: TicketSelection[]
  ): Promise<ValidationResult> {
    const { data, error } = await this.client.rpc('validate_package_purchase', {
      p_package_id: packageId,
      p_attendee_count: attendeeCount,
      p_ticket_selections: ticketSelections
    });

    if (error) {
      console.error('Error validating package purchase:', error);
      throw error;
    }

    return data as ValidationResult;
  }

  /**
   * Clone a package for a new event
   */
  async clonePackage(
    sourcePackageId: string,
    newParentEventId: string,
    includeTickets: boolean = true
  ): Promise<any> {
    const { data, error } = await this.client.rpc('clone_package', {
      p_source_package_id: sourcePackageId,
      p_new_parent_event_id: newParentEventId,
      p_include_tickets: includeTickets
    });

    if (error) {
      console.error('Error cloning package:', error);
      throw error;
    }

    return data;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Create a complete package with events and tickets
   */
  async createCompletePackage(
    packageData: PackageInput,
    childEventIds: string[],
    tickets: PackageTicketInput[]
  ): Promise<{
    packageResult: any;
    ticketsResult?: any;
  }> {
    // Include child events in the package data
    const packageWithEvents = {
      ...packageData,
      child_event_ids: childEventIds
    };

    // Create package with events
    const packageResult = await this.createPackage(packageWithEvents);

    if (!packageResult.success || !packageResult.package_id) {
      return { packageResult };
    }

    // Create tickets if package was successful
    const ticketsResult = await this.createPackageTickets(
      packageResult.package_id,
      tickets
    );

    return { packageResult, ticketsResult };
  }

  /**
   * Add events to an existing package
   */
  async addEventsToPackage(packageId: string, eventIds: string[]): Promise<any> {
    return this.updatePackage(packageId, {
      add_event_ids: eventIds
    });
  }

  /**
   * Remove events from a package
   */
  async removeEventsFromPackage(packageId: string, eventIds: string[]): Promise<any> {
    return this.updatePackage(packageId, {
      remove_event_ids: eventIds
    });
  }

  /**
   * Activate/deactivate a package
   */
  async setPackageActive(packageId: string, isActive: boolean): Promise<any> {
    return this.updatePackage(packageId, { is_active: isActive });
  }

  /**
   * Update package early bird settings
   */
  async updateEarlyBird(
    packageId: string,
    earlyBirdDiscount: number,
    earlyBirdEndDate: string
  ): Promise<any> {
    return this.updatePackage(packageId, {
      early_bird_discount: earlyBirdDiscount,
      early_bird_end_date: earlyBirdEndDate
    });
  }

  /**
   * Check if early bird is currently active
   */
  async isEarlyBirdActive(packageId: string): Promise<boolean> {
    const details = await this.getPackageDetails(packageId);
    
    if (!details || !details.early_bird_end_date || !details.early_bird_discount) {
      return false;
    }

    return new Date(details.early_bird_end_date) > new Date();
  }

  /**
   * Get package savings for display
   */
  async getPackageSavings(packageId: string, attendeeCount: number = 1): Promise<{
    regularPrice: number;
    packagePrice: number;
    savings: number;
    savingsPercentage: number;
    earlyBirdActive: boolean;
    earlyBirdSavings: number;
  }> {
    const details = await this.getPackageDetails(packageId);
    const pricing = await this.calculatePackagePrice(packageId, attendeeCount);

    if (!details || !pricing.success) {
      throw new Error('Unable to calculate package savings');
    }

    const regularPrice = details.total_value * attendeeCount;
    const savingsPercentage = regularPrice > 0 
      ? Math.round((pricing.total_savings / regularPrice) * 100)
      : 0;

    return {
      regularPrice,
      packagePrice: pricing.final_price,
      savings: pricing.total_savings,
      savingsPercentage,
      earlyBirdActive: pricing.early_bird_active,
      earlyBirdSavings: pricing.early_bird_discount
    };
  }

  /**
   * Format package price for display
   */
  formatPackagePrice(priceCalc: PriceCalculation): string {
    const formatter = new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    });

    if (priceCalc.early_bird_active) {
      return `${formatter.format(priceCalc.final_price)} (Early Bird)`;
    }

    return formatter.format(priceCalc.final_price);
  }
}