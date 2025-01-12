import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center w-full h-64">
    <Loader2 className="w-12 h-12 animate-spin text-red-600" />
  </div>
);

export default LoadingSpinner;