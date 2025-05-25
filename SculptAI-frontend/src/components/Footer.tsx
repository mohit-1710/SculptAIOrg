import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  const navigation = [
    { name: 'Home', href: '#' },
    { name: 'Features', href: '#features' },
    { name: 'Examples', href: '#examples' },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="flex items-center"
          >
            <a href="#" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-black">
                Sculpt AI
              </span>
            </a>
          </motion.div>

          {/* Navigation */}
          <nav className="flex space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-500 hover:text-gray-900 transition-colors duration-200"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Copyright */}
          <div className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Sculpt AI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;