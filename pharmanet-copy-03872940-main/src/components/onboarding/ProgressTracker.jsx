import React from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export default function ProgressTracker({ steps, currentStep }) {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;
  
  return (
    <div className="w-full">
      {/* Animated Progress Steps */}
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 mx-6" />
        
        {/* Animated Progress Line */}
        <motion.div 
          className="absolute top-4 left-0 h-0.5 bg-teal-600 mx-6 origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ width: `calc(100% - 48px)` }}
        />

        {/* Step Circles */}
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={stepNumber} className="flex flex-col items-center z-10">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isCompleted ? "#0d9488" : isCurrent ? "#0d9488" : "#f3f4f6",
                  borderColor: isCompleted ? "#0d9488" : isCurrent ? "#0d9488" : "#d1d5db",
                }}
                transition={{ duration: 0.3, type: "spring", stiffness: 500 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white
                  ${isCompleted ? 'border-teal-600 bg-teal-600' : ''}
                  ${isCurrent ? 'border-teal-600 bg-teal-600 ring-4 ring-teal-100' : ''}
                  ${isUpcoming ? 'border-gray-300 bg-gray-100' : ''}
                `}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.3, type: "spring" }}
                  >
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-xs font-bold ${
                      isCurrent ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {stepNumber}
                  </motion.span>
                )}
              </motion.div>
              
              {/* Step Label - Only show on larger screens */}
              <motion.span
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`hidden sm:block text-[10px] font-medium mt-1.5 text-center max-w-[60px] leading-tight ${
                  isCompleted || isCurrent ? 'text-teal-700' : 'text-gray-400'
                }`}
              >
                {step.name}
              </motion.span>
            </div>
          );
        })}
      </div>

      {/* Current Step Label for Mobile */}
      <motion.div 
        key={currentStep}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:hidden text-center mt-3"
      >
        <span className="text-xs font-semibold text-teal-700">
          Step {currentStep}: {steps[currentStep - 1]?.name}
        </span>
      </motion.div>
    </div>
  );
}