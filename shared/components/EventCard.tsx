import React from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { EventType } from '../types/event';

interface EventCardProps {
  event: EventType;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow">
      {event.imageSrc && (
        <div className="h-48 overflow-hidden">
          <img 
            src={event.imageSrc} 
            alt={event.title ?? 'Event Image'}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        {event.type && (
          <div className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-4">
            {event.type}
          </div>
        )}
        
        <h3 className="text-xl font-bold mb-2">{event.title}</h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-slate-600">
            <Calendar className="w-4 h-4 mr-2 text-primary" />
            {event.day || 'Date TBC'}
          </div>
          
          <div className="flex items-center text-sm text-slate-600">
            <Clock className="w-4 h-4 mr-2 text-primary" />
            {event.time || 'Time TBC'} {event.until ? ` - ${event.until}` : ''}
          </div>
          
          <div className="flex items-center text-sm text-slate-600">
            <MapPin className="w-4 h-4 mr-2 text-primary" />
            {event.location}
          </div>
          
          {/* Capacity information moved to ticket_definitions table */}
        </div>
        
        <p className="text-slate-700 mb-4">
          {(event.description ?? '').length > 100 
            ? `${(event.description ?? '').substring(0, 100)}...` 
            : (event.description ?? 'No description.')}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="font-bold text-primary">
            {/* Price info now comes from ticket_definitions table */}
            <span className="text-slate-600 text-sm">See ticket options</span>
          </div>
          
          <Link href={`/functions/${event.slug}`} className="btn-outline py-2">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;