'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, MapPin, User, Building, Mail, Phone, Home, CreditCard, AlertTriangle } from 'lucide-react';

interface LodgeConfirmationPageProps {
  registration: {
    confirmationNumber: string;
    functionData: {
      name: string;
      startDate: string;
      endDate: string;
      organiser?: {
        name: string;
      };
      location?: {
        place_name: string;
        street_address: string;
        suburb: string;
        state: string;
        postal_code: string;
        country: string;
      };
    };
    billingDetails: {
      firstName: string;
      lastName: string;
      emailAddress: string;
      mobileNumber?: string;
      addressLine1?: string;
      suburb?: string;
      stateTerritory?: { name: string };
      postcode?: string;
      country?: { name: string };
    };
    lodgeDetails: {
      lodgeName: string;
      grandLodgeName: string;
      lodgeNumber?: string;
    };
    packages: Array<{
      packageName: string;
      packagePrice: number;
      quantity: number;
      totalPrice: number;
    }>;
    subtotal: number;
    stripeFee: number;
    totalAmount: number;
  };
}

export default function LodgeConfirmationPage({ registration }: LodgeConfirmationPageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const totalPackages = registration.packages.reduce((sum, pkg) => sum + pkg.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lodge Registration Confirmed</h1>
          <p className="text-lg text-gray-600">Thank you for your lodge registration</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-masonic-navy text-white">
            <CardTitle className="text-2xl">{registration.functionData.name}</CardTitle>
            <p className="text-masonic-blue-light mt-2">
              {formatDate(registration.functionData.startDate)} - {formatDate(registration.functionData.endDate)}
            </p>
          </CardHeader>

          <CardContent className="p-6">
            {/* Confirmation Number */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center mb-6">
              <p className="text-sm font-medium text-green-800">Confirmation Number</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{registration.confirmationNumber}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Booking Contact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Booking Contact
                </h3>
                <div className="space-y-2">
                  <p className="font-medium">
                    {registration.billingDetails.firstName} {registration.billingDetails.lastName}
                  </p>
                  {registration.billingDetails.emailAddress && (
                    <p className="text-gray-600 flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {registration.billingDetails.emailAddress}
                    </p>
                  )}
                  {registration.billingDetails.mobileNumber && (
                    <p className="text-gray-600 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {registration.billingDetails.mobileNumber}
                    </p>
                  )}
                  {registration.billingDetails.addressLine1 && (
                    <div className="text-gray-600 flex items-start">
                      <Home className="w-4 h-4 mr-2 mt-1" />
                      <div>
                        <p>{registration.billingDetails.addressLine1}</p>
                        <p>
                          {registration.billingDetails.suburb}, {registration.billingDetails.stateTerritory?.name} {registration.billingDetails.postcode}
                        </p>
                        {registration.billingDetails.country?.name && (
                          <p>{registration.billingDetails.country.name}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Event Details
                </h3>
                <div className="space-y-2">
                  <p className="font-medium">{registration.functionData.name}</p>
                  {registration.functionData.organiser?.name && (
                    <p className="text-gray-600">
                      <strong>Organiser:</strong> {registration.functionData.organiser.name}
                    </p>
                  )}
                  {registration.functionData.location && (
                    <div className="text-gray-600 flex items-start">
                      <MapPin className="w-4 h-4 mr-2 mt-1" />
                      <div>
                        <p>{registration.functionData.location.place_name}</p>
                        <p>{registration.functionData.location.street_address}</p>
                        <p>
                          {registration.functionData.location.suburb}, {registration.functionData.location.state} {registration.functionData.location.postal_code}
                        </p>
                        <p>{registration.functionData.location.country}</p>
                      </div>
                    </div>
                  )}
                  <p className="text-gray-600 flex items-center">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    {formatDate(registration.functionData.startDate)} - {formatDate(registration.functionData.endDate)}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Lodge Registration Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                🏛️ Lodge Registration Details
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-6 border">
                <div className="mb-4">
                  <p className="text-xl font-semibold text-gray-900">
                    {registration.lodgeDetails.lodgeName}
                    {registration.lodgeDetails.lodgeNumber && (
                      <span className="text-lg text-gray-600"> (No. {registration.lodgeDetails.lodgeNumber})</span>
                    )}
                  </p>
                  <p className="text-gray-600 mt-1">{registration.lodgeDetails.grandLodgeName}</p>
                </div>

                {/* Important Message */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 mb-2">Important:</p>
                      <p className="text-yellow-700 mb-2">
                        Lodges will need to provide the details of the Attendees who will be assigned the tickets closer to the event.
                      </p>
                      <p className="text-yellow-700">
                        Please ensure your attendees have registered directly for the Proclamation Ceremony.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Package Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                📦 Package Details
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                {registration.packages.map((pkg, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{pkg.packageName}</p>
                      <p className="text-sm text-gray-600">Quantity: {pkg.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-masonic-navy">{formatCurrency(pkg.totalPrice)}</p>
                      <p className="text-xs text-gray-500">({formatCurrency(pkg.packagePrice)} each)</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Order Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Order Summary
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal ({totalPackages} packages)</span>
                  <span>{formatCurrency(registration.subtotal)}</span>
                </div>
                {registration.stripeFee > 0 && (
                  <div className="flex justify-between text-sm mb-2">
                    <span>Processing Fee</span>
                    <span>{formatCurrency(registration.stripeFee)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total Paid</span>
                  <span className="text-masonic-navy">{formatCurrency(registration.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Footer Message */}
            <div className="text-center text-sm text-gray-600 pt-4">
              <p>A confirmation email has been sent to {registration.billingDetails.emailAddress}</p>
              <p className="mt-1">Please save or print this confirmation for your records</p>
            </div>

            {/* App Footer */}
            <div className="bg-masonic-navy text-white text-center p-4 mt-6 rounded-b-lg text-sm">
              <p className="font-semibold">Thank you for using LodgeTix!</p>
              <p className="mt-1">LodgeTix is a ticket agent for United Grand Lodge of NSW & ACT</p>
              <p className="mt-1">Please contact support@lodgetix.io or phone 0438 871 124</p>
              <p className="mt-2 text-xs">Copyright LodgeTix.io</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}