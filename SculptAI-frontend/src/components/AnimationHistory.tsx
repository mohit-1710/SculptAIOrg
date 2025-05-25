import React from 'react';
import type { IProjectData } from '../lib/api';

interface AnimationHistoryProps {
  projects: IProjectData[];
  onSelectProject: (project: IProjectData) => void;
}

export const AnimationHistory: React.FC<AnimationHistoryProps> = ({ 
  projects, 
  onSelectProject 
}) => {
  if (projects.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No animations created yet. Start by entering a prompt!
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium text-gray-700 mb-3">Your Animations</h3>
      <div className="space-y-3">
        {projects.map((project) => (
          <div
            key={project.projectId}
            onClick={() => onSelectProject(project)}
            className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-base font-medium">{project.userIdea?.substring(0, 50)}...</h4>
              <div className={`text-xs px-2 py-1 rounded-full ${
                project.status === 'completed' ? 'bg-green-100 text-green-700' : 
                project.status === 'partially_completed' ? 'bg-yellow-100 text-yellow-700' : 
                'bg-red-100 text-red-700'
              }`}>
                {project.status.replace('_', ' ')}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {project.scenes.length} scenes | {project.scenes.filter(s => s.status === 'completed').length} completed
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Created: {new Date().toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 