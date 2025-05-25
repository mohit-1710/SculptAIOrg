import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-8 left-1/2 -translate-x-1/2 w-[85%] max-w-6xl z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-full shadow-lg py-3 px-6 border border-white/40">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-blue-50 p-2 flex items-center justify-center">
              <img 
                src="/logo.png"
                alt="SculptAI Logo"
                className="h-5 w-auto"
              />
            </div>
            <span className="text-lg font-semibold bg-black bg-clip-text text-transparent">
              SculptAI
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-all hover:scale-105">Home</a>
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-all hover:scale-105">Features</a>
            <a href="#examples" className="text-gray-600 hover:text-blue-600 transition-all hover:scale-105">Examples</a>
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            
              <Link 
                to="/login" 
                className="px-5 py-2 text-gray-700 hover:text-blue-600 transition-all hover:scale-105"
              >
                Log in
              </Link>
            <Link 
              to="/signup" 
              className="px-5 py-2 bg-gray-600 text-white rounded-full hover:bg-blue-700 transition-all hover:scale-105 shadow-md hover:shadow-xl"
            >
              Sign up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-blue-600 transition-all rounded-full hover:bg-blue-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`${
          isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        } md:hidden mt-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg py-5 px-5 border border-white/40 transition-all duration-200`}
      >
        {/* Mobile Menu Navigation Links */}
        <div className="flex flex-col space-y-4">
          <a href="#" className="text-gray-600 hover:text-blue-600 transition-all hover:scale-105 text-center">
            Home
          </a>
          <a href="#features" className="text-gray-600 hover:text-blue-600 transition-all hover:scale-105 text-center">
            Features
          </a>
          <a href="#examples" className="text-gray-600 hover:text-blue-600 transition-all hover:scale-105 text-center">
            Examples
          </a>
          <div className="h-px bg-gray-200 my-2"></div>
          <Link 
            to="/login" 
            className="text-gray-600 hover:text-blue-600 transition-all hover:scale-105 text-center"
          >
            Log in
          </Link>
          <Link 
            to="/signup" 
            className="bg-blue-600 text-white rounded-full py-2 hover:bg-blue-700 transition-all hover:scale-105 text-center shadow-md hover:shadow-xl"
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  )
}