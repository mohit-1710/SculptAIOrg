import { motion } from 'framer-motion';
import { Plus, Video, ChevronRight } from 'lucide-react';

export default function DashboardHero() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center justify-between gap-8"
        >
          {/* Left side content */}
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Ready to Create?
            </h1>
            <p className="text-lg text-gray-600 max-w-lg">
              Start a new animation project or continue where you left off.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-5 h-5" />
                New Project
              </button>
              <button className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                <Video className="w-5 h-5" />
                View Tutorials
              </button>
            </div>
          </div>

          {/* Right side stats */}
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 w-full md:w-auto">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between gap-8">
                <div>
                  <p className="text-sm text-gray-500">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Renders</p>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                </div>
              </div>
              <button className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors">
                View All Projects
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}