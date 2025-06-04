'use client';

import { useEffect } from 'react';
import { preloadFeaturedFunctionData } from '@/lib/utils/function-data-preloader';

export function FunctionDataPreloader() {
  useEffect(() => {
    // Preload function data when component mounts
    preloadFeaturedFunctionData();
  }, []);

  // This component doesn't render anything
  return null;
}