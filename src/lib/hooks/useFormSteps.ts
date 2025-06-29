import { useState } from 'react';
import { FormStep, StepConfig } from '../auction-forms/types';

export const stepConfig: Record<FormStep, StepConfig> = {
  welcome: { title: 'Welcome', progress: 0 },
  basic_info: { title: 'Basic Information', progress: 20 },
  pricing: { title: 'Pricing', progress: 40 },
  video: { title: 'Video Information', progress: 60 },
  images: { title: 'Images', progress: 80 },
  review: { title: 'Review & Submit', progress: 100 }
};

export function useFormSteps(initialStep: FormStep = 'basic_info') {
  const [currentStep, setCurrentStep] = useState<FormStep>(initialStep);

  const nextStep = () => {
    const steps: FormStep[] = ['basic_info', 'pricing', 'video', 'images', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      const newStep = steps[currentIndex + 1];
      setCurrentStep(newStep);
      return newStep;
    }
    return currentStep;
  };

  const prevStep = () => {
    const steps: FormStep[] = ['basic_info', 'pricing', 'video', 'images', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      const newStep = steps[currentIndex - 1];
      setCurrentStep(newStep);
      return newStep;
    }
    return currentStep;
  };

  const goToStep = (step: FormStep) => {
    setCurrentStep(step);
  };

  return {
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    goToStep,
    stepConfig: stepConfig[currentStep]
  };
} 
