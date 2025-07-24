'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const initialCenter = {
  lat: 39.8283,
  lng: -98.5795
};

const libraries: ('places' | 'drawing' | 'geometry' | 'visualization')[] = ['places'];

export default function MapExplorerPage() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(initialCenter);
  const [zoom, setZoom] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const [markers, setMarkers] = useState<{lat: number, lng: number}[]>([]);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (isLoaded) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, [isLoaded]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newMarker = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setMarkers(prev => [...prev, newMarker]);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || !geocoderRef.current) return;

    geocoderRef.current.geocode({ address: searchQuery }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        map?.panTo(location);
        map?.setZoom(14);
        setCenter({ lat: location.lat(), lng: location.lng() });
      } else {
        toast({
            variant: "destructive",
            title: "Location not found",
            description: "Please try a different search query.",
        });
      }
    });
  };

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);
  
  if (loadError) {
    return <div className="flex h-screen w-screen items-center justify-center">Error loading maps. Check the API key.</div>
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {!isLoaded ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-8 w-64" />
                <p className="text-muted-foreground">Loading map...</p>
            </div>
        </div>
      ) : (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          onLoad={onMapLoad}
          onUnmount={onUnmount}
          onClick={onMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {markers.map((marker, index) => (
            <Marker key={index} position={marker} />
          ))}
        </GoogleMap>
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
                disabled={!isLoaded}
                aria-label="Location Search"
              />
              <Button type="submit" size="icon" disabled={!isLoaded} aria-label="Search">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
