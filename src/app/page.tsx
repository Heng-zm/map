
'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Globe, ArrowUp, Search, PenTool, Trash2, Combine, Minus, Dot, Route } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


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
  const directions = useRef<MapboxDirections | null>(null);
  const { toast } = useToast();
  const [currentStyle, setCurrentStyle] = useState(mapStyles[0].style);
  const measurementPopup = useRef<mapboxgl.Popup | null>(null);
  const searchMarker = useRef<mapboxgl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const geolocateControl = useRef<mapboxgl.GeolocateControl | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [directionsVisible, setDirectionsVisible] = useState(false);

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
        const popupContent = document.createElement('div');
        popupContent.className = 'bg-card text-card-foreground p-2 rounded text-sm relative shadow-md';
        popupContent.innerHTML = `<span>${measurementText}</span>`;
        
        const closeButton = document.createElement('button');
        closeButton.className = 'absolute top-0 right-0 p-1';
        closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        closeButton.onclick = () => removeMeasurement();
        popupContent.prepend(closeButton);

        measurementPopup.current = new mapboxgl.Popup({ closeOnClick: false, closeButton: false, offset: 10 })
            .setLngLat(center)
            .setDOMContent(popupContent)
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

  const setMapTerrain = useCallback((is3DEnabled: boolean) => {
    if(!map.current) return;

    if (map.current.getSource('mapbox-dem')) {
        map.current.setTerrain(is3DEnabled ? { 'source': 'mapbox-dem', 'exaggeration': 1.5 } : null);
    } else {
        map.current.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
        });
        map.current.setTerrain(is3DEnabled ? { 'source': 'mapbox-dem', 'exaggeration': 1.5 } : null);
    }
    if (is3DEnabled) {
      map.current.setPitch(60);
    } else {
      map.current.setPitch(0);
      const bounds = map.current.getBounds();
      map.current.fitBounds(bounds, { pitch: 0, bearing: 0, duration: 1000});
    }
  }, []);

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
      pitch: is3D ? 60 : 0,
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
        { "id": "gl-draw-polygon-fill-active", "type": "fill", "filter": ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]], "paint": { "fill-color": "hsl(var(--primary))", "fill-opacity": 0.1 } },
        { "id": "gl-draw-polygon-stroke-active", "type": "line", "filter": ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]], "layout": { "line-cap": "round", "line-join": "round" }, "paint": { "line-color": "hsl(var(--primary))", "line-dasharray": [0.2, 2], "line-width": 2 } },
        { "id": "gl-draw-line-active", "type": "line", "filter": ["all", ["==", "$type", "LineString"], ["==", "active", "true"]], "layout": { "line-cap": "round", "line-join": "round" }, "paint": { "line-color": "hsl(var(--primary))", "line-dasharray": [0.2, 2], "line-width": 2 } },
        { "id": "gl-draw-polygon-and-line-vertex-stroke-active", "type": "circle", "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]], "paint": { "circle-radius": 5, "circle-color": "hsl(var(--primary))" } },
        { "id": "gl-draw-polygon-and-line-vertex-active", "type": "circle", "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]], "paint": { "circle-radius": 3, "circle-color": "#FFF" } },
        { "id": "gl-draw-polygon-fill-inactive", "type": "fill", "filter": ["all", ["==", "active", "false"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]], "paint": { "fill-color": "hsl(var(--primary))", "fill-outline-color": "hsl(var(--primary))", "fill-opacity": 0.1 } },
        { "id": "gl-draw-polygon-stroke-inactive", "type": "line", "filter": ["all", ["==", "active", "false"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]], "layout": { "line-cap": "round", "line-join": "round" }, "paint": { "line-color": "hsl(var(--primary))", "line-width": 2 } },
        { "id": "gl-draw-line-inactive", "type": "line", "filter": ["all", ["==", "active", "false"], ["==", "$type", "LineString"], ["!=", "mode", "static"]], "layout": { "line-cap": "round", "line-join": "round" }, "paint": { "line-color": "hsl(var(--primary))", "line-width": 2 } },
      ]
    });
    
    geolocateControl.current = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
    });
    
    directions.current = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        unit: 'metric',
        profile: 'mapbox/driving',
        controls: {
            instructions: true,
            profileSwitcher: true,
        },
    });

    mapInstance.addControl(draw.current);
    mapInstance.addControl(geolocateControl.current, 'top-right');
    mapInstance.addControl(directions.current, 'top-left');

    (directions.current as any).container.style.display = 'none';

    const onStyleLoad = () => {
      setMapTerrain(is3D);
    };
    
    const onLoad = () => {
      if (!mapInstance) return;

      mapInstance.on('draw.create', handleDrawEvents);
      mapInstance.on('draw.update', handleDrawEvents);
      mapInstance.on('draw.selectionchange', handleDrawEvents);
      mapInstance.on('draw.delete', removeMeasurement);
    };

    mapInstance.on('style.load', onStyleLoad);
    mapInstance.on('load', onLoad);

    return () => {
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
  }, []);

  useEffect(() => {
    if (directions.current) {
        (directions.current as any).container.style.display = directionsVisible ? '' : 'none';
    }
  }, [directionsVisible])


  const handleSwitchStyle = useCallback((style: string) => {
    if(!map.current) return;
    setCurrentStyle(style);
    const styleName = mapStyles.find(s => s.style === style)?.name;
    toast({
        title: "Map style changed",
        description: `Switched to ${styleName}`,
    });
  }, [toast]);

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
    
    if (geolocateControl.current) {
      // Check if geolocation is already active to avoid re-triggering issues
      const geolocateButton = mapContainer.current?.querySelector('.mapboxgl-ctrl-geolocate');
      const isGeolocateActive = geolocateButton?.classList.contains('mapboxgl-ctrl-geolocate-active');
      
      if (!isGeolocateActive) {
          geolocateControl.current.trigger();
      } else {
          // If already active, we can just fly to the user's location if we have it.
          // This part requires more complex state management of user's location.
          // For now, triggering should be fine.
          geolocateControl.current.trigger();
      }
    }
  }, [toast]);

  const toggle3D = useCallback(() => {
    setIs3D(prev => {
      const newState = !prev;
      setMapTerrain(newState);
      return newState;
    });
  }, [setMapTerrain]);

  const setDrawMode = useCallback((mode: string) => {
    if (draw.current) {
      draw.current.changeMode(mode);
    }
  }, []);

  const deleteFeatures = useCallback(() => {
    if (draw.current) {
      draw.current.deleteAll();
      removeMeasurement();
    }
  }, [removeMeasurement]);

  const toggleDirections = useCallback(() => {
    setDirectionsVisible(prev => !prev);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background font-body dark">
        <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
        
        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
            <div className="flex flex-col rounded-full shadow-lg bg-background/80 backdrop-blur-sm overflow-hidden border border-border">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-10 h-10 rounded-none text-sm font-semibold"
                    onClick={toggle3D}
                >
                    {is3D ? '3D' : '2D'}
                </Button>
            </div>
            <div className="flex flex-col rounded-full shadow-lg bg-background/80 backdrop-blur-sm overflow-hidden border border-border">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-none">
                            <Globe className="h-5 w-5"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="mr-2">
                        {mapStyles.map((style) => (
                        <DropdownMenuItem key={style.name} onSelect={() => handleSwitchStyle(style.style)}>
                            {style.name}
                        </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="w-full h-[1px] bg-border" />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-10 h-10 rounded-none"
                    onClick={triggerGeolocation}
                >
                    <ArrowUp className="h-5 w-5"/>
                </Button>
                <div className="w-full h-[1px] bg-border" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="w-10 h-10 rounded-none">
                            <PenTool className="h-5 w-5"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="mr-2">
                        <DropdownMenuItem onSelect={() => setDrawMode('draw_point')}>
                            <Dot className="mr-2 h-4 w-4" />
                            <span>Point</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => setDrawMode('draw_line_string')}>
                            <Minus className="mr-2 h-4 w-4" />
                            <span>Line</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setDrawMode('draw_polygon')}>
                            <Combine className="mr-2 h-4 w-4" />
                            <span>Polygon</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={deleteFeatures}>
                            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                            <span className="text-destructive">Delete All</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="w-full h-[1px] bg-border" />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-10 h-10 rounded-none"
                    onClick={toggleDirections}
                    >
                    <Route className="h-5 w-5"/>
                </Button>
            </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-[95%] max-w-md">
            <div className="flex h-14 items-center gap-2 rounded-full bg-background/80 p-2 shadow-lg backdrop-blur-sm border border-border">
                <Search className="ml-3 shrink-0 text-muted-foreground" />
                <Input
                    id="search"
                    placeholder="Search Apple Maps"
                    className="flex-grow bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={handleSearch}>
                    <Search />
                </Button>
                <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
            </div>
        </div>
    </div>
  );
}
