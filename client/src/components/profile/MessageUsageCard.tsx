import React from 'react';
import { MessageSquare } from 'lucide-react';
import ProfileCard from './ProfileCard';

interface MessageUsageCardProps {
  usage: {
    current: number;
    total: number;
    remaining: number;
    resetTime: string;
  };
}

const MessageUsageCard: React.FC<MessageUsageCardProps> = ({ usage }) => {
  const usagePercentage = (usage.current / usage.total) * 100;

  return (
    <ProfileCard>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
        <MessageSquare className="h-5 w-5 text-primary-600" />
        Message Usage
      </h3>
      <p className="text-sm text-primary-600 font-medium mb-4">{usage.resetTime}</p>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2 text-gray-700 font-medium">
          <span>Standard</span>
          <span className="text-primary-600">{usage.current}/{usage.total}</span>
        </div>
        <div className="w-full bg-primary-200/50 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full" 
            style={{ width: `${usagePercentage}%` }}
          ></div>
        </div>
      </div>
      
      <p className="text-sm text-primary-600 font-medium">{usage.remaining} messages remaining</p>
      
      <div className="mt-4 p-3 bg-primary-50/70 rounded-lg border border-primary-200/50">
        <p className="text-xs text-primary-700 flex items-center gap-1">
          <span className="w-1 h-1 bg-primary-500 rounded-full"></span>
          Each tool call (e.g. search grounding) used in a reply consumes an additional standard credit.
        </p>
        <p className="text-xs text-primary-700 mt-1">
          Models may not always utilize enabled tools.
        </p>
      </div>
    </ProfileCard>
  );
};

export default MessageUsageCard;