import React, { useCallback } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { User, Users, Shield, Building } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegistrationTypeStepProps {
  onNext: () => void;
}

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

export const RegistrationTypeStep: React.FC<RegistrationTypeStepProps> = ({
  onNext,
}) => {
  const { 
    registrationType, 
    setRegistrationType,
    clearAllAttendees,
    addAttendee,
    updateAttendee,
  } = useRegistrationStore();

  const handleTypeSelection = useCallback((typeId: RegistrationType['id']) => {
    // Clear existing attendees when changing type
    if (registrationType !== typeId) {
      clearAllAttendees();
    }
    
    setRegistrationType(typeId);
    
    // Initialize attendees based on type
    const type = REGISTRATION_TYPES.find(t => t.id === typeId);
    if (!type) return;

    // For lodge registration, create initial required members
    if (typeId === 'lodge') {
      for (let i = 0; i < type.minAttendees; i++) {
        const attendeeId = addAttendee('Mason');
        updateAttendee(attendeeId, {
          isPrimary: i === 0,
        });
      }
    } 
    // For other types, create one primary attendee
    else {
      const attendeeId = addAttendee(type.defaultAttendeeType);
      updateAttendee(attendeeId, {
        isPrimary: true,
      });
    }
  }, [registrationType, setRegistrationType, clearAllAttendees, addAttendee, updateAttendee]);

  const handleContinue = useCallback(() => {
    if (registrationType) {
      onNext();
    }
  }, [registrationType, onNext]);

  return (
    <div className="space-y-8">
      {/* Step header */}
      <div>
        <h2 className="text-2xl font-bold">Choose Registration Type</h2>
        <p className="text-gray-600 mt-1">
          Select how you would like to register for the event
        </p>
      </div>

      {/* Registration type cards */}
      <RadioGroup
        value={registrationType || ''}
        onValueChange={handleTypeSelection}
      >
        <div className="grid gap-4">
          {REGISTRATION_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = registrationType === type.id;

            return (
              <label
                key={type.id}
                htmlFor={type.id}
                className="cursor-pointer"
              >
                <Card className={cn(
                  "transition-all",
                  isSelected && "ring-2 ring-blue-500 shadow-md"
                )}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isSelected ? "bg-blue-100" : "bg-gray-100"
                        )}>
                          <Icon className={cn(
                            "w-6 h-6",
                            isSelected ? "text-blue-600" : "text-gray-600"
                          )} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {type.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {type.description}
                          </CardDescription>
                        </div>
                      </div>
                      <RadioGroupItem
                        value={type.id}
                        id={type.id}
                        className="mt-1"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {type.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </label>
            );
          })}
        </div>
      </RadioGroup>

      {/* Continue button */}
      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!registrationType}
          className="gap-2"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};