'use client';
import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';


const MAPBOX_TOKEN = 'pk.eyJ1Ijoib3BlbnN0cmVldGNhbSIsImEiOiJja252Ymh4ZnIwNHdkMnd0ZzF5NDVmdnR5In0.dYxz3TzZPTPzd_ibMeGK2g';

declare global {
  interface Window {
    mapboxgl: any;
  }
}

export default function MapExplorerPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<any>(null);
  const [lng, setLng] = useState(-98.5795);
  const [lat, setLat] = useState(39.8283);
  const [zoom, setZoom] = useState(3.5);
  const [markers, setMarkers] = useState<{lng: number, lat: number}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    
    const initializeMap = () => {
        if (typeof window.mapboxgl !== 'undefined') {
            window.mapboxgl.accessToken = MAPBOX_TOKEN;
            map.current = new window.mapboxgl.Map({
              container: mapContainer.current!,
              style: 'mapbox://styles/mapbox/streets-v12',
              center: [lng, lat],
              zoom: zoom,
            });
    
            map.current.on('load', () => {
              setMapLoaded(true);
            });
        
            map.current.on('move', () => {
              setLng(map.current.getCenter().lng.toFixed(4));
              setLat(map.current.getCenter().lat.toFixed(4));
              setZoom(map.current.getZoom().toFixed(2));
            });
    
            map.current.on('click', (e: any) => {
                const { lng, lat } = e.lngLat;
                setMarkers(prevMarkers => [...prevMarkers, { lng, lat }]);
            });
        }
    };

    const script = document.querySelector('script[src="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js"]');
    
    if (script) {
        if (window.mapboxgl) {
            initializeMap();
        } else {
            script.addEventListener('load', initializeMap);
        }
    }


    return () => {
      script?.removeEventListener('load', initializeMap);
      map.current?.remove();
      map.current = null;
    }
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // This is a simple approach to sync markers. For many markers, this could be optimized.
    document.querySelectorAll('.mapboxgl-marker').forEach(marker => marker.remove());

    markers.forEach(marker => {
      const el = document.createElement('div');
      el.className = 'marker';
      
      new window.mapboxgl.Marker({
        color: 'hsl(var(--accent))',
      })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map.current);
    });
  }, [markers, mapLoaded]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}`);
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        map.current.flyTo({
          center: [longitude, latitude],
          zoom: 14,
        });
      } else {
        toast({
            variant: "destructive",
            title: "Location not found",
            description: "Please try a different search query.",
        });
      }
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Search failed",
            description: "Could not connect to the geocoding service.",
        });
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {!mapLoaded && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-8 w-64" />
                <p className="text-muted-foreground">Loading map...</p>
            </div>
        </div>
      )}

      <div className="absolute top-4 left-4 z-10">
        <Card className="w-full max-w-sm shadow-2xl bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Map Explorer</CardTitle>
            <CardDescription>Search for a location or click the map to add a pin.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input 
                placeholder="e.g., 'Eiffel Tower'" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={!mapLoaded}
                aria-label="Location Search"
              />
              <Button type="submit" size="icon" disabled={!mapLoaded} aria-label="Search">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="absolute bottom-4 left-4 z-10 bg-card/90 p-2 rounded-lg shadow-md text-xs text-card-foreground backdrop-blur-sm">
        Longitude: <span className="font-mono">{lng}</span> | Latitude: <span className="font-mono">{lat}</span> | Zoom: <span className="font-mono">{zoom}</span>
      </div>
    </div>
  );
}
