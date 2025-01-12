import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div className="flex items-center justify-center w-full h-64">
    <div className="flex items-center space-x-2 text-red-600">
      <AlertTriangle className="w-6 h-6" />
      <span>{message}</span>
    </div>
  </div>
);

export default ErrorMessage;