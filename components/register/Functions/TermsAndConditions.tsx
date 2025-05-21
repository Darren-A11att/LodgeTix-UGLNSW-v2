import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TermsAndConditionsProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ checked, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  
  // NO syncing or defaults - user must explicitly check the box

  return (
    <div className="p-4">
      <label className="flex items-start space-x-2 cursor-pointer">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)}
          className="h-5 w-5 text-primary border-slate-300 rounded mt-0.5"
        />
        <div className="w-full">
          <span className="text-sm font-medium text-slate-700">I agree to the Terms and Conditions</span>
          
          {/* Desktop view - always expanded */}
          <div className="mt-3 text-xs text-slate-600 prose prose-sm max-w-none hidden sm:block">
            <p className="mb-2">
              By registering for the Grand Proclamation event, you agree to the following terms:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All registration information provided is accurate and complete.</li>
              <li>You understand that tickets are non-refundable but may be transferable subject to approval.</li>
              <li>Photography and video recording may take place during the event and may be used for promotional purposes.</li>
              <li>The United Grand Lodge of NSW & ACT reserves the right to modify the event program if necessary.</li>
              <li>You agree to follow all venue rules and COVID-19 safety requirements in place at the time of the event.</li>
            </ul>
          </div>
          
          {/* Mobile view - accordion with partial preview */}
          <div className="sm:hidden">
            <div 
              className={`mt-3 text-xs text-slate-600 prose prose-sm max-w-none overflow-hidden relative ${expanded ? 'max-h-[1000px]' : 'max-h-[40px]'} transition-all duration-300`}
            >
              <p className="mb-2">
                By registering for the Grand Proclamation event, you agree to the following terms:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All registration information provided is accurate and complete.</li>
                <li>You understand that tickets are non-refundable but may be transferable subject to approval.</li>
                <li>Photography and video recording may take place during the event and may be used for promotional purposes.</li>
                <li>The United Grand Lodge of NSW & ACT reserves the right to modify the event program if necessary.</li>
                <li>You agree to follow all venue rules and COVID-19 safety requirements in place at the time of the event.</li>
              </ul>
              {!expanded && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent"></div>
              )}
            </div>
            <button 
              type="button"
              onClick={() => setExpanded(!expanded)} 
              className="flex items-center justify-center w-full mt-1 text-xs text-masonic-navy font-medium"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" /> Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" /> Read More
                </>
              )}
            </button>
          </div>
        </div>
      </label>
    </div>
  );
};

export default TermsAndConditions; 