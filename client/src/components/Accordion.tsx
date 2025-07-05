import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean; // Keep for initial render if not controlled
  isOpen?: boolean; // New prop for controlled state
  onToggle?: () => void; // New prop for controlled toggle
}

const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false, isOpen: controlledIsOpen, onToggle }) => {
  // Use internal state if not controlled externally
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const currentIsOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const toggleAccordion = () => {
    if (onToggle) {
      onToggle(); // Call external toggle handler if provided
    } else {
      setInternalIsOpen(!internalIsOpen); // Use internal toggle if not controlled
    }
  };

  return (
    <div className="border border-borderLight rounded-lg overflow-hidden transition-all duration-300 ease-in-out shadow-custom-sm">
      <button
        className="flex justify-between items-center w-full p-3 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-colors duration-200"
        onClick={toggleAccordion}
        aria-expanded={currentIsOpen}
      >
        <span>{title}</span>
        {currentIsOpen ? <ChevronUp className="h-4 w-4 text-primary-600 flex-shrink-0 transition-transform duration-200" /> : <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0 transition-transform duration-200" />}
      </button>
      {
        currentIsOpen && (
          <div className="p-3 text-sm text-gray-700 border-t border-borderLight bg-backgroundLight animate-fade-in">
            {children}
          </div>
        )
      }
    </div>
  );
};

export default Accordion; 