'use client';

import React, { useRef, useEffect, useState } from 'react';
import mapboxgl, { GeolocateControl, Marker } from 'mapbox-gl';
// @ts-ignore
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';

import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';

import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Navigation2, X, MapPin, Navigation, LocateFixed } from 'lucide-react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const initialCenter: [number, number] = [104.9282, 11.5564];
const initialZoom = 13;
const mapStyle = 'mapbox://styles/mapbox/streets-v12'; 

export default function MapExplorerPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const directionsControl = useRef<any | null>(null);
  const geolocateControl = useRef<GeolocateControl | null>(null);
  const destinationMarker = useRef<Marker | null>(null);
  
  const userLocation = useRef<[number, number] | null>(null);
  const isNavigating = useRef<boolean>(false);
  const observer = useRef<MutationObserver | null>(null);

  const { toast } = useToast();
  const [locationDetails, setLocationDetails] = useState<{lng: number, lat: number} | null>(null);
  const [addressDetails, setAddressDetails] = useState<any>(null);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [routeDetails, setRouteDetails] = useState<{distance: number, duration: number} | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    
    if (!mapboxgl.accessToken) {
        toast({ variant: "destructive", title: "Mapbox token missing" });
        return;
    }

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: initialCenter,
      zoom: initialZoom,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    map.current = mapInstance;
    mapInstance.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    const geolocate = new GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserLocation: true,
      showAccuracyCircle: true
    });
    geolocateControl.current = geolocate;
    mapInstance.addControl(geolocate, 'top-right');

    const directions = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        unit: 'metric',
        profile: 'mapbox/driving',
        interactive: false,
        controls: { inputs: false, instructions: false, profileSwitcher: false },
    });
    mapInstance.addControl(directions, 'top-left');
    directionsControl.current = directions;

    // --- MUTATION OBSERVER (The "Fix-All") ---
    // This watches the DOM. If the plugin adds the "A" or "B" markers, we hide them instantly.
    if (mapContainer.current) {
        observer.current = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement) {
                        // Check if the added node matches the unwanted markers
                        if (
                            node.className.includes('mapbox-directions-origin') || 
                            node.className.includes('mapbox-directions-destination') ||
                            node.className.includes('mapbox-directions-step')
                        ) {
                            node.style.display = 'none';
                        }
                        
                        // Sometimes they are nested deeper
                        const unwanted = node.querySelectorAll('.mapbox-directions-origin, .mapbox-directions-destination, .mapbox-directions-step');
                        unwanted.forEach((el) => {
                           (el as HTMLElement).style.display = 'none';
                        });
                    }
                });
            });
        });

        observer.current.observe(mapContainer.current, { 
            childList: true, 
            subtree: true 
        });
    }

    // --- EVENTS ---

    geolocate.on('geolocate', (e: any) => {
      const pos = e.coords;
      const newUserLocation: [number, number] = [pos.longitude, pos.latitude];
      userLocation.current = newUserLocation;
      if (isNavigating.current && directionsControl.current) {
         directionsControl.current.setOrigin(newUserLocation);
      }
    });

    directions.on('route', (e: any) => {
        if (e.route && e.route.length > 0) {
          const route = e.route[0];
          setRouteDetails({
            distance: route.distance,
            duration: route.duration,
          });
          
          // Double check: Force search and destroy on route update
          const markers = document.querySelectorAll('.mapbox-directions-origin, .mapbox-directions-destination');
          markers.forEach((el: any) => el.style.display = 'none');
        }
    });

    mapInstance.on('load', () => {
      geolocate.trigger();
    });
    
    const onMapClick = (e: mapboxgl.MapMouseEvent) => {
      isNavigating.current = false;
      setRouteDetails(null);
      if (directionsControl.current) directionsControl.current.removeRoutes();
      if (destinationMarker.current) destinationMarker.current.remove();
      
      const newMarker = new Marker({ color: '#ef4444' })
        .setLngLat(e.lngLat)
        .addTo(mapInstance);
      destinationMarker.current = newMarker;

      setLocationDetails(e.lngLat);
      setIsDrawerOpen(true);

      mapInstance.flyTo({
        center: e.lngLat,
        zoom: 15,
        offset: [0, 100],
        essential: true
      });
    };

    mapInstance.on('click', onMapClick);

    return () => {
      mapInstance.off('click', onMapClick);
      if (observer.current) observer.current.disconnect();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    }
  }, [toast]);
  
  useEffect(() => {
    if (locationDetails) {
      const fetchAddress = async () => {
        setIsFetchingAddress(true);
        const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
        if (!apiKey) {
           setAddressDetails({ formatted: "Unknown Location" });
           setIsFetchingAddress(false);
           return;
        }
        try {
          const response = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${locationDetails.lat}&lon=${locationDetails.lng}&apiKey=${apiKey}`);
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            setAddressDetails(data.features[0].properties);
          } else {
            setAddressDetails({ formatted: "Unknown Location" });
          }
        } catch (error) {
          setAddressDetails({ formatted: "Address unavailable" });
        } finally {
          setIsFetchingAddress(false);
        }
      };
      fetchAddress();
    }
  }, [locationDetails]);

  const handleStartNavigation = () => {
    if (!userLocation.current) {
      toast({ title: "Locating...", description: "Waiting for GPS. Please grant location permissions." });
      geolocateControl.current?.trigger();
      return;
    }
    if (!locationDetails) return;
    isNavigating.current = true;
    if (directionsControl.current) {
      directionsControl.current.setOrigin(userLocation.current);
      directionsControl.current.setDestination([locationDetails.lng, locationDetails.lat]);
    }
    setIsDrawerOpen(false);
    if(map.current) {
        map.current.fitBounds([
            userLocation.current,
            [locationDetails.lng, locationDetails.lat]
        ], { padding: 100 });
    }
  }

  const clearRoute = () => {
    isNavigating.current = false;
    if (directionsControl.current) directionsControl.current.removeRoutes();
    if (destinationMarker.current) {
      destinationMarker.current.remove();
      destinationMarker.current = null;
    }
    setRouteDetails(null);
    setLocationDetails(null);
    setIsDrawerOpen(false);
    if(map.current && userLocation.current) {
        map.current.flyTo({ center: userLocation.current, zoom: 14 });
    }
  }

  const formatDistance = (d: number) => d > 1000 ? `${(d / 1000).toFixed(1)} km` : `${d.toFixed(0)} m`;
  const formatDuration = (s: number) => {
    const m = Math.round(s / 60);
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-zinc-950 font-sans text-zinc-50">
        
        {/* FALLBACK INLINE STYLES */}
        <style jsx global>{`
          div[class*="mapbox-directions-origin"],
          div[class*="mapbox-directions-destination"],
          div[class*="mapbox-directions-step"] {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `}</style>

        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

        {/* Live Route HUD */}
        {routeDetails && (
          <div className="absolute top-4 left-0 right-0 z-10 flex justify-center px-4 animate-in fade-in slide-in-from-top-4">
            <Card className="w-full max-w-sm shadow-xl bg-zinc-900/90 backdrop-blur border-zinc-700 text-white">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex gap-4 items-center">
                    <div className="bg-blue-600 p-2 rounded-full text-white animate-pulse">
                        <Navigation2 className="h-6 w-6 fill-current" />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold tracking-tight">{formatDuration(routeDetails.duration)}</span>
                            <span className="text-sm text-zinc-400">({formatDistance(routeDetails.distance)})</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-400">
                             <LocateFixed className="h-3 w-3" /> Live Navigation
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={clearRoute} className="h-8 w-8 rounded-full hover:bg-zinc-800 text-white">
                    <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && !isNavigating.current && setIsDrawerOpen(false)}>
          <SheetContent side="bottom" className="rounded-t-xl p-6 border-zinc-800 sm:max-w-md sm:mx-auto bg-zinc-950 text-white">
            {locationDetails && (
              <div className="space-y-4">
                <SheetHeader className="text-left space-y-1">
                  {isFetchingAddress ? (
                     <div className="space-y-2">
                         <Skeleton className="h-6 w-2/3 bg-zinc-800" />
                         <Skeleton className="h-4 w-1/3 bg-zinc-800" />
                     </div>
                  ) : (
                    <>
                        <SheetTitle className="text-xl line-clamp-2 leading-tight text-white">
                            {addressDetails?.formatted || "Selected Location"}
                        </SheetTitle>
                        <SheetDescription className="flex items-center gap-2 text-zinc-400">
                           <MapPin className="h-3 w-3" />
                           {locationDetails.lat.toFixed(5)}, {locationDetails.lng.toFixed(5)}
                        </SheetDescription>
                    </>
                  )}
                </SheetHeader>
                <SheetFooter className="pt-2">
                  <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white" size="lg" onClick={handleStartNavigation}>
                    <Navigation className="h-4 w-4" /> Start Navigation
                  </Button>
                </SheetFooter>
              </div>
            )}
          </SheetContent>
        </Sheet>
    </div>
  );
}
