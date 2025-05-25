import { motion } from 'framer-motion';

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: string;
  gradientColors: string;
}

const FeatureCard = ({ title, description, icon, gradientColors }: FeatureCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative p-6 bg-white rounded-xl overflow-hidden"
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors} opacity-5`} />

      {/* Content */}
      <div className="relative z-10 space-y-4">
        {icon && (
          <span className="inline-block p-3 bg-white/80 rounded-lg">
            <img src={icon} alt="" className="w-6 h-6" />
          </span>
        )}
        <h3 className="text-xl font-bold text-gray-900">
          {title}
        </h3>
        <p className="text-gray-600">
          {description}
        </p>
      </div>

      {/* Hover Border */}
      <div className="absolute inset-0 border-2 border-transparent opacity-0 hover:opacity-100 hover:border-current rounded-xl transition-all duration-200" />
    </motion.div>
  );
};

// Usage example in your Features component
const features = [
  {
    title: 'Advanced AI Generation',
    description: 'Create stunning animations with our state-of-the-art AI technology',
    gradientColors: 'from-purple-500 to-blue-500',
    icon: '/icons/ai.svg',
  },
  // ... other features
];

// In your JSX
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {features.map((feature) => (
    <FeatureCard key={feature.title} {...feature} />
  ))}
</div>

export default FeatureCard;