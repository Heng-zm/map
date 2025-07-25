
'use client';
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { TrafficCone } from 'lucide-react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const initialCenter: [number, number] = [104.9282, 11.5564];
const initialZoom = 13;
const initialStyle = 'mapbox://styles/mapbox/standard';

export default function MapExplorerPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();
  const [showTraffic, setShowTraffic] = useState(false);

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
      style: initialStyle,
      center: initialCenter,
      zoom: initialZoom,
      pitch: 45,
    });
    
    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left');
    
    map.current.on('style.load', () => {
      if (map.current?.getSource('mapbox-dem')) {
        map.current?.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
      }
    });

    return () => {
        map.current?.remove();
        map.current = null;
    }
  }, [toast]);

  useEffect(() => {
    if (!map.current) return;
    if (showTraffic) {
      map.current.setConfigProperty('basemap', 'showTraffic', true);
    } else {
      map.current.setConfigProperty('basemap', 'showTraffic', false);
    }
  }, [showTraffic, map]);


  const toggleTraffic = () => {
    setShowTraffic(prev => !prev);
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background font-sans">
      <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
      <div className="absolute top-24 left-2.5 z-10">
        <Button
            size="icon"
            onClick={toggleTraffic}
            variant={showTraffic ? 'secondary': 'outline'}
            className="bg-white/75 text-black backdrop-blur-sm transition-all hover:bg-white"
            aria-label="Toggle traffic"
        >
            <TrafficCone className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
