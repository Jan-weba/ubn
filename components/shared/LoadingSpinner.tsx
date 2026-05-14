// frontend/src/components/shared/LoadingSpinner.tsx

export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex items-center justify-center">
    <div className={`animate-spin rounded-full border-t-2 border-b-2 border-purple-600 ${sizeClasses[size]}`} />
  </div>
);
}
