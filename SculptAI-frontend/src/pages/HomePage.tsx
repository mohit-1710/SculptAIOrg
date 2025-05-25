import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import DemoSection from '../components/DemoSection';
import ComparisonSection from '../components/ComparisonSection';
import Footer from '../components/Footer';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen pt-32 pb-16 px-6 lg:px-8">
      {/* Hero Section */}
      <section id="hero">
        <Hero />
      </section>

      {/* Features Section */}
      <section id="features">
        <Features />
      </section>

      {/* Examples Section */}
      <section id="examples">
        <DemoSection />
      </section>

      <ComparisonSection />
      <Footer />
    </div>
  );
};

export default HomePage;