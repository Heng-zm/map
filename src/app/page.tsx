
'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Download, RotateCw, PenTool, Search, Layers, LocateFixed } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


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
  const [currentStyle, setCurrentStyle] = useState(mapStyles[0].style);
  const [isDrawing, setIsDrawing] = useState(false);
  const measurementPopup = useRef<mapboxgl.Popup | null>(null);
  const searchMarker = useRef<mapboxgl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const geolocateControl = useRef<mapboxgl.GeolocateControl | null>(null);


  const startRotation = () => {
    if (map.current) {
        map.current.easeTo({ bearing: map.current.getBearing() + 180, duration: 2000, easing: (n) => n });
    }
    const rotate = () => {
      if (!map.current) return;
      map.current.rotateTo((map.current.getBearing() + 0.1) % 360, { duration: 0 });
      animationFrameId.current = requestAnimationFrame(rotate);
    };
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    animationFrameId.current = requestAnimationFrame(rotate);
    setIsRotating(true);
  };

  const stopRotation = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    setIsRotating(false);
  };
  
  const setMapTerrain = useCallback(() => {
    if(!map.current) return;

    if (map.current.getSource('mapbox-dem')) {
        map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
        return;
    }

    map.current.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
    });

    map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
  }, []);

  const removeMeasurement = useCallback(() => {
    if (measurementPopup.current) {
      measurementPopup.current.remove();
      measurementPopup.current = null;
    }
  }, []);
  
  const calculateAndShowMeasurement = useCallback((features: any[]) => {
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
  }, [removeMeasurement]);

  const handleDrawEvents = useCallback((e: any) => {
    if (e.features.length > 0) {
      calculateAndShowMeasurement(e.features);
    } else {
      removeMeasurement();
    }
  }, [calculateAndShowMeasurement, removeMeasurement]);


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

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: currentStyle,
      center: initialCenter,
      zoom: initialZoom,
      pitch: 60,
      bearing: 0,
      preserveDrawingBuffer: true,
    });
    map.current = mapInstance;
    
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
        line_string: true,
        point: true,
      },
      styles: [
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
    
    geolocateControl.current = new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true,
        showUserLocation: false, 
    });

    const onStyleLoad = () => {
      setMapTerrain();
    };
    
    const onLoad = () => {
      if (!mapInstance || !geolocateControl.current) return;
      mapInstance.addControl(geolocateControl.current, 'top-right');
      
      const permissionStatus = localStorage.getItem('mapbox_location_permission');

      if (permissionStatus === 'granted') {
        geolocateControl.current.trigger();
      } else if (permissionStatus === null) {
        navigator.geolocation.getCurrentPosition(
            () => { 
                localStorage.setItem('mapbox_location_permission', 'granted');
                geolocateControl.current?.trigger();
            },
            () => { 
                localStorage.setItem('mapbox_location_permission', 'denied');
            },
            { enableHighAccuracy: true }
        );
      }

      mapInstance.on('draw.create', handleDrawEvents);
      mapInstance.on('draw.update', handleDrawEvents);
      mapInstance.on('draw.selectionchange', handleDrawEvents);
      mapInstance.on('draw.delete', removeMeasurement);
    };

    mapInstance.on('style.load', onStyleLoad);
    mapInstance.on('load', onLoad);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      mapInstance.off('style.load', onStyleLoad);
      mapInstance.off('load', onLoad);
      mapInstance.off('draw.create', handleDrawEvents);
      mapInstance.off('draw.update', handleDrawEvents);
      mapInstance.off('draw.selectionchange', handleDrawEvents);
      mapInstance.off('draw.delete', removeMeasurement);
      
      removeMeasurement();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    }
  }, [currentStyle, toast, setMapTerrain, calculateAndShowMeasurement, removeMeasurement, handleDrawEvents]);

  const handleToggleRotation = () => {
    if (isRotating) {
        stopRotation();
    } else {
        startRotation();
    }
  };

  const handleDownloadMap = useCallback(() => {
    if (!map.current) return;
    
    if (isRotating) {
        stopRotation();
    }

    const mapInstance = map.current;

    mapInstance.once('idle', () => {
      const dataURL = mapInstance.getCanvas().toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'map.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Map downloaded",
        description: "The map image has been saved."
      });
    });
  }, [isRotating, toast]);
  
  const handleSwitchStyle = useCallback((style: string) => {
    if(!map.current) return;
    
    setCurrentStyle(style);
    const styleName = mapStyles.find(s => s.style === style)?.name;
    toast({
        title: "Map style changed",
        description: `Switched to ${styleName}`,
    });
  }, [toast]);

  const handleToggleDrawing = useCallback(() => {
    if (!draw.current) return;

    const newIsDrawing = !isDrawing;
    setIsDrawing(newIsDrawing);
    
    if (newIsDrawing) {
      if(map.current && !map.current.hasControl(draw.current)){
        map.current.addControl(draw.current, 'top-left');
      }
      draw.current.changeMode('draw_polygon');
    } else {
        draw.current.deleteAll();
        removeMeasurement();
        if (map.current && map.current.hasControl(draw.current)) {
            map.current.removeControl(draw.current);
        }
    }
  }, [isDrawing, removeMeasurement]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery || !map.current || !mapboxgl.accessToken) return;
    
    const geocodingUrl = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json`);
    geocodingUrl.searchParams.append('access_token', mapboxgl.accessToken);
    geocodingUrl.searchParams.append('language', 'km,en');

    try {
      const response = await fetch(geocodingUrl.toString());
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
      console.error("Geocoding error:", error);
      toast({
        variant: 'destructive',
        title: 'Geocoding error',
        description: 'Could not fetch location data.',
      });
    }
  }, [searchQuery, toast]);
  
  const triggerGeolocation = useCallback(() => {
    const permissionStatus = localStorage.getItem('mapbox_location_permission');
    if (permissionStatus === 'denied') {
        toast({
            variant: "destructive",
            title: "Location Access Denied",
            description: "Please enable location services in your browser settings to use this feature.",
        });
        return;
    }
    geolocateControl.current?.trigger();
  }, [toast]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background font-body dark">
        <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
        <Button 
            variant="outline" 
            size="icon" 
            className="absolute top-4 right-4 z-10 rounded-full shadow-lg"
            onClick={triggerGeolocation}
         >
            <LocateFixed />
        </Button>
        <Drawer>
            <DrawerContent>
                <ScrollArea className="h-full">
                    <div className="mx-auto w-full max-w-md">
                        <DrawerHeader>
                            <DrawerTitle>Map Explorer</DrawerTitle>
                            <DrawerDescription>Explore, draw, and measure on the map.</DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4 pb-0 space-y-4">
                            <div className="flex items-center gap-2">
                                <Input
                                    id="search"
                                    placeholder="Find a location..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <Button onClick={handleSearch} size="icon" variant="outline" className="shrink-0">
                                    <Search />
                                </Button>
                            </div>
                            <Separator />
                             <div className="grid grid-cols-2 gap-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                        <span>{mapStyles.find(s => s.style === currentStyle)?.name}</span>
                                        <Layers className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
                                        {mapStyles.map((style) => (
                                        <DropdownMenuItem key={style.name} onSelect={() => handleSwitchStyle(style.style)}>
                                            {style.name}
                                        </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant={isDrawing ? "default" : "outline"} onClick={handleToggleDrawing}>
                                    <PenTool />
                                    <span>{isDrawing ? 'Exit Drawing' : 'Draw on Map'}</span>
                                </Button>
                                <Button variant={isRotating ? "default" : "outline"} onClick={handleToggleRotation}>
                                    <RotateCw className={isRotating ? 'animate-spin' : ''}/>
                                    <span>{isRotating ? 'Stop Rotation' : 'Rotate Camera'}</span>
                                </Button>
                             </div>
                        </div>
                        <DrawerFooter>
                            <Button onClick={handleDownloadMap}>
                                <Download />
                                Download Map
                            </Button>
                        </DrawerFooter>
                    </div>
                </ScrollArea>
            </DrawerContent>
        </Drawer>
    </div>
  );
}
