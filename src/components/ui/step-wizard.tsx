'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

interface StepWizardProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
}

export function StepWizard({
  steps,
  currentStep,
  onStepClick,
  className,
  variant = 'default',
}: StepWizardProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1.5">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <motion.div
                key={step.id}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  isCompleted && 'w-6 bg-teal-500',
                  isCurrent && 'w-8 bg-teal-500',
                  !isCompleted && !isCurrent && 'w-6 bg-slate-200 dark:bg-slate-700'
                )}
                layout
              />
            );
          })}
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Step {currentStep + 1} of {steps.length}
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('relative', className)}>
        {/* Progress bar background */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 rounded-full" />
        
        {/* Active progress */}
        <motion.div
          className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <motion.button
                key={step.id}
                onClick={() => onStepClick?.(index)}
                disabled={!onStepClick || isUpcoming}
                className={cn(
                  'flex flex-col items-center gap-2 focus:outline-none',
                  onStepClick && !isUpcoming && 'cursor-pointer'
                )}
                whileHover={onStepClick && !isUpcoming ? { scale: 1.05 } : {}}
                whileTap={onStepClick && !isUpcoming ? { scale: 0.95 } : {}}
              >
                {/* Step circle */}
                <motion.div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                    isCompleted && 'bg-teal-500 text-white shadow-lg shadow-teal-500/30',
                    isCurrent && 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 ring-2 ring-teal-500 shadow-lg',
                    isUpcoming && 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  )}
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0, repeatDelay: 2 }}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </motion.div>

                {/* Label */}
                <span
                  className={cn(
                    'text-xs font-medium transition-colors duration-300',
                    isCurrent && 'text-teal-600 dark:text-teal-400',
                    isCompleted && 'text-slate-600 dark:text-slate-400',
                    isUpcoming && 'text-slate-400 dark:text-slate-600'
                  )}
                >
                  {step.title}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25">
            {steps[currentStep].icon || (
              <span className="text-lg font-bold">{currentStep + 1}</span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {steps[currentStep].title}
            </h3>
            {steps[currentStep].description && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {steps[currentStep].description}
              </p>
            )}
          </div>
        </motion.div>
        <span className="text-sm font-medium text-slate-400 dark:text-slate-600">
          {currentStep + 1} / {steps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ['-100%', '500%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <motion.button
              key={step.id}
              onClick={() => onStepClick?.(index)}
              disabled={!onStepClick}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300',
                isCompleted && 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300',
                isCurrent && 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 ring-1 ring-teal-200 dark:ring-teal-800',
                !isCompleted && !isCurrent && 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400',
                onStepClick && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
              whileHover={onStepClick ? { scale: 1.02 } : {}}
              whileTap={onStepClick ? { scale: 0.98 } : {}}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-5 h-5 rounded-full text-xs',
                  isCompleted && 'bg-teal-500 text-white',
                  isCurrent && 'bg-teal-600 text-white',
                  !isCompleted && !isCurrent && 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                )}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="hidden sm:inline">{step.title}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Step content wrapper with animations
interface StepContentProps {
  children: React.ReactNode;
  stepKey: string | number;
  direction?: 'forward' | 'backward';
}

export function StepContent({ children, stepKey, direction = 'forward' }: StepContentProps) {
  const variants = {
    enter: (direction: string) => ({
      x: direction === 'forward' ? 20 : -20,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: string) => ({
      x: direction === 'forward' ? -20 : 20,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: 'spring', stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Wizard navigation buttons
interface WizardNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  onComplete?: () => void;
  canGoBack?: boolean;
  canGoNext?: boolean;
  isLastStep?: boolean;
  isComplete?: boolean;
  backLabel?: string;
  nextLabel?: string;
  completeLabel?: string;
  className?: string;
}

export function WizardNavigation({
  onBack,
  onNext,
  onComplete,
  canGoBack = true,
  canGoNext = true,
  isLastStep = false,
  isComplete = false,
  backLabel = 'Back',
  nextLabel = 'Continue',
  completeLabel = 'Complete',
  className,
}: WizardNavigationProps) {
  return (
    <div className={cn('flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800', className)}>
      <motion.button
        onClick={onBack}
        disabled={!canGoBack}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
          canGoBack
            ? 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
        )}
        whileHover={canGoBack ? { x: -2 } : {}}
        whileTap={canGoBack ? { scale: 0.98 } : {}}
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        {backLabel}
      </motion.button>

      {isLastStep ? (
        <motion.button
          onClick={onComplete}
          disabled={!isComplete}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300',
            isComplete
              ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          )}
          whileHover={isComplete ? { scale: 1.02 } : {}}
          whileTap={isComplete ? { scale: 0.98 } : {}}
        >
          {completeLabel}
          <Check className="w-4 h-4" />
        </motion.button>
      ) : (
        <motion.button
          onClick={onNext}
          disabled={!canGoNext}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300',
            canGoNext
              ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          )}
          whileHover={canGoNext ? { scale: 1.02 } : {}}
          whileTap={canGoNext ? { scale: 0.98 } : {}}
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}
