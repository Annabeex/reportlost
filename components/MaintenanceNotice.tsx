'use client';
import { Wrench } from 'lucide-react';

export default function MaintenanceNotice({ message }: { message?: string }) {
  return (
    <div className="mt-12 text-center text-gray-600">
      <div className="flex items-center justify-center mb-3">
        <Wrench className="animate-spin-slow w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm italic">
        {message || 'More information will be available soon. This section is currently being improved.'}
      </p>
    </div>
  );
}
