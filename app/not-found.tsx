import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-md rounded-lg max-w-lg w-full p-8 text-center">
        <h1 className="text-4xl font-bold text-masonic-navy mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-masonic-navy mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/" 
          className="inline-block bg-masonic-navy text-white px-6 py-2 rounded-md hover:bg-masonic-navy/90 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}