
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { X, Car, Bike, Walk } from 'lucide-react';
import type { Map, LngLatLike } from 'mapbox-gl';

interface DirectionsPanelProps {
  map: Map | null;
  isOpen: boolean;
  onClose: () => void;
}

type TravelMode = 'driving-traffic' | 'walking' | 'cycling';

const emptyGeoJSON = {
    type: 'FeatureCollection' as const,
    features: []
};

export function DirectionsPanel({ map, isOpen, onClose }: DirectionsPanelProps) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [mode, setMode] = useState<TravelMode>('driving-traffic');
  const [route, setRoute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearDirections = useCallback(() => {
    setRoute(null);
    setStart('');
    setEnd('');
    if (map) {
      const source = map.getSource('directions') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(emptyGeoJSON);
      }
    }
  }, [map]);

  useEffect(() => {
    if (!isOpen) {
      clearDirections();
    }
  }, [isOpen, clearDirections]);

  const getDirections = async () => {
    if (!map || !start || !end) return;

    setIsLoading(true);
    setRoute(null);

    const getCoords = async (query: string): Promise<[number, number] | null> => {
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}`);
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            return data.features[0].center;
        }
        return null;
    }

    const startCoords = await getCoords(start);
    const endCoords = await getCoords(end);

    if (!startCoords || !endCoords) {
        setIsLoading(false);
        // You might want to show a toast message here
        console.error("Could not find coordinates for one or both locations.");
        return;
    }

    const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${startCoords.join(',')};${endCoords.join(',')}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
            const routeData = data.routes[0];
            setRoute(routeData);

            const geojson = {
                type: 'Feature' as const,
                properties: {},
                geometry: routeData.geometry
            };

            const source = map.getSource('directions') as mapboxgl.GeoJSONSource;
            if (source) {
                source.setData(geojson);
            }

            const bounds = routeData.geometry.coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: LngLatLike) => {
                return bounds.extend(coord as LngLatLike);
            }, new mapboxgl.LngLatBounds(startCoords, startCoords));

            map.fitBounds(bounds, {
                padding: 100
            });

        } else {
            console.error("No route found.");
            // Show toast
        }
    } catch(err) {
        console.error("Error fetching directions", err);
        // Show toast
    } finally {
        setIsLoading(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <Card className="absolute top-1/2 -translate-y-1/2 left-2.5 z-20 w-80 bg-white/80 backdrop-blur-sm shadow-lg">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Get Directions</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-2">
          <Input 
            placeholder="Start location"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <Input
            placeholder="End location"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>

        <div className="flex justify-around my-4">
            <Button variant={mode === 'driving-traffic' ? 'secondary' : 'ghost'} size="icon" onClick={() => setMode('driving-traffic')}><Car /></Button>
            <Button variant={mode === 'walking' ? 'secondary' : 'ghost'} size="icon" onClick={() => setMode('walking')}><Walk /></Button>
            <Button variant={mode === 'cycling' ? 'secondary' : 'ghost'} size="icon" onClick={() => setMode('cycling')}><Bike /></Button>
        </div>

        <Button onClick={getDirections} className="w-full" disabled={isLoading}>
            {isLoading ? "Getting Directions..." : "Go"}
        </Button>
        
        {route && (
            <div className="mt-4">
                <div className="font-bold text-md mb-2">
                   {Math.floor(route.duration / 60)} min <span className="font-normal text-sm">({(route.distance / 1000).toFixed(1)} km)</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto text-sm">
                    {route.legs[0].steps.map((step: any, index: number) => (
                        <div key={index} className="border-b pb-1">
                            <p>{step.maneuver.instruction}</p>
                            <p className="text-xs text-gray-600">{(step.distance / 1000).toFixed(2)} km</p>
                        </div>
                    ))}
                </div>
                 <Button onClick={clearDirections} variant="link" className="w-full mt-2">Clear</Button>
            </div>
        )}

      </CardContent>
    </Card>
  );
}

