import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ label = 'Syncing race telemetry...' }) => (
  <div className="f1-loading-state">
    <div className="f1-loading-ring">
      <Loader2 className="h-8 w-8 animate-spin text-f1-red" />
    </div>
    <p className="f1-loading-label">{label}</p>
  </div>
);

export default LoadingSpinner;
