
'use client';
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Download, RotateCw, Layers, PenTool } from 'lucide-react';
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
  const draw = useRef<MapboxDraw | null>(null);
  const { toast } = useToast();
  const [isRotating, setIsRotating] = useState(false);
  const animationFrameId = useRef<number | null>(null);
  const [currentStyleIndex, setCurrentStyleIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const measurementPopup = useRef<mapboxgl.Popup | null>(null);

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

  const removeMeasurement = () => {
    if (measurementPopup.current) {
      measurementPopup.current.remove();
      measurementPopup.current = null;
    }
  };
  
  const calculateAndShowMeasurement = (features: any[]) => {
    removeMeasurement();
    if (features.length === 0 || !map.current) return;
  
    const feature = features[0];
    let measurementText = '';
    let center: [number, number] | undefined;
  
    if (feature.geometry.type === 'Polygon') {
      const area = turf.area(feature);
      measurementText = `Area: ${(area / 1000000).toFixed(2)} km²`;
      const centroid = turf.centroid(feature);
      center = centroid.geometry.coordinates as [number, number];
    } else if (feature.geometry.type === 'LineString') {
      const length = turf.length(feature, { units: 'kilometers' });
      measurementText = `Length: ${length.toFixed(2)} km`;
      const centroid = turf.centroid(feature);
      center = centroid.geometry.coordinates as [number, number];
    }
  
    if (measurementText && center) {
        measurementPopup.current = new mapboxgl.Popup({ closeOnClick: false, closeButton: false })
            .setLngLat(center)
            .setHTML(`<div class="bg-white text-black p-2 rounded">${measurementText}</div>`)
            .addTo(map.current);
    }
  };

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
    
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
        line_string: true,
        point: true,
      },
    });
    map.current.addControl(draw.current, 'top-left');

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
      map.current?.on('draw.create', (e) => calculateAndShowMeasurement(e.features));
      map.current?.on('draw.update', (e) => calculateAndShowMeasurement(e.features));
      map.current?.on('draw.selectionchange', (e) => {
          if (e.features.length > 0) {
              calculateAndShowMeasurement(e.features)
          } else {
              removeMeasurement();
          }
      });
      map.current?.on('draw.delete', removeMeasurement);
    });

    return () => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        removeMeasurement();
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
    stopRotation();
  
    const mapInstance = map.current;
    const container = mapContainer.current;
  
    const originalWidth = container.clientWidth;
    const originalHeight = container.clientHeight;
  
    const targetResolution = 3000;
    
    const scale = originalWidth > originalHeight 
      ? targetResolution / originalWidth
      : targetResolution / originalHeight;
  
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

  const handleToggleDrawing = () => {
    if (!draw.current) return;

    const newIsDrawing = !isDrawing;
    setIsDrawing(newIsDrawing);

    const currentMode = draw.current.getMode();
    
    if (newIsDrawing && currentMode === 'simple_select') {
      draw.current.changeMode('draw_polygon');
    } else if (!newIsDrawing && currentMode !== 'simple_select') {
      draw.current.changeMode('simple_select');
      removeMeasurement();
    }
  };

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
        <Button onClick={handleToggleDrawing} size="icon" variant={isDrawing ? 'secondary' : 'default'}>
          <PenTool />
        </Button>
      </div>
    </div>
  );
}

    