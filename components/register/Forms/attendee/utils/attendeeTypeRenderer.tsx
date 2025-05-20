import React from 'react';
import { AttendeeData, FormProps } from '../types';
import { MasonForm } from '../../mason/Layouts/MasonForm';
import { GuestForm } from '../../guest/Layouts/GuestForm';

export const useAttendeeTypeRenderer = () => {
  const renderAttendeeForm = (
    attendee: AttendeeData, 
    props: Omit<FormProps, 'attendeeId'>
  ) => {
    const formProps: FormProps = {
      ...props,
      attendeeId: attendee.attendeeId,
    };

    switch (attendee.attendeeType) {
      case 'Mason':
        return <MasonForm {...formProps} />;
      case 'Guest':
        return <GuestForm {...formProps} />;
      default:
        throw new Error(`Unknown attendee type: ${attendee.attendeeType}`);
    }
  };

  const getFormComponent = (attendeeType: AttendeeData['attendeeType']) => {
    switch (attendeeType) {
      case 'Mason':
        return MasonForm;
      case 'Guest':
        return GuestForm;
      default:
        throw new Error(`Unknown attendee type: ${attendeeType}`);
    }
  };

  return { renderAttendeeForm, getFormComponent };
};