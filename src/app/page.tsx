
'use client';
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Download, RotateCw, Layers } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const initialCenter: [number, number] = [104.9282, 11.5564];
const initialZoom = 13;

const mapStyles = [
  { name: 'Standard', style: 'mapbox://styles/mapbox/standard' },
  { name: 'Outdoors', style: 'mapbox://styles/mapbox/outdoors-v12' },
  { name: 'Satellite', style: 'mapbox://styles/mapbox/satellite-streets-v12' },
];

export default function MapExplorerPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();
  const [isRotating, setIsRotating] = useState(false);
  const animationFrameId = useRef<number | null>(null);
  const [currentStyleIndex, setCurrentStyleIndex] = useState(0);

  const startRotation = () => {
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
    }
    const rotate = (timestamp: number) => {
        if (!map.current) return;
        map.current.rotateTo((timestamp / 100) % 360, { duration: 0 });
        animationFrameId.current = requestAnimationFrame(rotate);
    }
    animationFrameId.current = requestAnimationFrame(rotate);
    setIsRotating(true);
  }

  const stopRotation = () => {
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
    }
    setIsRotating(false);
  }
  
  const setMapTerrain = () => {
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
  }

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    if (!mapboxgl.accessToken) {
        toast({
            variant: "destructive",
            title: "Mapbox token not set",
            description: "Please provide your Mapbox token in your environment variables.",
        });
        return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyles[currentStyleIndex].style,
      center: initialCenter,
      zoom: initialZoom,
      pitch: 60,
      bearing: 0,
      preserveDrawingBuffer: true,
    });
    
    map.current.on('style.load', () => {
      setMapTerrain();
    });

    map.current.on('load', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.current?.setCenter([longitude, latitude]);
          },
          () => {
            toast({
              title: "Location access denied",
              description: "Showing default location.",
            });
          }
        );
      }
    })

    return () => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        map.current?.remove();
        map.current = null;
    }
  }, [toast, currentStyleIndex]);

  const handleToggleRotation = () => {
    if (isRotating) {
        stopRotation();
    } else {
        startRotation();
    }
  };

  const handleDownloadMap = () => {
    if (!map.current || !mapContainer.current) return;

    const mapInstance = map.current;
    const container = mapContainer.current;

    const originalWidth = container.clientWidth;
    const originalHeight = container.clientHeight;
    
    const targetResolution = 3000;
    const scale = targetResolution / Math.max(originalWidth, originalHeight);
    
    const newWidth = originalWidth * scale;
    const newHeight = originalHeight * scale;

    container.style.width = `${newWidth}px`;
    container.style.height = `${newHeight}px`;
    mapInstance.resize();

    mapInstance.once('idle', () => {
      const dataURL = mapInstance.getCanvas().toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'map-high-quality.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      container.style.width = `${originalWidth}px`;
      container.style.height = `${originalHeight}px`;
      mapInstance.resize();
    });
  };
  
  const handleSwitchStyle = (index: number) => {
    if(!map.current) return;
    setCurrentStyleIndex(index);
    map.current.setStyle(mapStyles[index].style);
    toast({
        title: "Map style changed",
        description: `Switched to ${mapStyles[index].name}`,
    });
  }


  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background font-body dark">
      <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
      <div className="absolute top-4 right-4 flex gap-2">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="icon">
                    <Layers />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {mapStyles.map((style, index) => (
                    <DropdownMenuItem key={style.name} onClick={() => handleSwitchStyle(index)}>
                        {style.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={handleToggleRotation} size="icon" variant={isRotating ? "secondary" : "default"}>
          <RotateCw className={isRotating ? 'animate-spin' : ''}/>
        </Button>
        <Button onClick={handleDownloadMap} size="icon">
          <Download />
        </Button>
      </div>
    </div>
  );
}
