
'use client';

import { TrafficCone, Ruler, Navigation, Layers, ShieldAlert, Cloudy, Sun } from "lucide-react";
import { Button } from "./ui/button";

interface SidebarProps {
    onToggleTraffic: () => void;
    onToggleMeasurement: () => void;
    onToggleDirections: () => void;
    onToggleLayers: () => void;
    onToggleMarkWarZone: () => void;
    onToggleWeather: () => void;
    onToggle3D: () => void;
    showTraffic: boolean;
    isMeasuring: boolean;
    isMarkingWarZone: boolean;
    showDirections: boolean;
    showLayers: boolean;
    showWeather: boolean;
    show3D: boolean;
}

export function Sidebar({ 
    onToggleTraffic, 
    onToggleMeasurement, 
    onToggleDirections,
    onToggleLayers,
    onToggleMarkWarZone,
    onToggleWeather,
    onToggle3D,
    showTraffic,
    isMeasuring,
    isMarkingWarZone,
    showDirections,
    showLayers,
    showWeather,
    show3D
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
        <Button 
            variant={showLayers ? 'secondary' : 'ghost'}
            size="icon" 
            className="rounded-full"
            onClick={onToggleLayers}
        >
            <Layers />
        </Button>
        <Button 
            variant={isMarkingWarZone ? 'secondary' : 'ghost'}
            size="icon" 
            className="rounded-full"
            onClick={onToggleMarkWarZone}
        >
            <ShieldAlert />
        </Button>
        <Button 
            variant={showWeather ? 'secondary' : 'ghost'}
            size="icon" 
            className="rounded-full"
            onClick={onToggleWeather}
        >
            <Cloudy />
        </Button>
        <Button 
            variant={show3D ? 'secondary' : 'ghost'}
            size="icon" 
            className="rounded-full"
            onClick={onToggle3D}
        >
            <Sun />
        </Button>
      </div>
    </div>
  );
}
