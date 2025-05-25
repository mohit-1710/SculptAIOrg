import { motion } from 'framer-motion';
import React from 'react';

interface DemoItemProps {
  videoUrl: string;
  title: string;
  description: string;
  isReversed?: boolean;
}

const DemoItem: React.FC<DemoItemProps> = ({ videoUrl, title, description, isReversed }) => {
  return (
    <div className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-12 py-12 lg:py-20 ${
      isReversed ? 'lg:flex-row-reverse' : ''
    }`}>
      {/* Video Container */}
      <motion.div 
        className="w-full lg:flex-1"
        initial={{ opacity: 0, x: isReversed ? 100 : -100 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      </motion.div>

      {/* Text Content */}
      <motion.div 
        className="w-full lg:flex-1 space-y-4 lg:space-y-6 px-4 lg:px-0"
        initial={{ opacity: 0, x: isReversed ? -100 : 100 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 text-center lg:text-left">
          {title}
        </h3>
        <p className="text-base md:text-lg text-gray-600 leading-relaxed text-center lg:text-left">
          {description}
        </p>
      </motion.div>
    </div>
  );
};

const DemoSection: React.FC = () => {
  const demos = [
    {
      videoUrl: "/demo4.mp4",
      title: "Physics-Based Animations",
      description:"Create lifelike animations with real-world physics simulation. Our AI engine understands gravity, momentum, and collisions to generate natural-looking movements that captivate your audience.",
    },
    {
      videoUrl: "/demo2.mp4",
      title: "Algorithm-Driven Motion",
      description: "Harness the power of advanced algorithms to generate complex animation patterns. From procedural motion to particle systems, create mesmerizing effects that would be impossible to animate manually.",
    },
  ];

  return (
    <section className="relative w-full bg-white py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-16 md:space-y-24">
          {demos.map((demo, index) => (
            <DemoItem
              key={index}
              {...demo}
              isReversed={index % 2 !== 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DemoSection;