import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Customer {
  // Personal Information (Mason-like fields)
  title: string;
  firstName: string;
  lastName: string;
  suffix?: string;
  
  // Masonic Details
  rank?: string;
  grandOfficerStatus?: string;
  presentGrandOfficerRole?: string;
  otherGrandOfficerRole?: string;
  
  // Contact Information
  email: string;
  mobile: string;
  phone?: string;
  
  // Additional Info
  dietaryRequirements?: string;
  additionalInfo?: string;
}

interface LodgeDetails {
  grand_lodge_id: string;
  grandLodgeName?: string;
  lodge_id: string;
  lodgeName?: string;
  lodgeNumber?: string;
  organisationId?: string; // Will be fetched when lodge is selected
}

interface TableOrder {
  tableNumber?: string;
  seatingPreferences?: string;
  specialRequests?: string;
}

interface LodgeRegistrationState {
  // Core data
  customer: Customer;
  lodgeDetails: LodgeDetails;
  tableOrder: TableOrder;
  
  // State flags
  isInitialized: boolean;
  isDirty: boolean;
  
  // Actions
  updateCustomer: (customer: Partial<Customer>) => void;
  updateLodgeDetails: (details: Partial<LodgeDetails>) => void;
  updateTableOrder: (order: Partial<TableOrder>) => void;
  
  // Utility actions
  reset: () => void;
  markAsClean: () => void;
  
  // Getters
  isValid: () => boolean;
  getValidationErrors: () => string[];
}

const initialCustomer: Customer = {
  title: '',
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
};

const initialLodgeDetails: LodgeDetails = {
  grand_lodge_id: '',
  lodge_id: '',
};

const initialTableOrder: TableOrder = {};

export const useLodgeRegistrationStore = create<LodgeRegistrationState>()(
  persist(
    (set, get) => ({
      // Initial state
      customer: initialCustomer,
      lodgeDetails: initialLodgeDetails,
      tableOrder: initialTableOrder,
      isInitialized: false,
      isDirty: false,
      
      // Customer actions
      updateCustomer: (customerUpdate) => set((state) => ({
        customer: { ...state.customer, ...customerUpdate },
        isDirty: true,
        isInitialized: true,
      })),
      
      // Lodge actions
      updateLodgeDetails: (detailsUpdate) => set((state) => ({
        lodgeDetails: { ...state.lodgeDetails, ...detailsUpdate },
        isDirty: true,
        isInitialized: true,
      })),
      
      // Table order actions
      updateTableOrder: (orderUpdate) => set((state) => ({
        tableOrder: { ...state.tableOrder, ...orderUpdate },
        isDirty: true,
        isInitialized: true,
      })),
      
      // Utility actions
      reset: () => set({
        customer: initialCustomer,
        lodgeDetails: initialLodgeDetails,
        tableOrder: initialTableOrder,
        isInitialized: false,
        isDirty: false,
      }),
      
      markAsClean: () => set({ isDirty: false }),
      
      // Validation
      isValid: () => {
        const state = get();
        const { customer, lodgeDetails } = state;
        
        // Required fields validation
        return !!(
          customer.title &&
          customer.firstName &&
          customer.lastName &&
          customer.email &&
          customer.mobile &&
          lodgeDetails.grand_lodge_id &&
          lodgeDetails.lodge_id
        );
      },
      
      getValidationErrors: () => {
        const state = get();
        const { customer, lodgeDetails } = state;
        const errors: string[] = [];
        
        // Customer validation
        if (!customer.title) errors.push('Title is required');
        if (!customer.firstName) errors.push('First name is required');
        if (!customer.lastName) errors.push('Last name is required');
        if (!customer.email) errors.push('Email is required');
        if (!customer.mobile) errors.push('Mobile number is required');
        
        // Lodge validation
        if (!lodgeDetails.grand_lodge_id) errors.push('Grand Lodge is required');
        if (!lodgeDetails.lodge_id) errors.push('Lodge is required');
        
        return errors;
      },
    }),
    {
      name: 'lodge-registration-storage',
      partialize: (state) => ({
        customer: state.customer,
        lodgeDetails: state.lodgeDetails,
        tableOrder: state.tableOrder,
        isInitialized: state.isInitialized,
      }),
    }
  )
);