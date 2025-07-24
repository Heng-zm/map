'use client';
import React, { useRef, useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const initialCenter: [number, number] = [-98.5795, 39.8283];

export default function MapExplorerPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [center] = useState(initialCenter);
  const [zoom] = useState(3.5);
  const [searchQuery, setSearchQuery] = useState('');
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
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom,
    });

    map.current.on('click', (e) => {
        new mapboxgl.Marker().setLngLat(e.lngLat).addTo(map.current!);
    });

    return () => {
        map.current?.remove();
    }
  }, [center, zoom, toast]);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || !map.current) return;

    try {
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxgl.accessToken}`);
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            const coordinates = data.features[0].center;
            map.current.flyTo({
                center: coordinates,
                zoom: 14
            });
        } else {
            toast({
                variant: "destructive",
                title: "Location not found",
                description: "Please try a different search query.",
            });
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Geocoding error",
            description: "Could not fetch location data.",
        });
    }
  };


  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
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
                aria-label="Location Search"
              />
              <Button type="submit" size="icon" aria-label="Search">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
