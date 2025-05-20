import { useCallback } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { User, Users, Shield, Building } from 'lucide-react';

interface RegistrationType {
  id: 'individual' | 'lodge' | 'delegation';
  title: string;
  description: string;
  icon: React.ElementType;
  minAttendees: number;
  defaultAttendeeType: 'Mason' | 'Guest';
  features: string[];
}

const REGISTRATION_TYPES: RegistrationType[] = [
  {
    id: 'individual',
    title: 'Individual Registration',
    description: 'Register yourself and optional additional attendees',
    icon: User,
    minAttendees: 1,
    defaultAttendeeType: 'Mason',
    features: [
      'Register yourself as primary attendee',
      'Add additional attendees if needed',
      'Include partners for any attendee',
      'Flexible attendee types (Mason or Guest)',
    ],
  },
  {
    id: 'lodge',
    title: 'Lodge Registration',
    description: 'Register multiple members from the same lodge',
    icon: Building,
    minAttendees: 3,
    defaultAttendeeType: 'Mason',
    features: [
      'Minimum 3 lodge members required',
      'Shared lodge details for all members',
      'Primary contact designated',
      'Partners can be added for each member',
    ],
  },
  {
    id: 'delegation',
    title: 'Official Delegation',
    description: 'Register a Grand Lodge or official delegation',
    icon: Shield,
    minAttendees: 1,
    defaultAttendeeType: 'Mason',
    features: [
      'Structured delegation roles',
      'Grand Officer designations',
      'Official titles and positions',
      'Formal delegation requirements',
    ],
  },
];

export const useRegistrationType = () => {
  const { registrationType } = useRegistrationStore();
  
  const getTypeConfig = useCallback(() => {
    return REGISTRATION_TYPES.find(t => t.id === registrationType);
  }, [registrationType]);

  const getMinAttendees = useCallback(() => {
    const config = getTypeConfig();
    return config?.minAttendees || 1;
  }, [getTypeConfig]);

  const getDefaultAttendeeType = useCallback(() => {
    const config = getTypeConfig();
    return config?.defaultAttendeeType || 'Guest';
  }, [getTypeConfig]);

  const getTypeFeatures = useCallback(() => {
    const config = getTypeConfig();
    return config?.features || [];
  }, [getTypeConfig]);

  return {
    getTypeConfig,
    getMinAttendees,
    getDefaultAttendeeType,
    getTypeFeatures,
  };
};