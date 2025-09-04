import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveRouteButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  hasRoute: boolean;
  className?: string;
}

export function SaveRouteButton({
  onClick,
  disabled = false,
  loading = false,
  hasRoute,
  className
}: SaveRouteButtonProps) {
  if (!hasRoute) return null;

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "bg-military-green hover:bg-military-green/90 text-white",
        "shadow-lg border border-camo-brown/20",
        "transition-all duration-200 transform hover:scale-105",
        "font-medium px-4 py-2 min-w-[120px]",
        className
      )}
      size="default"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="w-4 h-4 mr-2" />
          Save Route
        </>
      )}
    </Button>
  );
}