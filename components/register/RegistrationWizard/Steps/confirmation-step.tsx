"use client"

import React from 'react'
import { ConfirmationPage } from '@/components/register/confirmation-page'

interface ConfirmationStepProps {
  confirmationNumber?: string;
  confirmationData?: any;
}

function ConfirmationStep({ confirmationNumber: propsConfirmationNumber, confirmationData }: ConfirmationStepProps) {
  // Simply render the ConfirmationPage component with the confirmation number
  const confirmationNumber = propsConfirmationNumber || confirmationData?.confirmationNumber || 'Pending...';
  
  return <ConfirmationPage confirmationNumber={confirmationNumber} />;
}

export default ConfirmationStep;