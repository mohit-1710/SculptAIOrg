import { useState } from 'react';
import { Sidebar, SidebarBody, SidebarLink } from '../components/Sidebar';
import { Home, Settings, Video, User, History, Send } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; type: 'user' | 'bot' }>>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { text: prompt, type: 'user' }]);
    
    // Simulate bot response (replace with actual API call)
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: "I'll help you create that animation. Generating video...", 
        type: 'bot' 
      }]);
    }, 1000);

    setPrompt('');
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
              <span className="text-xl font-bold">Sculpt AI</span>
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
        <div className="min-w-0 flex-1 border-r border-gray-200 bg-white transition-all duration-300 flex flex-col relative">
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
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the animation you want to create..."
                className="w-full rounded-lg border border-gray-200 px-4 py-3 pr-12 shadow-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <div className="text-xs text-center mt-2 text-gray-400">
              Press Enter to send, Shift + Enter for new line
            </div>
          </motion.div>
        </div>

        {/* Right Partition - Video Preview (unchanged) */}
        <div className="w-[700px] flex-shrink-0 p-8 bg-gray-50">
          <div className="h-full flex items-center justify-center">
            <h2 className="text-2xl font-semibold text-gray-700">Video Preview</h2>
          </div>
        </div>
      </div>
    </div>
  );
}