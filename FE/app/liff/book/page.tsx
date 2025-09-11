'use client';

import { useState } from 'react';
import { BookingSteps } from '@/components/booking/booking-steps';
import { PackageSelection } from '@/components/booking/package-selection';
import { LocationSelection } from '@/components/booking/location-selection';
import { TimeSlotSelection } from '@/components/booking/time-slot-selection';
import { BookingProvider } from '@/contexts/booking-context';

export default function BookPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, title: 'เลือกแพ็กเกจ', component: PackageSelection },
    { id: 2, title: 'กำหนดสถานที่', component: LocationSelection },
    { id: 3, title: 'เลือกเวลา', component: TimeSlotSelection },
  ];

  const CurrentStepComponent = steps.find(step => step.id === currentStep)?.component;

  return (
    <BookingProvider>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md">
          <BookingSteps currentStep={currentStep} totalSteps={steps.length} />
          
          <div className="mt-6">
            {CurrentStepComponent && (
              <CurrentStepComponent 
                onNext={() => setCurrentStep(prev => Math.min(prev + 1, steps.length))}
                onPrev={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
              />
            )}
          </div>
        </div>
      </div>
    </BookingProvider>
  );
}