// src/components/ui/OnboardingTour.tsx
import React, { useState, useEffect } from 'react';
import './OnboardingTour.css';

const OnboardingTour: React.FC = () => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem('gamut_tour_seen');
    if (!hasSeenTour) {
      // Delay slightly so the app loads first
      setTimeout(() => setVisible(true), 1500);
    }
  }, []);

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleFinish = () => {
    setVisible(false);
    localStorage.setItem('gamut_tour_seen', 'true');
  };

  if (!visible) return null;

  const steps = [
    {
      title: "Welcome to The Gamut",
      desc: "News isn't just black and white. We use AI to show you the full spectrum—Bias, Trust, and Facts.",
      icon: "👋"
    },
    {
      title: "Spot the Bias",
      desc: "Every article gets a 'Bias Score' and 'Political Lean'. See who is spinning the story.",
      icon: "⚖️"
    },
    {
      title: "Compare Perspectives",
      desc: "Don't settle for one side. Tap 'Compare' to see how the Left, Right, and Center report the same event.",
      icon: "🔍"
    },
    {
      title: "Listen & Earn",
      desc: "Busy? Listen to AI audio summaries. Read daily to unlock streaks and badges!",
      icon: "🎧"
    }
  ];

  const currentStep = steps[step];

  return (
    <div className="tour-overlay">
      <div className="tour-card">
        <div className="tour-icon">{currentStep.icon}</div>
        <h2 className="tour-title">{currentStep.title}</h2>
        <p className="tour-desc">{currentStep.desc}</p>
        
        <div className="tour-dots">
            {steps.map((_, i) => (
                <span key={i} className={`tour-dot ${i === step ? 'active' : ''}`} />
            ))}
        </div>

        <div className="tour-actions">
          {step < steps.length - 1 ? (
            <button className="btn-primary tour-btn" onClick={handleNext}>Next</button>
          ) : (
            <button className="btn-primary tour-btn" onClick={handleFinish}>Get Started</button>
          )}
          
          {step < steps.length - 1 && (
            <button className="btn-text" onClick={handleFinish}>Skip</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
