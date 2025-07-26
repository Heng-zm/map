
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

export type MapStyle = 'standard' | 'satellite-streets-v12';

interface MapStyleControlProps {
  currentStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
  className?: string;
}

export function MapStyleControl({ currentStyle, onStyleChange, className }: MapStyleControlProps) {
  return (
    <div className={cn("bg-white/75 backdrop-blur-sm rounded-lg shadow-md p-1 flex flex-col gap-1", className)}>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="icon"
                        variant={currentStyle === 'standard' ? 'secondary' : 'ghost'}
                        onClick={() => onStyleChange('standard')}
                        className="text-black"
                    >
                        <Map className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>Standard</p>
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
                        className="text-black"
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
