import axios, { AxiosError } from 'axios';

// Define base URL based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Update the formatVideoUrl function to handle Google Cloud Storage URLs
export const formatVideoUrl = (videoPath: string | undefined): string | undefined => {
  if (!videoPath) return undefined;
  
  console.log('Formatting video URL from:', videoPath);
  
  // If it's already a full URL (starts with http:// or https://)
  if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
    // It's a cloud storage URL, return as is
    return videoPath;
  }
  
  // Handle Windows file paths (C:\ or file:///C:/)
  if (videoPath.match(/^[a-zA-Z]:\\/) || videoPath.match(/^file:\/\/\/[a-zA-Z]:\//)) {
    console.warn('Local file paths are no longer supported. Please use cloud storage.');
    return undefined;
  }
  
  // If it's a relative path from the backend (often starting with /videos/)
  if (videoPath.startsWith('/videos/')) {
    // Extract base server URL (without the /api/vX part)
    const serverRoot = API_BASE_URL.substring(0, API_BASE_URL.indexOf('/api/v1'));
    return `${serverRoot}${videoPath}`;
  }
  
  // For local file paths returned by the backend
  if (videoPath.includes('/manim-videos/') || videoPath.includes('\\manim-videos\\')) {
    console.warn('Local file paths are no longer supported. Please use cloud storage.');
    return undefined;
  }
  
  // If the path is just a filename, assume it's in the videos directory
  if (!videoPath.includes('/') && !videoPath.includes('\\')) {
    const serverRoot = API_BASE_URL.substring(0, API_BASE_URL.indexOf('/api/v1'));
    return `${serverRoot}/videos/${videoPath}`;
  }
  
  // Default case - just prefix with the server URL if it's a relative path
  if (videoPath.startsWith('/')) {
    const serverRoot = API_BASE_URL.substring(0, API_BASE_URL.indexOf('/api/v1'));
    return `${serverRoot}${videoPath}`;
  }
  
  // Default case - return as is
  return videoPath;
};

// Create a new function to format audio URLs, similar to formatVideoUrl
export const formatAudioUrl = (audioPath: string | undefined): string | undefined => {
  if (!audioPath) return undefined;
  
  console.log('Formatting audio URL from:', audioPath);
  
  // If it's already a full URL (starts with http:// or https://)
  if (audioPath.startsWith('http://') || audioPath.startsWith('https://')) {
    // It's a cloud storage URL, return as is
    return audioPath;
  }
  
  // Handle Windows file paths (C:\ or file:///C:/)
  if (audioPath.match(/^[a-zA-Z]:\\/) || audioPath.match(/^file:\/\/\/[a-zA-Z]:\//)) {
    console.warn('Local file paths are no longer supported. Please use cloud storage.');
    return undefined;
  }
  
  // If it's a relative path from the backend (often starting with /videos/)
  if (audioPath.startsWith('/videos/')) {
    // Extract base server URL (without the /api/vX part)
    const serverRoot = API_BASE_URL.substring(0, API_BASE_URL.indexOf('/api/v1'));
    return `${serverRoot}${audioPath}`;
  }
  
  // For local file paths returned by the backend
  if (audioPath.includes('/manim-videos/') || audioPath.includes('\\manim-videos\\')) {
    console.warn('Local file paths are no longer supported. Please use cloud storage.');
    return undefined;
  }
  
  // If the path is just a filename, assume it's in the videos directory
  if (!audioPath.includes('/') && !audioPath.includes('\\')) {
    const serverRoot = API_BASE_URL.substring(0, API_BASE_URL.indexOf('/api/v1'));
    return `${serverRoot}/videos/${audioPath}`;
  }
  
  // Default case - just prefix with the server URL if it's a relative path
  if (audioPath.startsWith('/')) {
    const serverRoot = API_BASE_URL.substring(0, API_BASE_URL.indexOf('/api/v1'));
    return `${serverRoot}${audioPath}`;
  }
  
  // Default case - return as is
  return audioPath;
};

// Process scene data to ensure video URLs are properly formatted
export const processSceneData = (scene: ISceneOutput): ISceneOutput => {
  return {
    ...scene,
    video_url: formatVideoUrl(scene.video_url),
    audio_url: formatAudioUrl(scene.audio_url)
  };
};

// API types
export interface IStoryboardScene {
  scene_title: string;
  narration: string;
  visual_description: string;
}

export interface ISceneOutput {
  scene_number: number;
  scene_title: string;
  narration: string;
  visual_description: string;
  manim_code: string;
  video_url?: string;
  audio_url?: string;
  status: 'completed' | 'failed';
  error_message?: string;
  correction_attempts?: number;
}

export interface IProjectData {
  projectId: string;
  userIdea?: string;
  storyboard?: IStoryboardScene[];
  scenes: ISceneOutput[];
  status: 'pending' | 'processing' | 'completed' | 'partially_completed' | 'failed';
  final_video_url?: string;
}

// Helper function to extract error details
const getErrorDetails = (error: unknown): string => {
  if (error instanceof AxiosError && error.response) {
    const data = error.response.data;
    console.log('Error response data:', data);
    
    // Try to extract the specific error message from various response formats
    if (typeof data === 'object' && data !== null) {
      if (data.message) return data.message;
      if (data.error) return data.error;
      if (data.status === 'error' && data.message) return data.message;
      if (data.errors && Array.isArray(data.errors)) {
        return data.errors.map((err: any) => `${err.field}: ${err.message}`).join('; ');
      }
    }
  }
  return (error instanceof Error) ? error.message : String(error);
};

// API functions
export const sculptAPI = {
  // Initialize a project with a user idea and get a storyboard
  initiateProject: async (userIdea: string): Promise<{ projectId: string; storyboard: IStoryboardScene[] }> => {
    try {
      console.log('Sending project initiation request with userIdea:', userIdea);
      const response = await api.post('/projects/initiate', { userIdea });
      return response.data.data;
    } catch (error) {
      const errorMessage = getErrorDetails(error);
      console.error('Error initiating project:', errorMessage, error);
      throw error;
    }
  },

  // Generate video from a storyboard
  generateVideo: async (
    projectId: string, 
    storyboard: IStoryboardScene[],
    userIdea?: string
  ): Promise<IProjectData> => {
    try {
      console.log('Sending generate video request for projectId:', projectId);
      const response = await api.post(`/projects/${projectId}/generate-video`, { 
        storyboard,
        userIdea
      });
      
      // Process response to ensure video URLs are correctly formatted
      const projectData = response.data.data;
      return {
        ...projectData,
        scenes: projectData.scenes.map(processSceneData),
        final_video_url: formatVideoUrl(projectData.final_video_url)
      };
    } catch (error) {
      const errorMessage = getErrorDetails(error);
      console.error('Error generating video:', errorMessage, error);
      throw error;
    }
  },

  // Complete flow: initiate project and generate video
  createAnimationFromIdea: async (userIdea: string): Promise<IProjectData> => {
    try {
      // Step 1: Initiate project
      const { projectId, storyboard } = await sculptAPI.initiateProject(userIdea);
      
      // Step 2: Generate video
      return await sculptAPI.generateVideo(projectId, storyboard, userIdea);
    } catch (error) {
      const errorMessage = getErrorDetails(error);
      console.error('Error creating animation from idea:', errorMessage, error);
      throw error;
    }
  }
}; 