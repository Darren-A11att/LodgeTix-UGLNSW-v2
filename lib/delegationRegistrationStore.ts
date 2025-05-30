import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DelegationLeader {
  // Personal Information
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  mobile: string;
  
  // Masonic Information
  rank: string;
  grandOfficerStatus?: 'Present' | 'Past';
  presentGrandOfficerRole?: string;
  otherGrandOfficerRole?: string;
  
  // Address
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  
  // Additional Info
  dietaryRequirements?: string;
  additionalInfo?: string;
}

interface DelegationDetails {
  delegationType: 'grand_lodge' | 'masonic-order';
  grand_lodge_id: string;
  grandLodgeName?: string;
  // For masonic orders
  orderName?: string;
  organisationId?: string;
}

interface DelegationInfo {
  estimatedSize?: number;
  specialRequests?: string;
  seatingPreferences?: string;
}

interface DelegationRegistrationState {
  // Core data
  delegationLeader: DelegationLeader;
  delegationDetails: DelegationDetails;
  delegationInfo: DelegationInfo;
  
  // State flags
  isInitialized: boolean;
  isDirty: boolean;
  
  // Actions
  updateDelegationLeader: (leader: Partial<DelegationLeader>) => void;
  updateDelegationDetails: (details: Partial<DelegationDetails>) => void;
  updateDelegationInfo: (info: Partial<DelegationInfo>) => void;
  
  // Utility actions
  reset: () => void;
  markAsClean: () => void;
  
  // Getters
  isValid: () => boolean;
  getValidationErrors: () => string[];
}

const initialDelegationLeader: DelegationLeader = {
  firstName: '',
  lastName: '',
  title: '',
  email: '',
  phone: '',
  mobile: '',
  rank: '',
  addressLine1: '',
  city: '',
  state: '',
  postcode: '',
  country: 'Australia',
};

const initialDelegationDetails: DelegationDetails = {
  delegationType: 'grand_lodge',
  grand_lodge_id: '',
};

const initialDelegationInfo: DelegationInfo = {};

export const useDelegationRegistrationStore = create<DelegationRegistrationState>()(
  persist(
    (set, get) => ({
      // Initial state
      delegationLeader: initialDelegationLeader,
      delegationDetails: initialDelegationDetails,
      delegationInfo: initialDelegationInfo,
      isInitialized: false,
      isDirty: false,
      
      // Leader actions
      updateDelegationLeader: (leaderUpdate) => set((state) => ({
        delegationLeader: { ...state.delegationLeader, ...leaderUpdate },
        isDirty: true,
        isInitialized: true,
      })),
      
      // Details actions
      updateDelegationDetails: (detailsUpdate) => set((state) => ({
        delegationDetails: { ...state.delegationDetails, ...detailsUpdate },
        isDirty: true,
        isInitialized: true,
      })),
      
      // Info actions
      updateDelegationInfo: (infoUpdate) => set((state) => ({
        delegationInfo: { ...state.delegationInfo, ...infoUpdate },
        isDirty: true,
        isInitialized: true,
      })),
      
      // Utility actions
      reset: () => set({
        delegationLeader: initialDelegationLeader,
        delegationDetails: initialDelegationDetails,
        delegationInfo: initialDelegationInfo,
        isInitialized: false,
        isDirty: false,
      }),
      
      markAsClean: () => set({ isDirty: false }),
      
      // Validation
      isValid: () => {
        const state = get();
        const { delegationLeader, delegationDetails } = state;
        
        // Required fields validation
        const basicFieldsValid = !!(
          delegationLeader.firstName &&
          delegationLeader.lastName &&
          delegationLeader.title &&
          delegationLeader.email &&
          delegationLeader.mobile &&
          delegationLeader.addressLine1 &&
          delegationLeader.city &&
          delegationLeader.state &&
          delegationLeader.postcode &&
          delegationLeader.country &&
          delegationLeader.rank
        );
        
        // Delegation-specific validation
        const delegationFieldsValid = 
          delegationDetails.delegationType === 'grand_lodge' 
            ? !!delegationDetails.grandLodgeId
            : !!(delegationDetails.orderName);
        
        // Grand officer validation if rank is GL
        const grandOfficerValid = 
          delegationLeader.rank !== 'GL' || 
          (delegationLeader.grandOfficerStatus && 
           (delegationLeader.grandOfficerStatus === 'Past' || 
            (delegationLeader.presentGrandOfficerRole && 
             (delegationLeader.presentGrandOfficerRole !== 'Other' || 
              delegationLeader.otherGrandOfficerRole))));
        
        return basicFieldsValid && delegationFieldsValid && grandOfficerValid;
      },
      
      getValidationErrors: () => {
        const state = get();
        const { delegationLeader, delegationDetails } = state;
        const errors: string[] = [];
        
        // Leader validation
        if (!delegationLeader.firstName) errors.push('First name is required');
        if (!delegationLeader.lastName) errors.push('Last name is required');
        if (!delegationLeader.title) errors.push('Title is required');
        if (!delegationLeader.email) errors.push('Email is required');
        if (!delegationLeader.mobile) errors.push('Mobile number is required');
        if (!delegationLeader.addressLine1) errors.push('Address is required');
        if (!delegationLeader.city) errors.push('City is required');
        if (!delegationLeader.state) errors.push('State is required');
        if (!delegationLeader.postcode) errors.push('Postcode is required');
        if (!delegationLeader.country) errors.push('Country is required');
        if (!delegationLeader.rank) errors.push('Rank is required');
        
        // Grand officer validation
        if (delegationLeader.rank === 'GL') {
          if (!delegationLeader.grandOfficerStatus) {
            errors.push('Grand Officer status is required');
          } else if (delegationLeader.grandOfficerStatus === 'Present') {
            if (!delegationLeader.presentGrandOfficerRole) {
              errors.push('Present Grand Officer role is required');
            } else if (delegationLeader.presentGrandOfficerRole === 'Other' && !delegationLeader.otherGrandOfficerRole) {
              errors.push('Other Grand Officer role description is required');
            }
          }
        }
        
        // Delegation validation
        if (delegationDetails.delegationType === 'grand_lodge') {
          if (!delegationDetails.grandLodgeId) errors.push('Grand Lodge is required');
        } else {
          if (!delegationDetails.orderName) errors.push('Masonic Order name is required');
        }
        
        return errors;
      },
    }),
    {
      name: 'delegation-registration-storage',
      partialize: (state) => ({
        delegationLeader: state.delegationLeader,
        delegationDetails: state.delegationDetails,
        delegationInfo: state.delegationInfo,
        isInitialized: state.isInitialized,
      }),
    }
  )
);