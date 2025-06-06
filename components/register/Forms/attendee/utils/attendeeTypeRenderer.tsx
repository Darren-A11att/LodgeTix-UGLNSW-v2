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
      case 'mason':
        return <MasonForm {...formProps} />;
      case 'guest':
        return <GuestForm {...formProps} />;
      default:
        throw new Error(`Unknown attendee type: ${attendee.attendeeType}`);
    }
  };

  const getFormComponent = (attendeeType: AttendeeData['attendeeType']) => {
    switch (attendeeType) {
      case 'mason':
        return MasonForm;
      case 'guest':
        return GuestForm;
      default:
        throw new Error(`Unknown attendee type: ${attendeeType}`);
    }
  };

  return { renderAttendeeForm, getFormComponent };
};