
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Satellite, Map, Mountain } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type MapStyle = 'standard' | 'satellite-streets-v12' | 'streets-v12' | 'dark-v11' | 'light-v11' | 'outdoors-v12';

const styles: { name: MapStyle, label: string, icon: React.ElementType }[] = [
    { name: 'dark-v11', label: 'Dark', icon: Map },
    { name: 'light-v11', label: 'Light', icon: Map },
    { name: 'streets-v12', label: 'Streets', icon: Map },
    { name: 'satellite-streets-v12', label: 'Satellite', icon: Satellite },
    { name: 'outdoors-v12', label: 'Terrain', icon: Mountain },
];


interface MapStyleControlProps {
  currentStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
  className?: string;
}

export function MapStyleControl({ currentStyle, onStyleChange, className }: MapStyleControlProps) {
  return (
    <div className={cn("bg-card/80 backdrop-blur-sm rounded-lg shadow-md p-1 flex flex-col gap-1", className)}>
        <TooltipProvider>
            {styles.map(style => (
                 <Tooltip key={style.name}>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            variant={currentStyle === style.name ? 'secondary' : 'ghost'}
                            onClick={() => onStyleChange(style.name)}
                            className="text-card-foreground"
                        >
                            <style.icon className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        <p>{style.label}</p>
                    </TooltipContent>
                </Tooltip>
            ))}
        </TooltipProvider>
    </div>
  );
}
