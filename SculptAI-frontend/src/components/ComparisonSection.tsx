import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ComparisonSection = () => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const timeData = {
    labels: ['Ideation', 'Creation', 'Revisions', 'Export'],
    datasets: [
      {
        label: 'Traditional Process (Hours)',
        data: [8, 40, 16, 4],
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgb(239, 68, 68)',
        hoverBackgroundColor: 'rgb(239, 68, 68)',
      },
      {
        label: 'Sculpt AI (Hours)',
        data: [2, 4, 2, 0.5],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        hoverBackgroundColor: 'rgb(59, 130, 246)',
      },
    ],
  };

  const insights = [
    "Reduce animation creation time by up to 90%",
    "Cut revision cycles from days to hours",
    "Export final content in minutes instead of hours"
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Time-Saving Comparison</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how Sculpt AI revolutionizes the animation workflow
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          {/* Interactive Chart */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg"
          >
            <Bar
              data={timeData}
              options={{
                responsive: true,
                interaction: {
                  mode: 'index' as const,
                  intersect: false,
                },
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        return `${label}: ${value} hours`;
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Hours Required',
                      font: {
                        size: 14,
                        weight: 'bold',
                      },
                    },
                  },
                },
                onHover: (event, elements) => {
                  setHoveredBar(elements[0]?.index ?? null);
                },
              }}
            />
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="space-y-6 p-6"
          >
            <h3 className="text-2xl font-semibold mb-4">Key Insights</h3>
            <ul className="space-y-4">
              {insights.map((insight, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="flex items-start space-x-3"
                >
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-gray-600">{insight}</span>
                </motion.li>
              ))}
            </ul>
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                * Based on average time measurements from real-world animation projects
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;