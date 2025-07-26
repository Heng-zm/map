
'use client';

import { BarChart, Compass, Folder, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";

interface BottomNavProps {
    onPanelChange: (panel: 'explore' | 'analytics' | 'saved' | 'chat') => void;
    activePanel: string | null;
}

export function BottomNav({ onPanelChange, activePanel }: BottomNavProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-sm p-2 border border-border shadow-lg">
        <Button variant={activePanel === 'explore' ? 'secondary' : 'ghost'} size="icon" className="rounded-full" onClick={() => onPanelChange('explore')}>
            <Compass />
        </Button>
        <Button variant={activePanel === 'analytics' ? 'secondary' : 'ghost'} size="icon" className="rounded-full" onClick={() => onPanelChange('analytics')}>
            <BarChart />
        </Button>
        <Button variant={activePanel === 'saved' ? 'secondary' : 'ghost'} size="icon" className="rounded-full" onClick={() => onPanelChange('saved')}>
            <Folder />
        </Button>
        <Button variant={activePanel === 'chat' ? 'secondary' : 'ghost'} size="icon" className="rounded-full" onClick={() => onPanelChange('chat')}>
            <MessageSquare />
        </Button>
      </div>
    </div>
  );
}
