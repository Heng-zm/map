
'use client';

import { Settings } from "lucide-react";
import { Button } from "./ui/button";

export function Header() {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-4 rounded-full bg-card/80 backdrop-blur-sm p-2 pl-4 border border-border shadow-lg">
        <h1 className="font-semibold text-card-foreground">Map Explorer</h1>
        <Button variant="ghost" size="icon" className="rounded-full">
            <Settings />
        </Button>
      </div>
    </div>
  );
}
