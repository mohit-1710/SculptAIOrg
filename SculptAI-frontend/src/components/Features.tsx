import { motion } from 'framer-motion';
import { useRef } from 'react';
import { AnimatedCard } from './AnimatedCard';
import { 
  RiAiGenerate, RiRobot2Fill, RiBrainFill,
  RiVideoFill, RiMovieFill, RiCameraFill,
  RiFileTextFill, RiDownloadFill, RiUploadFill,
  RiPaletteFill, RiBrushFill, RiPaintFill,
  RiEyeFill, RiEyeLine, RiEye2Fill,
  RiTeamFill, RiGroupFill, RiUserFill 
} from 'react-icons/ri';

const Features = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      title: 'Advanced AI Generation',
      description: 'Create stunning animations with our state-of-the-art AI technology',
      icons: [
        { icon: <RiAiGenerate className="w-8 h-8 text-purple-500" />, size: "lg" },
        { icon: <RiRobot2Fill className="w-8 h-8 text-purple-400" />, size: "lg" },
        { icon: <RiBrainFill className="w-8 h-8 text-purple-300" />, size: "lg" }
      ],
    },
    {
      title: 'Video Generation',
      description: 'Transform your ideas into high-quality video content instantly',
      icons: [
        { icon: <RiVideoFill className="w-8 h-8 text-pink-500" />, size: "lg" },
        { icon: <RiMovieFill className="w-8 h-8 text-pink-400" />, size: "lg" },
        { icon: <RiCameraFill className="w-8 h-8 text-pink-300" />, size: "lg" }
      ],
    },
    {
      title: 'High Quality Export',
      description: 'Download and share your animations in multiple formats',
      icons: [
        { icon: <RiFileTextFill className="w-8 h-8 text-blue-500" />, size: "lg" },
        { icon: <RiDownloadFill className="w-8 h-8 text-blue-400" />, size: "lg" },
        { icon: <RiUploadFill className="w-8 h-8 text-blue-300" />, size: "lg" }
      ],
    },
    {
      title: 'Proven Styles',
      description: 'Choose from a variety of pre-built professional animation styles',
      icons: [
        { icon: <RiPaletteFill className="w-8 h-8 text-orange-500" />, size: "lg" },
        { icon: <RiBrushFill className="w-8 h-8 text-orange-400" />, size: "lg" },
        { icon: <RiPaintFill className="w-8 h-8 text-orange-300" />, size: "lg" }
      ],
    },
    {
      title: 'Real-time Preview',
      description: 'See your changes instantly as you create',
      icons: [
        { icon: <RiEyeFill className="w-8 h-8 text-green-500" />, size: "lg" },
        { icon: <RiEyeLine className="w-8 h-8 text-green-400" />, size: "lg" },
        { icon: <RiEye2Fill className="w-8 h-8 text-green-300" />, size: "lg" }
      ],
    },
    {
      title: 'Collaboration Tools',
      description: 'Share and work together with your team seamlessly',
      icons: [
        { icon: <RiTeamFill className="w-8 h-8 text-violet-500" />, size: "lg" },
        { icon: <RiGroupFill className="w-8 h-8 text-violet-400" />, size: "lg" },
        { icon: <RiUserFill className="w-8 h-8 text-violet-300" />, size: "lg" }
      ],
    }
  ];

  return (
    <section 
      ref={containerRef}
      className="relative w-full bg-white py-20"
    >
     
      <div className="max-w-6xl mx-auto px-4">
        {/* Centered Heading */}
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 1, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl text-gray-700 md:text-6xl font-bold"
          >
            Powerful Features
          </motion.h2>
          <motion.p
            initial={{ opacity: 1, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-xl text-gray-700 max-w-2xl mx-auto"
          >
            Everything you need to bring your ideas to life
          </motion.p>
        </div>

        {/* Updated Grid Container with Pinterest Layout */}
        <div className="max-w-7xl mx-auto">
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-0">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: i * 0.1
                  }
                }}
                viewport={{ once: false, margin: "-100px" }}
              >
                <AnimatedCard
                  title={feature.title}
                  description={feature.description}
                  icons={feature.icons}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;