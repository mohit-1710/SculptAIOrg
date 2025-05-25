import { useState, useRef, useEffect } from 'react';
import { Sidebar, SidebarBody, SidebarLink } from '../components/Sidebar';
import { Home, Settings, Video, User, History, Send, Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { sculptAPI } from '../lib/api';
import type { IProjectData, ISceneOutput } from '../lib/api';

export default function UserPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; type: 'user' | 'bot' }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProject, setCurrentProject] = useState<IProjectData | null>(null);
  const [selectedScene, setSelectedScene] = useState<ISceneOutput | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isTTSSpeaking, setIsTTSSpeaking] = useState(false);

  // Handle audio-video synchronization
  useEffect(() => {
    const videoElement = videoRef.current;
    const audioElement = audioRef.current;
    
    if (!videoElement || !audioElement) return;

    const syncAudioWithVideo = () => {
      if (Math.abs(audioElement.currentTime - videoElement.currentTime) > 0.3) {
        audioElement.currentTime = videoElement.currentTime;
      }
      if (!audioElement.paused && videoElement.paused) {
        audioElement.pause();
      } else if (audioElement.paused && !videoElement.paused) {
        audioElement.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    };

    const handleVideoPlay = () => {
      // Try to play the audio element if it exists and isn't errored
      if (!audioError && audioElement.paused) {
        audioElement.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
      
      // Additionally, if external audio failed but we have narration text, use browser TTS
      if (audioError && selectedScene?.narration && 'speechSynthesis' in window) {
        useBrowserTTS(selectedScene.narration);
      }
    };

    const handleVideoPause = () => {
      // Pause audio element if playing
      if (!audioElement.paused) {
        audioElement.pause();
      }
      
      // Also pause any speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
    };

    const handleVideoSeeked = () => {
      audioElement.currentTime = videoElement.currentTime;
      
      // If using speech synthesis, cancel and restart at new position
      if (audioError && selectedScene?.narration && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // Wait a moment for the video to stabilize after seeking
        setTimeout(() => {
          if (!videoElement.paused) {
            useBrowserTTS(selectedScene.narration);
          }
        }, 100);
      }
    };

    videoElement.addEventListener('play', handleVideoPlay);
    videoElement.addEventListener('pause', handleVideoPause);
    videoElement.addEventListener('seeked', handleVideoSeeked);
    
    // Sync audio with video periodically
    const syncInterval = setInterval(syncAudioWithVideo, 1000);
    
    return () => {
      videoElement.removeEventListener('play', handleVideoPlay);
      videoElement.removeEventListener('pause', handleVideoPause);
      videoElement.removeEventListener('seeked', handleVideoSeeked);
      clearInterval(syncInterval);
      // Cancel any ongoing speech when unmounting
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [audioError, selectedScene]);

  // Handle auto-play functionality for scenes
  useEffect(() => {
    const videoElement = videoRef.current;
    const audioElement = audioRef.current;
    
    if (!videoElement) return;

    const handleVideoEnded = () => {
      if (!currentProject || !selectedScene) return;
      
      // Find current scene index
      const currentIndex = currentProject.scenes.findIndex(
        scene => scene.scene_number === selectedScene.scene_number
      );
      
      // If there's a next completed scene, play it
      if (currentIndex >= 0 && currentIndex < currentProject.scenes.length - 1) {
        // Find the next completed scene
        const nextCompletedScenes = currentProject.scenes
          .slice(currentIndex + 1)
          .filter(scene => scene.status === 'completed');
          
        if (nextCompletedScenes.length > 0) {
          handleSceneSelect(nextCompletedScenes[0]);
        }
      }
    };

    videoElement.addEventListener('ended', handleVideoEnded);
    return () => {
      videoElement.removeEventListener('ended', handleVideoEnded);
    };
  }, [currentProject, selectedScene]);

  // Add Web Speech API fallback for narration
  const useBrowserTTS = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower speech rate
    utterance.pitch = 1;
    
    // Try to find an English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.includes('en-'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => setIsTTSSpeaking(true);
    utterance.onend = () => setIsTTSSpeaking(false); // Covers cancel()
    utterance.onerror = () => {
      console.error("Speech synthesis error");
      setIsTTSSpeaking(false);
    };
    utterance.onpause = () => setIsTTSSpeaking(false);
    utterance.onresume = () => setIsTTSSpeaking(true);
    
    window.speechSynthesis.speak(utterance);
  };

  const handleAudioError = () => {
    setAudioError("Unable to load audio narration. Using browser speech instead.");
    setIsAudioLoaded(false);
    console.error('Audio failed to load:', selectedScene?.audio_url);
    
    // Fall back to browser's speech synthesis if available
    if (selectedScene?.narration && 'speechSynthesis' in window) {
      // Add a slight delay to allow the video to start playing first
      setTimeout(() => {
        useBrowserTTS(selectedScene.narration);
      }, 500);
    }
  };

  const handleAudioLoad = () => {
    setIsAudioLoaded(true);
    setAudioError(null);
    console.log('Audio loaded successfully:', selectedScene?.audio_url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    // Validate input
    if (!prompt.trim()) {
      setInputError("Please enter a description for your animation.");
      return;
    }
    
    if (prompt.trim().length < 10) {
      setInputError("Your description must be at least 10 characters long.");
      return;
    }
    
    if (isLoading) return;

    // Add user message
    setMessages(prev => [...prev, { text: prompt, type: 'user' }]);
    const submittedPrompt = prompt; // Store the prompt for API call
    setPrompt(''); // Clear the input field immediately

    setIsLoading(true);
    setGenerationProgress(10); // Start progress
    
    // Add initial bot response
    setMessages(prev => [...prev, { 
      text: "I'll help you create that animation. Starting the process...", 
      type: 'bot' 
    }]);

    try {
      // Fake progress for UX
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          // Increment but stay under 90% until we get actual results
          return Math.min(prev + Math.random() * 8, 85);
        });
      }, 2000);

      // Call the backend API to process the user idea
      const result = await sculptAPI.createAnimationFromIdea(submittedPrompt);
      
      // Clean up progress interval
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      // Update state with the received project data
      setCurrentProject(result);
      
      // Set the first completed scene as selected (if any)
      const firstCompletedScene = result.scenes.find(scene => scene.status === 'completed');
      if (firstCompletedScene) {
        handleSceneSelect(firstCompletedScene);
      } else {
        setSelectedScene(null);
      }
      
      // Add response based on success/failure
      if (result.status === 'completed' || result.status === 'partially_completed') {
        const completedCount = result.scenes.filter(scene => scene.status === 'completed').length;
        setMessages(prev => [...prev, { 
          text: `Animation created successfully! Generated ${completedCount} out of ${result.scenes.length} scenes.`, 
          type: 'bot' 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          text: "I had trouble creating your animation. Please try a different idea or try again later.", 
          type: 'bot' 
        }]);
      }
    } catch (error) {
      console.error('Error creating animation:', error);
      
      // Extract more specific error message if available
      let errorMessage = "Sorry, I encountered an error while creating your animation. Please try again later.";
      if (error instanceof Error) {
        // Check for specific error conditions
        if (error.message.includes('400')) {
          errorMessage = "There was an issue with your request. Please check your input and try again.";
        } else if (error.message.includes('502') || error.message.includes('504')) {
          errorMessage = "The server is currently unavailable. Please try again later.";
        }
      }
      
      setMessages(prev => [...prev, { 
        text: errorMessage, 
        type: 'bot' 
      }]);
    } finally {
      setIsLoading(false);
      // Reset progress after a delay to complete the visual transition
      setTimeout(() => setGenerationProgress(0), 1000);
    }
  };

  const handleSceneSelect = (scene: ISceneOutput) => {
    setSelectedScene(scene);
    setIsVideoLoading(true);
    setVideoError(null);
    setIsAudioLoaded(false); // Reset audio loaded state
    setAudioError(null); // Reset audio error state

    // Check if video_url is an absolute URL (e.g., from GCS)
    let videoSrc = scene.video_url;
    if (scene.video_url && !scene.video_url.startsWith('http')) {
      // If not absolute, construct it using the base URL from env (fallback if needed)
      // This part might be deprecated if all URLs are absolute from GCS
      const baseUrl = import.meta.env.VITE_MANIM_VIDEOS_BASE_URL || `${import.meta.env.VITE_API_URL?.split('/api')[0]}/videos`;
      videoSrc = `${baseUrl}/${scene.video_url}`;
    }
    
    // Update video source
    if (videoRef.current) {
      videoRef.current.src = videoSrc || '';
    }

    // Handle audio source similarly
    if (scene.audio_url) {
      let audioSrc = scene.audio_url;
      if (!scene.audio_url.startsWith('http')) {
        // This part might be deprecated if all URLs are absolute from GCS
        const baseUrl = import.meta.env.VITE_MANIM_VIDEOS_BASE_URL || `${import.meta.env.VITE_API_URL?.split('/api')[0]}/audios`; // Assuming an /audios endpoint or similar
        audioSrc = `${baseUrl}/${scene.audio_url}`;
      }
      
      if (audioRef.current) {
        audioRef.current.src = audioSrc;
        // Pre-check if audio file actually exists to prevent console errors
        preCheckAudioExists(audioSrc).then(exists => {
          if (exists) {
            // Audio will be loaded by the browser if src is valid.
            // We rely on onLoadedData or onError events of the audio element.
          } else {
            handleAudioError(); // Manually trigger error if pre-check fails
          }
        });
      }
    } else {
      // No audio URL, may use TTS if narration is present
      setAudioError("No audio file provided.");
      if (audioRef.current) {
        audioRef.current.src = ''; // Clear any previous audio source
      }
    }
  };

  // Check if an audio file exists before attempting to load it
  const preCheckAudioExists = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Error checking audio file existence:', error);
      return false;
    }
  };

  const handleVideoError = () => {
    setVideoError("Unable to load video. The file might be unavailable or in an unsupported format.");
    setIsVideoLoading(false);
  };

  const handleVideoLoad = () => {
    setIsVideoLoading(false);
    setVideoError(null);
  };

  const sidebarLinks = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Home className="w-6 h-6 text-gray-700 transition-colors group-hover:text-white" />,
    },
    {
      label: "My Projects",
      href: "/projects",
      icon: <Video className="w-6 h-6 text-gray-700 transition-colors group-hover:text-white" />,
    },
    {
      label: "History",
      href: "/history",
      icon: <History className="w-6 h-6 text-gray-700 transition-colors group-hover:text-white" />,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: <User className="w-6 h-6 text-gray-700 transition-colors group-hover:text-white" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="w-6 h-6 text-gray-700 transition-colors group-hover:text-white" />,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody>
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-center py-4">
              <img src = '/logo.jpg'/>
            </div>
            
            <nav className="flex flex-col space-y-2">
              {sidebarLinks.map((link) => (
                <SidebarLink
                  key={link.href}
                  link={link}
                  className="hover:bg-gray-700 group transition-all rounded-lg px-3"
                />
              ))}
            </nav>
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Partition - Chat Interface */}
        <div className="min-w-0 w-[40%] border-r border-gray-200 bg-white transition-all duration-300 flex flex-col relative">
          {/* Add this at the beginning of the first flex-1 div - the left partition, right below its opening tag */}
          {isLoading && generationProgress > 0 && (
            <div className="sticky top-0 w-full bg-white z-10 px-4 py-2 shadow-sm">
              <div className="text-center text-sm text-gray-500 mb-1">
                Generating animation: {Math.round(generationProgress)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-36">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-800">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <span className="ml-2">Processing your request...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Floating Input Form */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-20 pb-8 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <form 
              onSubmit={handleSubmit} 
              className="max-w-3xl mx-auto relative"
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (inputError) setInputError(null);
                }}
                placeholder="Describe the animation you want to create..."
                className={`w-full rounded-lg border ${inputError ? 'border-red-500' : 'border-gray-200'} px-4 py-3 pr-12 shadow-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all`}
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 ${
                  isLoading ? 'text-gray-300' : 'text-gray-400 hover:text-blue-600'
                } transition-colors`}
                disabled={isLoading}
              >
                <Send className="w-5 h-5" />
              </button>
              {inputError && (
                <div className="text-red-500 text-xs mt-1">
                  {inputError}
                </div>
              )}
              <div className="text-xs text-center mt-2 text-gray-400">
                Press Enter to send, Shift + Enter for new line
              </div>
            </form>
          </motion.div>
        </div>

        {/* Right Partition - Video Preview */}
        <div className="w-[60%] flex-shrink-0 p-6 bg-gray-50 flex flex-col overflow-y-auto">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Video Preview</h2>
          
          {/* Video player - Fixed size with min-height/width to prevent shrinking */}
          <div 
            className="bg-black rounded-lg mb-6 flex items-center justify-center overflow-hidden relative" 
            style={{ 
              height: "500px", 
              minHeight: "500px",
              width: "100%",
              minWidth: "600px"
            }}
          >
            {selectedScene?.video_url ? (
              <>
                <video 
                  ref={videoRef}
                  src={selectedScene.video_url} 
                  controls 
                  className="w-full h-full object-contain"
                  autoPlay
                  onError={handleVideoError}
                  onLoadedData={handleVideoLoad}
                  controlsList="nodownload"
                >
                  Your browser does not support the video tag.
                </video>
                
                {/* Audio element (hidden) for separate narration */}
                {selectedScene.audio_url && (
                  <audio
                    ref={audioRef}
                    src={selectedScene.audio_url}
                    onError={handleAudioError}
                    onLoadedData={handleAudioLoad}
                    preload="auto"
                  />
                )}
                
                {/* Audio status indicator */}
                {selectedScene.audio_url && (
                  <div className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-black bg-opacity-60">
                    {audioError ? (
                      <span className="text-red-400">Audio unavailable</span>
                    ) : !isAudioLoaded ? (
                      <span className="text-yellow-300">Loading audio...</span>
                    ) : (
                      <span className="text-green-400">Audio ready</span>
                    )}
                  </div>
                )}
                
                {/* Audio controls - new section */}
                <div className="absolute top-4 left-4 flex space-x-2">
                  {/* Download narration button - when audio is available */}
                  {selectedScene.audio_url && !audioError && isAudioLoaded && (
                    <a 
                      href={selectedScene.audio_url}
                      download={`${selectedScene.scene_title.replace(/\s+/g, '_')}_narration.mp3`}
                      className="bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all"
                      title="Download narration audio"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-12" />
                      </svg>
                    </a>
                  )}
                  
                  {/* Regenerate narration using browser TTS */}
                  {selectedScene.narration && (
                    <button
                      onClick={() => {
                        if (isTTSSpeaking) {
                          window.speechSynthesis.cancel(); // This will trigger onend
                        } else {
                          if (selectedScene?.narration && 'speechSynthesis' in window) {
                            useBrowserTTS(selectedScene.narration);
                          }
                        }
                      }}
                      className="bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all"
                      title={isTTSSpeaking ? "Stop browser speech" : "Play narration using browser speech"}
                    >
                      {isTTSSpeaking ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>
                  )}
                </div>
                
                {/* Fullscreen button */}
                <button 
                  className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white p-2 rounded-full z-10 hover:bg-opacity-80 transition-all"
                  onClick={() => {
                    if (videoRef.current) {
                      if (videoRef.current.requestFullscreen) {
                        videoRef.current.requestFullscreen();
                      }
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                </button>
                
                {/* Auto-play indicator if next scene is available */}
                {currentProject && 
                 selectedScene && 
                 currentProject.scenes.findIndex(s => s.scene_number === selectedScene.scene_number) < 
                 currentProject.scenes.filter(s => s.status === 'completed').length - 1 && (
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-xs">
                    Next scene will play automatically
                  </div>
                )}
                
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin mb-2"></div>
                      <span className="text-white text-sm">Loading video...</span>
                    </div>
                  </div>
                )}
                
                {videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="text-white text-center p-4 max-w-xs">
                      <div className="text-red-400 mb-2 text-3xl">⚠️</div>
                      <p>{videoError}</p>
                      <button 
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.load();
                            setIsVideoLoading(true);
                            setVideoError(null);
                          }
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-white text-center p-4">
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin mb-2"></div>
                    <span>Generating your video...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl mb-2">🎬</div>
                    <p>No video selected</p>
                    <p className="text-gray-400 text-sm mt-2">Enter a prompt to create animations</p>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Scene information section - Add this below the video player */}
          {selectedScene && (
            <div className="mt-2 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Scene {selectedScene.scene_number}: {selectedScene.scene_title}
              </h3>
              
              <div className="mt-3">
                <div className="text-sm font-medium text-gray-500 mb-1">Narration:</div>
                <p className="text-gray-700">{selectedScene.narration}</p>
              </div>
              
              <div className="mt-3">
                <div className="text-sm font-medium text-gray-500 mb-1">Visual Description:</div>
                <p className="text-gray-700">{selectedScene.visual_description}</p>
              </div>
            </div>
          )}
          
          {/* Scene selection */}
          {currentProject && currentProject.scenes.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Scenes</h3>
              <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[300px] p-2">
                {currentProject.scenes.map((scene) => (
                  <div 
                    key={scene.scene_number}
                    onClick={() => scene.status === 'completed' && handleSceneSelect(scene)}
                    className={`
                      border rounded-md p-3 cursor-pointer transition-all
                      ${selectedScene?.scene_number === scene.scene_number 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'}
                      ${scene.status !== 'completed' ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className="text-sm font-medium mb-1 truncate">{scene.scene_title}</div>
                    <div className="text-xs text-gray-500">Scene {scene.scene_number}</div>
                    <div className="text-xs mt-1 px-1.5 py-0.5 inline-block rounded-full bg-gray-100">
                      {scene.status === 'completed' ? (
                        <span className="text-green-600">Completed</span>
                      ) : (
                        <span className="text-red-600">Failed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}