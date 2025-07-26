
'use client';
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/hooks/use-toast";
import { analyzeLocation } from '@/ai/flows/location-analysis-flow';
import { LocationAnalysisOutput } from '@/ai/schemas';
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const initialCenter: [number, number] = [104.9282, 11.5564];
const initialZoom = 13;


export default function MapExplorerPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<LocationAnalysisOutput | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);


  const fetchLocationAnalysis = async (lat: number, lng: number) => {
    setLoadingAnalysis(true);
    setIsSheetOpen(true);
    setAnalysis(null);
    
    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#FF0000"/><path d="M12 9.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0" stroke="white" stroke-width="1.5"/></svg>`;
      if (map.current) {
        marker.current = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!);
      }
    }

    try {
      const analysisData = await analyzeLocation({ latitude: lat, longitude: lng });
      setAnalysis(analysisData);
      
    } catch (error) {
      console.error("Failed to fetch location analysis", error);
      toast({
        variant: "destructive",
        title: "Could not analyze location",
        description: "An error occurred while analyzing the location.",
      });
      setIsSheetOpen(false);
    } finally {
      setLoadingAnalysis(false);
    }
  }

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
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: initialCenter,
      zoom: initialZoom,
    });
    
    map.current.on('style.load', () => {
      if(!map.current) return;

      if (!map.current.getSource('mapbox-dem')) {
          map.current.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });
      }
      map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

      // Request user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.current?.setCenter([longitude, latitude]);
            fetchLocationAnalysis(latitude, longitude);
          },
          () => {
            toast({
              title: "Location Access Denied",
              description: "Showing default location. Click on the map to see analysis.",
            });
            fetchLocationAnalysis(initialCenter[1], initialCenter[0]);
          }
        );
      } else {
        fetchLocationAnalysis(initialCenter[1], initialCenter[0]);
      }
    });

    map.current.on('click', async (e) => {
      const { lat, lng } = e.lngLat;
      fetchLocationAnalysis(lat, lng);
    });

    return () => {
        map.current?.remove();
        map.current = null;
    }
  }, [toast]);

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
        setAnalysis(null);
    }
  }
  

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background font-body dark">
      <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="top" className="bg-black/70 text-white backdrop-blur-md border-none" overlayClassName="bg-transparent">
            <h1 className="text-xl font-bold text-center">ការវិភាគទីតាំង</h1>
            {loadingAnalysis && <p className="mt-4 text-center">កំពុងវិភាគទីតាំង...</p>}
            {analysis && (
            <div className="mt-4 flex flex-col items-center text-center">
                <p className="text-lg font-semibold">{analysis.locationName}</p>
                <p className="mt-2 text-sm">{analysis.analysis}</p>
            </div>
            )}
            {!loadingAnalysis && !analysis && (
              <p className="mt-4 text-center">ចុចលើផែនទីដើម្បីវិភាគទីតាំង</p>
            )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
