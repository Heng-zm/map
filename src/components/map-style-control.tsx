
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Satellite, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type MapStyle = 'standard' | 'satellite-streets-v12' | 'streets-v12' | 'dark-v11' | 'light-v11';

interface MapStyleControlProps {
  currentStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
  className?: string;
}

export function MapStyleControl({ currentStyle, onStyleChange, className }: MapStyleControlProps) {
  return (
    <div className={cn("bg-card/80 backdrop-blur-sm rounded-lg shadow-md p-1 flex flex-col gap-1", className)}>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="icon"
                        variant={currentStyle === 'dark-v11' ? 'secondary' : 'ghost'}
                        onClick={() => onStyleChange('dark-v11')}
                        className="text-card-foreground"
                    >
                        <Map className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>Dark</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="icon"
                        variant={currentStyle === 'satellite-streets-v12' ? 'secondary' : 'ghost'}
                        onClick={() => onStyleChange('satellite-streets-v12')}
                        className="text-card-foreground"
                    >
                        <Satellite className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>Satellite</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    </div>
  );
}
