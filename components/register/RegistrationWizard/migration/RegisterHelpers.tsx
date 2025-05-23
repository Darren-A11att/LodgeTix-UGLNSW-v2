import React, { useEffect } from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { RegistrationWizard } from '../registration-wizard';

// Migration components for existing registration type implementations
// These help transition from the old RegisterMyself, RegisterLodge patterns

export const RegisterIndividual = () => {
  const { setRegistrationType } = useRegistrationStore();
  
  useEffect(() => {
    setRegistrationType('individual');
  }, [setRegistrationType]);
  
  return <RegistrationWizard />;
};

export const RegisterLodge = () => {
  const { setRegistrationType } = useRegistrationStore();
  
  useEffect(() => {
    setRegistrationType('lodge');
  }, [setRegistrationType]);
  
  return <RegistrationWizard />;
};

export const RegisterDelegation = () => {
  const { setRegistrationType } = useRegistrationStore();
  
  useEffect(() => {
    setRegistrationType('delegation');
  }, [setRegistrationType]);
  
  return <RegistrationWizard />;
};