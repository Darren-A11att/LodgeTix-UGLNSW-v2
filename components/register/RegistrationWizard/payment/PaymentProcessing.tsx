import React from 'react';
import { CheckIcon, XIcon, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ProcessingStep {
  name: string;
  description: string;
  status: 'complete' | 'current' | 'upcoming' | 'error';
}

interface PaymentProcessingProps {
  steps: ProcessingStep[];
  error?: string | null;
  onBackToPayment?: () => void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export const PaymentProcessing: React.FC<PaymentProcessingProps> = ({ steps, error, onBackToPayment }) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-8 pb-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-2">
            {error ? 'Registration Error' : 'Processing Your Registration'}
          </h2>
          <p className="text-muted-foreground">
            {error ? 'An error occurred during registration' : 'Please wait while we complete your registration...'}
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Payment Processing Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <nav aria-label="Progress" className="max-w-md mx-auto">
          <ol role="list" className="overflow-hidden">
            {steps.map((step, stepIdx) => (
              <li key={step.name} className={classNames(stepIdx !== steps.length - 1 ? 'pb-6' : '', 'relative')}>
                {step.status === 'complete' ? (
                  <>
                    {stepIdx !== steps.length - 1 ? (
                      <div aria-hidden="true" className="absolute top-4 left-4 mt-0.5 -ml-px h-full w-0.5 bg-green-600" />
                    ) : null}
                    <div className="group relative flex items-start">
                      <span className="flex h-9 items-center">
                        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
                          <CheckIcon aria-hidden="true" className="h-5 w-5 text-white" />
                        </span>
                      </span>
                      <span className="ml-4 flex min-w-0 flex-col">
                        <span className="text-sm font-medium">{step.name}</span>
                        <span className="text-sm text-muted-foreground">{step.description}</span>
                      </span>
                    </div>
                  </>
                ) : step.status === 'current' ? (
                  <>
                    {stepIdx !== steps.length - 1 ? (
                      <div aria-hidden="true" className="absolute top-4 left-4 mt-0.5 -ml-px h-full w-0.5 bg-gray-300" />
                    ) : null}
                    <div className="group relative flex items-start">
                      <span aria-hidden="true" className="flex h-9 items-center">
                        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-white">
                          <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                        </span>
                      </span>
                      <span className="ml-4 flex min-w-0 flex-col">
                        <span className="text-sm font-medium text-primary">{step.name}</span>
                        <span className="text-sm text-muted-foreground">{step.description}</span>
                      </span>
                    </div>
                  </>
                ) : step.status === 'error' ? (
                  <>
                    {stepIdx !== steps.length - 1 ? (
                      <div aria-hidden="true" className="absolute top-4 left-4 mt-0.5 -ml-px h-full w-0.5 bg-gray-300" />
                    ) : null}
                    <div className="group relative flex items-start">
                      <span className="flex h-9 items-center">
                        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-600">
                          <XIcon aria-hidden="true" className="h-5 w-5 text-white" />
                        </span>
                      </span>
                      <span className="ml-4 flex min-w-0 flex-col">
                        <span className="text-sm font-medium text-red-600">{step.name}</span>
                        <span className="text-sm text-red-600">{step.description}</span>
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {stepIdx !== steps.length - 1 ? (
                      <div aria-hidden="true" className="absolute top-4 left-4 mt-0.5 -ml-px h-full w-0.5 bg-gray-300" />
                    ) : null}
                    <div className="group relative flex items-start">
                      <span aria-hidden="true" className="flex h-9 items-center">
                        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                          <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                        </span>
                      </span>
                      <span className="ml-4 flex min-w-0 flex-col">
                        <span className="text-sm font-medium text-muted-foreground">{step.name}</span>
                        <span className="text-sm text-muted-foreground">{step.description}</span>
                      </span>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ol>
        </nav>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          {!error && <p>This usually takes 10-15 seconds. Please don't close this page.</p>}
        </div>
        
        {error && onBackToPayment && (
          <div className="mt-8 flex justify-center">
            <Button 
              type="button"
              variant="outline" 
              onClick={onBackToPayment}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Payment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};