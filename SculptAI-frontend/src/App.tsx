import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import UserPage from './pages/UserPage';
import './App.css';

function App() {
  return (
      <Router>
        <Routes>
          <Route path="/" element={
            <div className="min-h-screen bg-[#FCFCFC] text-gray-900 dark:text-white transition-colors duration-200">
              <Navbar />
              <main className="relative z-10">
                <HomePage />
              </main>
            </div>
          } />
          <Route path="/dashboard/*" element={<UserPage />} />
        </Routes>
      </Router>
  );
}

export default App;