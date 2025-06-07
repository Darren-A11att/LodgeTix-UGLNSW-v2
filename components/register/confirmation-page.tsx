import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfirmationPageProps {
  confirmationNumber: string;
}

export function ConfirmationPage({ confirmationNumber }: ConfirmationPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">
              Thank You!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg text-gray-700">
              Your registration confirmation number is:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-2xl font-mono font-bold text-gray-900">
                {confirmationNumber}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              You will receive a confirmation email within 24 hours.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}