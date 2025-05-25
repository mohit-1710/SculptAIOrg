import { useState } from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
  const [prompt, setPrompt] = useState('');

const shapes = [
  { color: '#FF2D55', type: 'square', size: 'w-40 h-40', rotate: 45 },    // Bright Pink
  { color: '#00F5FF', type: 'circle', size: 'w-48 h-48', rotate: 0 },     // Electric Blue
  { color: '#FFD700', type: 'square', size: 'w-32 h-32', rotate: 15 },    // Golden
  { color: '#9D00FF', type: 'circle', size: 'w-44 h-44', rotate: 0 },     // Vibrant Purple
  { color: '#39FF14', type: 'square', size: 'w-36 h-36', rotate: 30 },    // Neon Green
  { color: '#FF3800', type: 'circle', size: 'w-40 h-40', rotate: 60 },    // Bright Orange
  { color: '#00BFFF', type: 'square', size: 'w-32 h-32', rotate: 45 },    // Deep Sky Blue
  { color: '#FF1493', type: 'circle', size: 'w-38 h-38', rotate: 0 },     // Deep Pink
];;

  return (
    <div className="relative w-full min-h-[85vh] flex items-center bg-white overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {shapes.map((shape, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.2, 0.3, 0.2],
              scale: [0.8, 1, 0.8],
              rotate: shape.rotate
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse",
              delay: i * 0.5
            }}
            className={`absolute ${shape.size} ${shape.type === 'circle' ? 'rounded-full' : ''}`}
            style={{
              left: `${(i * 25) % 100}%`,
              top: `${(i * 20) % 80}%`,
              backgroundColor: `${shape.color}15`,
              border: `2px solid ${shape.color}30`,
              transform: `rotate(${shape.rotate}deg)`,
            }}
          />
        ))}

        {/* Additional floating elements */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={`float-${i}`}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.1, 0.2, 0.1],
              y: [0, -20, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3
            }}
            className="absolute w-3 h-3"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: shapes[i % shapes.length].color,
              borderRadius: i % 2 === 0 ? '50%' : '0',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-4 relative z-10">
        {/* Left Content Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-left"
        >
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] text-gray-700 mb-8">
            Create stunning animations in minutes
          </h1>

          <p className="text-gray-500 text-lg md:text-xl mb-12 max-w-xl">
            We know how hard it is to visualize your ideas, so we made it easy for you to show them.
          </p>

          <div className="flex items-center gap-4 mb-8">
            <button className="px-6 py-3 bg-gray-800/90 text-white rounded-lg hover:bg-gray-700 transition-all backdrop-blur-sm">
             Get Started
            </button>
            <button className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-all">
              Learn More
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your animation..."
              className="w-full px-6 py-4 bg-white/80 backdrop-blur-sm rounded-xl text-gray-600 placeholder-gray-400 border border-gray-200 focus:outline-none focus:border-gray-300 transition-all"
            />
          </div>
        </motion.div>

        {/* Right Video Section with Gradient Effect */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative aspect-video"
        >
          {/* Gradient Background for Video */}
          <div className="absolute -inset-10 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-gradient-to-br from-pink-100 via-purple-50/40 to-pink-50/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-[600px] h-[600px] bg-gradient-to-tl from-pink-100 via-purple-50/40 to-pink-50/30 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-pink-100 via-purple-50/30 to-pink-50/30 rounded-full blur-3xl" />
          </div>

          {/* Video Container */}
          <div className="relative z-10 rounded-2xl overflow-hidden bg-gray-900/90 shadow-2xl backdrop-blur-sm border border-white/10">
            <div className="aspect-video flex items-center justify-center text-white/70">
              Demo Video Will Go Here
            </div>

            {/* Floating Elements Around Video */}
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-8 -left-8 w-16 h-16 border border-white/10 rotate-45"
            />
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute -bottom-8 -right-8 w-16 h-16 border border-white/10 rounded-full"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;