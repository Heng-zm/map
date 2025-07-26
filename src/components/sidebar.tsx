
'use client';

import { TrafficCone, Ruler, Navigation, Layers } from "lucide-react";
import { Button } from "./ui/button";

interface SidebarProps {
    onToggleTraffic: () => void;
    onToggleMeasurement: () => void;
    onToggleDirections: () => void;
    showTraffic: boolean;
    isMeasuring: boolean;
    showDirections: boolean;
}

export function Sidebar({ 
    onToggleTraffic, 
    onToggleMeasurement, 
    onToggleDirections,
    showTraffic,
    isMeasuring,
    showDirections
}: SidebarProps) {
  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20">
      <div className="flex flex-col items-center gap-2 rounded-full bg-card/80 backdrop-blur-sm p-2 border border-border shadow-lg">
        <Button 
            variant={showTraffic ? 'secondary' : 'ghost'} 
            size="icon" 
            className="rounded-full"
            onClick={onToggleTraffic}
        >
            <TrafficCone />
        </Button>
        <Button 
            variant={isMeasuring ? 'secondary' : 'ghost'} 
            size="icon" 
            className="rounded-full"
            onClick={onToggleMeasurement}
        >
            <Ruler />
        </Button>
        <Button 
            variant={showDirections ? 'secondary' : 'ghost'} 
            size="icon" 
            className="rounded-full"
            onClick={onToggleDirections}
        >
            <Navigation />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
            <Layers />
        </Button>
      </div>
    </div>
  );
}
