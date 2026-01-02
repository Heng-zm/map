
'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Globe, Layers, Star, Navigation, Search, Route } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const initialCenter: [number, number] = [104.9282, 11.5564];
const initialZoom = 13;

const mapStyles = [
  { name: 'Standard', style: 'mapbox://styles/mapbox/standard', icon: <Layers className="h-4 w-4" /> },
  { name: 'Outdoors', style: 'mapbox://styles/mapbox/outdoors-v12', icon: <Globe className="h-4 w-4" /> },
  { name: 'Satellite', style: 'mapbox://styles/mapbox/satellite-streets-v12', icon: <Star className="h-4 w-4" /> },
];

export default function MapExplorerPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const directions = useRef<MapboxDirections | null>(null);
  const { toast } = useToast();
  const [currentStyle, setCurrentStyle] = useState(mapStyles[0].style);
  const searchMarker = useRef<mapboxgl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const geolocateControl = useRef<mapboxgl.GeolocateControl | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [directionsVisible, setDirectionsVisible] = useState(false);
  
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
            profileSwitcher: false,
            inputs: true
        },
    });

    if (directions.current) {
      mapInstance.addControl(directions.current, 'top-left');
    }

    const onStyleLoad = () => {
      setMapTerrain(is3D);
    };

    mapInstance.on('style.load', onStyleLoad);

    return () => {
      mapInstance.off('style.load', onStyleLoad);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    }
  }, [toast, is3D, currentStyle, setMapTerrain]);

  useEffect(() => {
    if (directionsVisible) {
      const script = document.createElement('script');
      script.id = 'mapbox-directions-mover';
      script.innerHTML = `
        const directionsContainer = document.querySelector('#directions-container');
        const mapboxDirectionsEl = document.querySelector('.mapboxgl-ctrl-top-left');
        if (mapboxDirectionsEl && directionsContainer) {
          directionsContainer.appendChild(mapboxDirectionsEl);
        }
      `;
      document.body.appendChild(script);

      return () => {
        const scriptEl = document.getElementById('mapbox-directions-mover');
        if (scriptEl) {
          document.body.removeChild(scriptEl);
        }
        const mapboxDirectionsEl = document.querySelector('.mapboxgl-ctrl-top-left');
        if (mapboxDirectionsEl && mapboxDirectionsEl.parentNode?.id !== 'directions-container') {
            // If it was moved back by mapbox, we don't need to do anything.
        }
      };
    }
  }, [directionsVisible]);

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
        searchMarker.current = new mapboxgl.Marker({element: createCustomMarker()})
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
  
  const createCustomMarker = () => {
    const markerEl = document.createElement('div');
    markerEl.className = 'custom-marker';
    return markerEl;
  }
  
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
    
    if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then(permission => {
            if (permission.state === 'prompt') {
                localStorage.setItem('mapbox_location_permission_requested', 'true');
            }
            if (geolocateControl.current) {
                geolocateControl.current.trigger();
            }
            permission.onchange = () => {
                localStorage.setItem('mapbox_location_permission', permission.state);
                if(permission.state === 'granted' && localStorage.getItem('mapbox_location_permission_requested') === 'true'){
                    if (geolocateControl.current) {
                        geolocateControl.current.trigger();
                    }
                    localStorage.removeItem('mapbox_location_permission_requested');
                }
            };
        });
    } else if (geolocateControl.current) {
        geolocateControl.current.trigger();
    }
  }, [toast]);
  

  const toggle3D = useCallback(() => {
    setIs3D(prev => {
      const newState = !prev;
      setMapTerrain(newState);
      return newState;
    });
  }, [setMapTerrain]);

  const toggleDirections = useCallback(() => {
    setDirectionsVisible(prev => !prev);
  }, []);
  
  const filterButtons = ["Boating", "Fishing", "Walking", "Kayaking"];

  return (
    <div className="h-screen w-screen overflow-hidden bg-background font-body dark">
        <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
        
        <div className="absolute top-4 left-4 right-4 ">
           <div className="bg-card/90 backdrop-blur-sm rounded-xl p-3 flex flex-col md:flex-row items-center gap-2 shadow-lg border border-border">
                <div className="w-full md:w-auto flex items-center gap-2">
                    <Button onClick={toggleDirections} size="icon" variant={directionsVisible ? "default" : "secondary"} className="h-12 w-12 rounded-full flex-shrink-0">
                        <Route className="h-5 w-5" />
                    </Button>
                    <div className="w-full flex-grow">
                        <div id="directions-container" className={directionsVisible ? '' : 'hidden'}></div>
                        {!directionsVisible && (
                             <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search for a place or address" 
                                    className="pl-9 h-12 rounded-full bg-input border-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full md:w-auto flex flex-wrap justify-center gap-2">
                    {filterButtons.map((filter) => (
                        <Button key={filter} variant="secondary" className="flex-1 md:flex-initial rounded-full">{filter}</Button>
                    ))}
                </div>
                
                <div className="flex items-center gap-1 bg-secondary p-1 rounded-full">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-foreground">
                                <Layers />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {mapStyles.map((style) => (
                                <DropdownMenuItem key={style.name} onClick={() => handleSwitchStyle(style.style)}>
                                    {style.icon}
                                    <span>{style.name}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button variant={is3D ? "secondary" : "ghost"} size="icon" className="rounded-full h-10 w-10 text-foreground" onClick={toggle3D}>
                       <div className="w-5 h-5 flex items-center justify-center font-semibold text-sm">3D</div>
                    </Button>

                     <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-foreground" onClick={triggerGeolocation}>
                        <Navigation />
                    </Button>
                </div>
           </div>
        </div>
    </div>
  );
}
