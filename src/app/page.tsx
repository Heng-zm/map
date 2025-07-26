
'use client';
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Download, RotateCw, Layers, PenTool, Search, Compass } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100%'
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
  const searchMarker = useRef<mapboxgl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
            .setHTML(`<div class="bg-card text-card-foreground p-2 rounded">${measurementText}</div>`)
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
      styles: [
        // default styles provided by mapbox-gl-draw
        // ACTIVE (being drawn)
        {
          "id": "gl-draw-polygon-fill-active",
          "type": "fill",
          "filter": ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
          "paint": {
            "fill-color": "hsl(var(--primary))",
            "fill-opacity": 0.1
          }
        },
        {
          "id": "gl-draw-polygon-stroke-active",
          "type": "line",
          "filter": ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
          "layout": {
            "line-cap": "round",
            "line-join": "round"
          },
          "paint": {
            "line-color": "hsl(var(--primary))",
            "line-dasharray": [0.2, 2],
            "line-width": 2
          }
        },
        {
          "id": "gl-draw-line-active",
          "type": "line",
          "filter": ["all", ["==", "$type", "LineString"], ["==", "active", "true"]],
          "layout": {
            "line-cap": "round",
            "line-join": "round"
          },
          "paint": {
            "line-color": "hsl(var(--primary))",
            "line-dasharray": [0.2, 2],
            "line-width": 2
          }
        },
        {
          "id": "gl-draw-polygon-and-line-vertex-stroke-active",
          "type": "circle",
          "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
          "paint": {
            "circle-radius": 5,
            "circle-color": "hsl(var(--primary))"
          }
        },
        {
          "id": "gl-draw-polygon-and-line-vertex-active",
          "type": "circle",
          "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
          "paint": {
            "circle-radius": 3,
            "circle-color": "#FFF"
          }
        },

        // INACTIVE (already drawn)
        {
            "id": "gl-draw-polygon-fill-inactive",
            "type": "fill",
            "filter": ["all", ["==", "active", "false"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            "paint": {
                "fill-color": "hsl(var(--primary))",
                "fill-outline-color": "hsl(var(--primary))",
                "fill-opacity": 0.1
            }
        },
        {
            "id": "gl-draw-polygon-stroke-inactive",
            "type": "line",
            "filter": ["all", ["==", "active", "false"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-color": "hsl(var(--primary))",
                "line-width": 2
            }
        },
        {
            "id": "gl-draw-line-inactive",
            "type": "line",
            "filter": ["all", ["==", "active", "false"], ["==", "$type", "LineString"], ["!=", "mode", "static"]],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-color": "hsl(var(--primary))",
                "line-width": 2
            }
        },
      ]
    });
    
    // We don't add the control to the map directly. We'll manage its UI through our sidebar.
    // map.current.addControl(draw.current, 'top-left');

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
  
    // Wait for map to be idle before resizing to ensure all tiles are loaded at current resolution
    mapInstance.once('idle', () => {
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
  
      // Wait for map to be idle again after resizing to ensure high-res tiles are loaded
      mapInstance.once('idle', () => {
        const dataURL = mapInstance.getCanvas().toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'map-high-quality.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
  
        // Restore original size
        container.style.width = `${originalWidth}px`;
        container.style.height = `${originalHeight}px`;
        mapInstance.resize();
      });
    });
  };
  
  const handleSwitchStyle = (style: string) => {
    if(!map.current) return;
    const styleIndex = mapStyles.findIndex(s => s.style === style);
    if(styleIndex === -1) return;
    
    setCurrentStyleIndex(styleIndex);
    map.current.setStyle(mapStyles[styleIndex].style);
    toast({
        title: "Map style changed",
        description: `Switched to ${mapStyles[styleIndex].name}`,
    });
  }

  const handleToggleDrawing = () => {
    if (!draw.current) return;

    const newIsDrawing = !isDrawing;
    setIsDrawing(newIsDrawing);

    const currentMode = draw.current.getMode();
    
    if (newIsDrawing) {
      if(map.current && !map.current.hasControl(draw.current)){
        map.current.addControl(draw.current);
      }
      draw.current.changeMode('draw_polygon');
    } else {
      draw.current.changeMode('simple_select');
      if(map.current && map.current.hasControl(draw.current)){
         const drawnFeatures = draw.current.getAll();
         if (drawnFeatures.features.length === 0) {
            map.current.removeControl(draw.current);
         }
      }
      removeMeasurement();
    }
  };

  const handleSearch = async () => {
    if (!searchQuery || !map.current) return;
    const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      searchQuery
    )}.json?access_token=${mapboxgl.accessToken}`;

    try {
      const response = await fetch(geocodingUrl);
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        map.current.flyTo({ center: [longitude, latitude], zoom: 14 });

        if (searchMarker.current) {
          searchMarker.current.remove();
        }
        searchMarker.current = new mapboxgl.Marker()
          .setLngLat([longitude, latitude])
          .addTo(map.current);
      } else {
        toast({
          variant: 'destructive',
          title: 'Location not found',
          description: 'Please try a different search term.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Geocoding error',
        description: 'Could not fetch location data.',
      });
    }
  };
  
  return (
    <div className="h-screen w-screen overflow-hidden bg-background font-body dark">
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-3 p-2">
              <Compass size={20} />
              <h1 className="text-lg font-semibold">Map Explorer</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="font-semibold">Search</SidebarGroupLabel>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Find a location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="icon" variant="outline">
                  <Search />
                </Button>
              </div>
            </SidebarGroup>
            
            <SidebarGroup>
              <SidebarGroupLabel className="font-semibold">Map Styles</SidebarGroupLabel>
              <Select onValueChange={handleSwitchStyle} defaultValue={mapStyles[currentStyleIndex].style}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a map style" />
                </SelectTrigger>
                <SelectContent>
                  {mapStyles.map((style) => (
                    <SelectItem key={style.name} value={style.style}>
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="font-semibold">Tools</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton 
                            onClick={handleToggleRotation} 
                            isActive={isRotating}
                            tooltip="Rotate Camera"
                        >
                            <RotateCw className={isRotating ? 'animate-spin' : ''}/>
                            <span>{isRotating ? 'Stop Rotation' : 'Rotate Camera'}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton 
                            onClick={handleToggleDrawing} 
                            isActive={isDrawing}
                            tooltip="Draw on Map"
                        >
                            <PenTool />
                            <span>{isDrawing ? 'Exit Drawing' : 'Draw on Map'}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <Button onClick={handleDownloadMap} className="w-full">
              <Download />
              Download Map
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="absolute top-2 left-2 z-10">
             <SidebarTrigger />
          </div>
          <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
