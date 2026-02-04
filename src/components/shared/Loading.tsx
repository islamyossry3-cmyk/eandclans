import { eandColors } from '../../constants/eandColors';

export function Loading({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-12 w-12 border-4',
    lg: 'h-16 w-16 border-4',
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin">
        <div 
          className={`${sizes[size]} rounded-full`}
          style={{
            borderColor: `${eandColors.oceanBlue}30`,
            borderTopColor: eandColors.red,
          }}
        />
      </div>
    </div>
  );
}
