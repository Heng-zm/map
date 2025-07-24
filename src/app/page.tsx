'use client';
import React, { useRef, useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Map, Send, SlidersHorizontal, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Image from 'next/image';
import { trails, Trail } from './data';
import { useToast } from "@/hooks/use-toast";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const initialCenter: [number, number] = [-118.7323, 36.5683]; // Centered on Sequoia National Park

export default function MapExplorerPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [center] = useState(initialCenter);
  const [zoom] = useState(12);
  const [searchQuery, setSearchQuery] = useState('Hikes in Sequoia');
  const { toast } = useToast();

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    if (!mapboxgl.accessToken) {
        toast({
            variant: "destructive",
            title: "Mapbox token not set",
            description: "Please provide a Mapbox access token in your environment variables.",
        });
        return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12', // Outdoors style for hiking
      center: center,
      zoom: zoom,
    });
    
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    return () => {
        map.current?.remove();
    }
  }, [center, zoom, toast]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background font-sans">
      <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
      
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="bg-white rounded-lg shadow-md">
            <Button variant="ghost" size="icon" className="p-2 rounded-t-lg rounded-b-none border-b border-gray-200 w-10 h-10">
                <Map className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="p-2 rounded-b-lg rounded-t-none w-10 h-10">
                <Send className="h-5 w-5" />
            </Button>
        </div>
      </div>

      <Sheet defaultOpen={true}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[85vh] flex flex-col" overlayClassName="bg-transparent">
          <SheetHeader className="p-4 pb-2">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mb-2" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Hikes in Sequoia" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-base"
                aria-label="Search Hikes"
              />
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setSearchQuery('')}>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
              </Button>
            </div>
          </SheetHeader>
          <div className="px-4 pb-2">
            <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-1 rounded-full bg-gray-100 border-gray-300">
                    <SlidersHorizontal className="h-4 w-4"/>
                </Button>
                <Button variant="outline" className="flex items-center gap-1 rounded-full bg-gray-100 border-gray-300">
                    <span>All Lengths</span>
                    <ChevronDown className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="flex items-center gap-1 rounded-full bg-gray-100 border-gray-300">
                    <span>All Route Types</span>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </div>
          </div>
          <div className="overflow-y-auto pb-4">
              <ul className="divide-y divide-gray-200">
                {trails.map((trail) => (
                    <li key={trail.id} className="p-4 flex items-center gap-4">
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg">{trail.name}</h3>
                            <p className="text-muted-foreground">{trail.type} &middot; {trail.county}</p>
                            <div className="flex items-center gap-4 text-muted-foreground text-sm mt-1">
                                <div className="flex items-center gap-1">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                    <span>{trail.distance} mi</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <ArrowUp className="h-4 w-4" />
                                    <span>{trail.elevationGain} ft</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <ArrowDown className="h-4 w-4" />
                                    <span>{trail.elevationLoss} ft</span>
                                </div>
                            </div>
                        </div>
                        <Image
                            src={trail.imageUrl}
                            alt={`Map of ${trail.name}`}
                            width={80}
                            height={80}
                            className="rounded-lg"
                            data-ai-hint="trail map"
                         />
                    </li>
                ))}
              </ul>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
