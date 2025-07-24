'use client';
import React, { useRef, useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Mic, Layers, Send, Compass, Loader } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from "@/hooks/use-toast";
import { search } from '@/ai/flows/search-flow';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const initialCenter: [number, number] = [-118.7323, 36.5683];

export default function MapExplorerPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [center] = useState(initialCenter);
  const [zoom] = useState(2); // Start more zoomed out for a globe view
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const searchMarker = useRef<mapboxgl.Marker | null>(null);

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
      style: 'mapbox://styles/mapbox/standard', // Using a style that supports 3D
      center: center,
      zoom: zoom,
      pitch: 45, // Initial pitch for a 3D perspective
    });

    map.current.on('style.load', () => {
      map.current?.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
      });
      map.current?.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
    });
    
    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left');

    return () => {
        map.current?.remove();
    }
  }, [center, zoom, toast]);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query || !map.current) return;
    setLoading(true);

    try {
      const result = await search({ query });

      if (searchMarker.current) {
        searchMarker.current.remove();
      }

      map.current.flyTo({
        center: [result.long, result.lat],
        zoom: result.zoom,
        pitch: 45,
        essential: true,
      });

      searchMarker.current = new mapboxgl.Marker()
        .setLngLat([result.long, result.lat])
        .addTo(map.current);

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: "Could not find the requested location. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background font-sans">
      <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
      
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md flex flex-col">
            <Button variant="ghost" size="icon" className="p-2 w-10 h-10">
                <Layers className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="p-2 w-10 h-10">
                <Send className="h-5 w-5" />
            </Button>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md mt-2">
           <Button variant="ghost" size="icon" className="p-2 w-10 h-10">
              <Compass className="h-6 w-6" />
           </Button>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-lg">
        <form onSubmit={handleSearch} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-2 flex items-center gap-2">
          {loading ? (
            <Loader className="h-5 w-5 text-muted-foreground ml-2 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground ml-2" />
          )}
          <Input 
            placeholder="Search Maps" 
            className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            aria-label="Search Maps"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <Mic className="h-5 w-5" />
          </Button>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="user avatar" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </form>
      </div>
    </div>
  );
}
