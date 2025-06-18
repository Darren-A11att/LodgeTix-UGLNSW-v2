/**
 * Terms of Service Navigation Component
 * 
 * Provides navigation aids for the unified terms of service, including:
 * - Section-based navigation
 * - User type filtering
 * - Progress tracking
 * - Quick navigation links
 * 
 * @author Claude Code
 * @version 1.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { UserType, TermsSection } from '@/lib/types/unified-terms-types';
import { ChevronDownIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/20/solid';

interface TermsNavigationProps {
  userType?: UserType;
  currentSection?: TermsSection;
  acceptedSections?: TermsSection[];
  onSectionChange?: (section: TermsSection) => void;
  showProgress?: boolean;
  compact?: boolean;
}

interface NavigationSection {
  id: TermsSection;
  title: string;
  description: string;
  userTypes: UserType[];
  subsections: string[];
  estimatedTime: number;
  required: boolean;
}

const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    id: 'general-provisions',
    title: 'General Provisions',
    description: 'Core terms applying to all users',
    userTypes: ['attendee', 'organiser', 'both'],
    subsections: ['Agreement Scope', 'Universal Eligibility', 'Code of Conduct'],
    estimatedTime: 8,
    required: true,
  },
  {
    id: 'attendee-terms',
    title: 'Event Attendee Terms',
    description: 'Specific terms for ticket purchasers',
    userTypes: ['attendee', 'both'],
    subsections: ['Registration Process', 'Payment Terms', 'Cancellation Rights', 'Attendee Protections'],
    estimatedTime: 12,
    required: true,
  },
  {
    id: 'organiser-terms',
    title: 'Event Organiser Terms',
    description: 'Specific terms for event creators',
    userTypes: ['organiser', 'both'],
    subsections: ['Event Management', 'Stripe Connect', 'Refund Management', 'Service Delivery', 'Liability'],
    estimatedTime: 15,
    required: true,
  },
  {
    id: 'shared-responsibilities',
    title: 'Shared Responsibilities',
    description: 'Cross-user interactions and data policies',
    userTypes: ['attendee', 'organiser', 'both'],
    subsections: ['Interaction Protocols', 'Conflict Resolution', 'Data Sharing'],
    estimatedTime: 6,
    required: true,
  },
  {
    id: 'platform-operations',
    title: 'Platform Operations',
    description: 'LodgeTix role and limitations',
    userTypes: ['attendee', 'organiser', 'both'],
    subsections: ['Platform Role', 'Support Services', 'Technical Infrastructure'],
    estimatedTime: 8,
    required: true,
  },
  {
    id: 'legal-framework',
    title: 'Legal Framework',
    description: 'Dispute resolution and compliance',
    userTypes: ['attendee', 'organiser', 'both'],
    subsections: ['Masonic Disputes', 'Governing Law', 'Liability Framework', 'Termination'],
    estimatedTime: 10,
    required: true,
  },
];

export function TermsNavigation({
  userType = 'attendee',
  currentSection,
  acceptedSections = [],
  onSectionChange,
  showProgress = true,
  compact = false,
}: TermsNavigationProps) {
  const [expandedSections, setExpandedSections] = useState<Set<TermsSection>>(new Set());
  const [filterByUserType, setFilterByUserType] = useState(true);

  // Filter sections based on user type
  const visibleSections = NAVIGATION_SECTIONS.filter(section => 
    !filterByUserType || section.userTypes.includes(userType)
  );

  // Calculate progress
  const totalRequired = visibleSections.filter(s => s.required).length;
  const totalAccepted = visibleSections.filter(s => 
    s.required && acceptedSections.includes(s.id)
  ).length;
  const progressPercentage = totalRequired > 0 ? (totalAccepted / totalRequired) * 100 : 0;

  // Calculate total reading time
  const totalReadingTime = visibleSections.reduce((total, section) => 
    total + section.estimatedTime, 0
  );

  const toggleSection = (sectionId: TermsSection) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleSectionClick = (sectionId: TermsSection) => {
    onSectionChange?.(sectionId);
    
    // Scroll to section
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-4">
        <h3 className="font-medium text-gray-900 mb-3">Quick Navigation</h3>
        <nav className="space-y-1">
          {visibleSections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleSectionClick(section.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                currentSection === section.id
                  ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{section.title}</span>
                {acceptedSections.includes(section.id) && (
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                )}
              </div>
            </button>
          ))}
        </nav>
        
        {showProgress && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{totalAccepted}/{totalRequired}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Terms Navigation</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {totalReadingTime} min read
            </span>
            {userType !== 'both' && (
              <button
                onClick={() => setFilterByUserType(!filterByUserType)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {filterByUserType ? 'Show All' : 'Filter'}
              </button>
            )}
          </div>
        </div>
        
        {showProgress && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Acceptance Progress</span>
              <span>{totalAccepted} of {totalRequired} sections</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Content */}
      <div className="divide-y divide-gray-200">
        {visibleSections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const isAccepted = acceptedSections.includes(section.id);
          const isCurrent = currentSection === section.id;
          
          return (
            <div key={section.id} className={isCurrent ? 'bg-blue-50' : ''}>
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${isCurrent ? 'text-blue-900' : 'text-gray-900'}`}>
                          {section.title}
                        </h4>
                        <p className={`text-sm mt-1 ${isCurrent ? 'text-blue-700' : 'text-gray-500'}`}>
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {section.estimatedTime}m
                    </span>
                    {isAccepted && (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
              </button>
              
              {isExpanded && (
                <div className="px-6 pb-4">
                  <div className="ml-8 space-y-2">
                    {section.subsections.map((subsection, index) => (
                      <button
                        key={index}
                        onClick={() => handleSectionClick(section.id)}
                        className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        • {subsection}
                      </button>
                    ))}
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleSectionClick(section.id)}
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Read Section
                        <ChevronRightIcon className="ml-1 h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-500">
            {userType === 'both' ? 'All sections apply' : `${userType} sections shown`}
          </div>
          <div className="text-gray-500">
            Total: {totalReadingTime} minutes
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsNavigation;