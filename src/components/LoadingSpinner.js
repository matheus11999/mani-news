import React from 'react';

function LoadingSpinner({ size = 'default', className = '' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${sizeClasses[size]} ${className}`} />
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="h-48 bg-gray-200 loading-skeleton" />
      <div className="p-4">
        <div className="h-4 bg-gray-200 loading-skeleton mb-2" />
        <div className="h-4 bg-gray-200 loading-skeleton w-3/4 mb-3" />
        <div className="h-3 bg-gray-200 loading-skeleton w-1/2" />
      </div>
    </div>
  );
}

export function FeaturedCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="h-64 sm:h-80 bg-gray-200 loading-skeleton" />
    </div>
  );
}

export default LoadingSpinner;