
'use client';

import { BarChart, Compass, Folder, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";

export function BottomNav() {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-sm p-2 border border-border shadow-lg">
        <Button variant="ghost" size="icon" className="rounded-full">
            <Compass />
        </Button>
        <Button variant="secondary" size="icon" className="rounded-full bg-primary text-primary-foreground">
            <BarChart />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
            <Folder />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
            <MessageSquare />
        </Button>
      </div>
    </div>
  );
}
