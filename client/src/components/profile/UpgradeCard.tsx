import React from 'react';
import { Crown } from 'lucide-react';

interface PlanFeature {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

interface UpgradeCardProps {
  price?: number;
  period?: string;
  features?: PlanFeature[];
  onUpgradeClick?: () => void;
  disclaimer?: string;
}

const defaultFeatures: PlanFeature[] = [
  {
    icon: <Crown className="h-5 w-5 text-pink-500" />,
    title: 'Access to All Models',
    description: 'Get access to our full suite of models including Claude, o3-mini-high, and more!'
  },
  {
    icon: <Crown className="h-5 w-5 text-pink-500" />,
    title: 'Generous Limits',
    description: 'Receive 1500 standard credits per month, plus 100 premium credits* per month.'
  },
  {
    icon: <Crown className="h-5 w-5 text-pink-500" />,
    title: 'Priority Support',
    description: 'Get faster responses and dedicated assistance from the T3 team whenever you need help!'
  }
];

const UpgradeCard: React.FC<UpgradeCardProps> = ({
  price = 10,
  period = 'month',
  features = defaultFeatures,
  onUpgradeClick,
  disclaimer = '* Premium credits are used for GPT Image Gen, o3, Claude Sonnet, Gemini 2.5 Pro, and Grok 3/4. Additional Premium credits can be purchased separately for $8 per 100.'
}) => {
  return (
    <div className="rounded-xl p-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Upgrade to Pro</h2>
        <div className="text-right">
          <span className="text-3xl font-bold text-gray-900">${price}</span>
          <span className="text-primary-600 font-medium">/{period}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="bg-primary-100 p-5 border rounded-lg border-primary-200/30">
            <div className="flex items-center gap-2 mb-2">
              {feature.icon}
              <h3 className="font-semibold text-gray-900">{feature.title}</h3>
            </div>
            <p 
              className="text-sm text-primary-700"
              dangerouslySetInnerHTML={{ __html: feature.description }}
            />
          </div>
        ))}
      </div>

      <button 
        onClick={onUpgradeClick}
        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-custom-md"
      >
        Upgrade Now
      </button>

      {disclaimer && (
        <p className="text-xs text-primary-700 mt-4">
          {disclaimer}
        </p>
      )}
    </div>
  );
};

export default UpgradeCard;