import React from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { SummaryColumn, SummarySection, SummaryItem, StatusIndicator } from '..';
import { Users, User, UsersRound, Clock, CheckSquare, Info } from 'lucide-react';

/**
 * Example implementation of a step-specific summary for Registration Type
 */
export const RegistrationTypeSummary: React.FC = () => {
  const { registrationType } = useRegistrationStore();
  
  // Custom sections specific to registration type step
  const typeSpecificSections = (
    <>
      <SummarySection 
        title="Registration Options" 
        icon={<UsersRound className="h-4 w-4 text-masonic-navy" />}
      >
        <div className="space-y-3">
          <div className={`p-2 rounded-md border ${(registrationType === 'individuals' || registrationType === 'individual') ? 'border-masonic-gold bg-amber-50' : 'border-gray-200'}`}>
            <SummaryItem
              icon={<User className="h-4 w-4 text-blue-600" />}
              label="Individual Registration"
              value={
                <>
                  <span>Register yourself and partners</span>
                  {(registrationType === 'individuals' || registrationType === 'individual') && (
                    <StatusIndicator status="success" text="Selected" className="mt-1" />
                  )}
                </>
              }
            />
          </div>
          
          <div className={`p-2 rounded-md border ${registrationType === 'lodge' ? 'border-masonic-gold bg-amber-50' : 'border-gray-200'}`}>
            <SummaryItem
              icon={<Users className="h-4 w-4 text-indigo-600" />}
              label="Lodge Registration"
              value={
                <>
                  <span>Register your lodge (min 3 members)</span>
                  {registrationType === 'lodge' && (
                    <StatusIndicator status="success" text="Selected" className="mt-1" />
                  )}
                </>
              }
            />
          </div>
          
          <div className={`p-2 rounded-md border ${registrationType === 'delegation' ? 'border-masonic-gold bg-amber-50' : 'border-gray-200'}`}>
            <SummaryItem
              icon={<UsersRound className="h-4 w-4 text-purple-600" />}
              label="Delegation Registration"
              value={
                <>
                  <span>Register an official delegation</span>
                  {registrationType === 'delegation' && (
                    <StatusIndicator status="success" text="Selected" className="mt-1" />
                  )}
                </>
              }
            />
          </div>
        </div>
      </SummarySection>
      
      {registrationType && (
        <SummarySection 
          title="What You'll Need" 
          icon={<CheckSquare className="h-4 w-4 text-green-600" />}
          className="mt-4"
        >
          <div className="space-y-2">
            {(registrationType === 'individuals' || registrationType === 'individual') && (
              <>
                <SummaryItem
                  icon={<Clock className="h-4 w-4 text-gray-500" />}
                  label="Estimated Time"
                  value="5-10 minutes"
                />
                <ul className="list-disc pl-5 text-xs space-y-1">
                  <li>Your personal information</li>
                  <li>Partner details (if registering with a partner)</li>
                  <li>Dietary requirements or special needs</li>
                  <li>Lodge information (for Masons)</li>
                </ul>
              </>
            )}
            
            {registrationType === 'lodge' && (
              <>
                <SummaryItem
                  icon={<Clock className="h-4 w-4 text-gray-500" />}
                  label="Estimated Time"
                  value="10-15 minutes"
                />
                <ul className="list-disc pl-5 text-xs space-y-1">
                  <li>Lodge details including lodge number</li>
                  <li>Information for at least 3 lodge members</li>
                  <li>Member positions and ranks</li>
                  <li>Partner details (if applicable)</li>
                </ul>
              </>
            )}
            
            {registrationType === 'delegation' && (
              <>
                <SummaryItem
                  icon={<Clock className="h-4 w-4 text-gray-500" />}
                  label="Estimated Time"
                  value="15-20 minutes"
                />
                <ul className="list-disc pl-5 text-xs space-y-1">
                  <li>Grand Lodge information</li>
                  <li>Delegation leader details</li>
                  <li>Information for all delegation members</li>
                  <li>Official positions and titles</li>
                </ul>
              </>
            )}
          </div>
        </SummarySection>
      )}
      
      <SummarySection 
        title="Tips" 
        icon={<Info className="h-4 w-4 text-blue-600" />}
        className="mt-4"
        collapsible
        defaultExpanded={false}
      >
        <ul className="list-disc pl-5 text-xs space-y-1">
          <li>Choose the registration type that best fits your attendance plans</li>
          <li>Individual registration is fastest for 1-2 people</li>
          <li>Lodge registration ensures your group sits together</li>
          <li>Delegation registration is for official Grand Lodge representatives</li>
        </ul>
      </SummarySection>
    </>
  );
  
  return (
    <SummaryColumn
      title="Registration Options"
      customSections={typeSpecificSections}
      // No default sections needed for this step
      defaultSections={null}
    />
  );
};