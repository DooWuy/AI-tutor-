import React, { useEffect } from 'react';
import { LandingHeader } from '../../components/layout/LandingHeader';
import { LandingFooter } from '../../components/layout/LandingFooter';
import { HeroSection } from './components/HeroSection';
import { KeyMetricsSection } from './components/KeyMetricsSection';
import { FeaturesSection } from './components/FeaturesSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { CtaSection } from './components/CtaSection';

export const LandingPage: React.FC = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen selection:bg-secondary-container selection:text-on-secondary-container">
      <LandingHeader />
      <main className="w-full pt-20 bg-surface min-h-screen">
        <div className="flex flex-col w-full">
          <HeroSection />
          <KeyMetricsSection />
          <FeaturesSection />
          <TestimonialsSection />
          <CtaSection />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
