import React from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { SummaryColumn } from './SummaryColumn';
import { SummarySection } from './SummarySection';
import { SummaryItem } from './SummaryItem';
import { CheckCircle, Calendar, MapPin, Clock, Download, Mail, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * A simple confirmation summary component
 */
export const SimpleConfirmationSummary: React.FC<{
  showHeader?: boolean;
}> = ({ showHeader = false }) => {
  const { confirmationNumber, attendees } = useRegistrationStore();
  
  // Count attendees by type
  const counts = {
    total: attendees.length,
    masons: attendees.filter(att => att.attendeeType?.toLowerCase() === 'mason').length,
    guests: attendees.filter(att => att.attendeeType?.toLowerCase() === 'guest').length,
    partners: attendees.filter(att => att.isPartner).length
  };
  
  // Example event details - would come from actual event data in production
  const eventDetails = {
    title: "Grand Installation",
    date: "September 15, 2025",
    time: "10:00 AM - 4:00 PM",
    location: "Sydney Masonic Centre",
    address: "66 Goulburn St, Sydney NSW 2000"
  };
  
  return (
    <SummaryColumn
      header={{
        title: 'Confirmation',
        step: 6
      }}
      showHeader={showHeader}
    >
      {/* Success Message */}
      <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-medium text-sm text-green-900">Registration Confirmed</p>
          <p className="text-xs text-green-700">Your order has been successfully processed</p>
        </div>
      </div>
      
      {/* Confirmation Number */}
      <SummarySection title="Confirmation Details">
        <div className="p-3 bg-muted/50 rounded-md text-center">
          <p className="text-xs text-muted-foreground mb-1">Confirmation Number</p>
          <p className="text-base font-bold tracking-wide">{confirmationNumber || 'CONF-SAMPLE'}</p>
        </div>
      </SummarySection>
      
      {/* Registration Summary */}
      <SummarySection title="Registration Summary">
        <SummaryItem
          label="Total Attendees"
          value={counts.total.toString()}
          variant="highlight"
        />
        {counts.masons > 0 && (
          <SummaryItem
            label="Masons"
            value={counts.masons.toString()}
          />
        )}
        {counts.guests > 0 && (
          <SummaryItem
            label="Guests"
            value={counts.guests.toString()}
          />
        )}
        {counts.partners > 0 && (
          <SummaryItem
            label="Partners"
            value={counts.partners.toString()}
          />
        )}
      </SummarySection>
      
      {/* Event Details */}
      <SummarySection title="Event Details">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
            <span className="text-sm">{eventDetails.date}</span>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
            <span className="text-sm">{eventDetails.time}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
            <div>
              <div className="text-sm">{eventDetails.location}</div>
              <div className="text-xs text-muted-foreground">{eventDetails.address}</div>
            </div>
          </div>
        </div>
      </SummarySection>
      
      {/* Quick Actions */}
      <SummarySection title="Quick Actions">
        <div className="grid grid-cols-1 gap-2">
          <Button variant="outline" size="sm" className="justify-start h-8">
            <Download className="h-3.5 w-3.5 mr-2" />
            Download Tickets
          </Button>
          <Button variant="outline" size="sm" className="justify-start h-8">
            <Mail className="h-3.5 w-3.5 mr-2" />
            Email Confirmation
          </Button>
          <Button variant="outline" size="sm" className="justify-start h-8">
            <Calendar className="h-3.5 w-3.5 mr-2" />
            Add to Calendar
          </Button>
        </div>
      </SummarySection>
      
      <div className="text-xs text-muted-foreground mt-4 text-center">
        A confirmation email has been sent to the primary attendee's email address.
      </div>
    </SummaryColumn>
  );
};