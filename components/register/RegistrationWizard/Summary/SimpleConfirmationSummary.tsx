import React from 'react';
import { useRegistrationStore } from '@/lib/registrationStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle, Calendar, MapPin, Clock, Download, Mail, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * A simple confirmation summary component
 */
export const SimpleConfirmationSummary: React.FC = () => {
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
    <Card className="border-green-500">
      <CardHeader className="bg-green-50">
        <div className="flex items-center mb-2">
          <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
          <CardTitle>Registration Confirmed</CardTitle>
        </div>
        <CardDescription>
          Your order has been successfully processed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 py-4">
        {/* Confirmation Number */}
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">Confirmation Number</p>
          <p className="text-lg font-bold tracking-wide">{confirmationNumber || 'CONF-SAMPLE'}</p>
        </div>
        
        {/* Registration Summary */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Registration Summary</h3>
          <div className="space-y-1 text-sm pl-1">
            <div className="flex justify-between">
              <span>Total Attendees:</span>
              <span className="font-medium">{counts.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Masons:</span>
              <span>{counts.masons}</span>
            </div>
            <div className="flex justify-between">
              <span>Guests:</span>
              <span>{counts.guests}</span>
            </div>
            <div className="flex justify-between">
              <span>Partners:</span>
              <span>{counts.partners}</span>
            </div>
          </div>
        </div>
        
        {/* Event Details */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Event Details</h3>
          <div className="space-y-2 text-sm pl-1">
            <div className="flex items-start">
              <Calendar className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
              <span>{eventDetails.date}</span>
            </div>
            <div className="flex items-start">
              <Clock className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
              <span>{eventDetails.time}</span>
            </div>
            <div className="flex items-start">
              <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
              <div>
                <div>{eventDetails.location}</div>
                <div className="text-gray-500">{eventDetails.address}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-medium">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button variant="outline" size="sm" className="justify-start">
              <Download className="h-4 w-4 mr-2" />
              Download Tickets
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Email Confirmation
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Add to Calendar
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 p-4 text-center text-sm text-gray-600">
        <p>A confirmation email has been sent to the primary attendee's email address.</p>
      </CardFooter>
    </Card>
  );
};