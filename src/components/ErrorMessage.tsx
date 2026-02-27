import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  title?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, title = 'Unable to load data' }) => (
  <div className="f1-error-state">
    <div className="f1-error-icon">
      <AlertTriangle className="h-6 w-6" />
    </div>
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-f1-text">{title}</h3>
      <p className="text-sm text-f1-muted">{message}</p>
    </div>
  </div>
);

export default ErrorMessage;
