
'use client';
import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import mapboxgl, { GeolocateControl, Marker, LngLatLike } from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const initialCenter: [number, number] = [104.9282, 11.5564];
const initialZoom = 13;

const mapStyle = 'mapbox://styles/mapbox/standard';

export default function MapExplorerPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<Marker | null>(null);
  const directionsControl = useRef<MapboxDirections | null>(null);
  const userLocation = useRef<[number, number] | null>(null);
  const { toast } = useToast();

  const [locationDetails, setLocationDetails] = useState<{lng: number, lat: number} | null>(null);
  const [addressDetails, setAddressDetails] = useState<any>(null);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
      style: mapStyle,
      center: initialCenter,
      zoom: initialZoom,
      pitch: 0,
      bearing: 0,
      preserveDrawingBuffer: true,
    });
    map.current = mapInstance;
    
    const geolocate = new GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserLocation: true
    });
    
    mapInstance.addControl(geolocate);

    geolocate.on('geolocate', (e) => {
      const pos = e.coords;
      userLocation.current = [pos.longitude, pos.latitude];
    });

    mapInstance.on('load', () => {
      geolocate.trigger();

      const directions = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        controls: {
          inputs: false,
          instructions: false,
          profileSwitcher: false,
        },
        styles: [] // Use custom styles
      });
      mapInstance.addControl(directions, 'top-left');
      directionsControl.current = directions;
    });
    
    const onMapClick = (e: mapboxgl.MapMouseEvent & {
      features?: mapboxgl.MapboxGeoJSONFeature[] | undefined;
    }) => {
      if (marker.current) {
        marker.current.remove();
      }
      if (directionsControl.current) {
        directionsControl.current.removeRoutes();
      }
      
      const newMarker = new Marker().setLngLat(e.lngLat).addTo(mapInstance);
      marker.current = newMarker;

      setLocationDetails(e.lngLat);
      setIsDrawerOpen(true);
    };

    mapInstance.on('click', onMapClick);

    return () => {
      mapInstance.off('click', onMapClick);
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
        setAddressDetails(null);
        try {
          const response = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${locationDetails.lat}&lon=${locationDetails.lng}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`);
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            setAddressDetails(data.features[0].properties);
          } else {
            throw new Error("No address found");
          }
        } catch (error) {
          console.error("Error fetching address:", error);
          toast({
            variant: "destructive",
            title: "Could not fetch address",
            description: "Please try a different location.",
          });
          setAddressDetails(null);
        } finally {
          setIsFetchingAddress(false);
        }
      };
      fetchAddress();
    }
  }, [locationDetails, toast]);


  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
    if (directionsControl.current) {
      directionsControl.current.removeRoutes();
    }
    setLocationDetails(null);
    setAddressDetails(null);
  };

  const handleGetDirections = () => {
    if (!userLocation.current) {
      toast({
        variant: "destructive",
        title: "User location not available",
        description: "Please enable location services to get directions.",
      });
      return;
    }

    if (!locationDetails) return;

    if (directionsControl.current) {
      directionsControl.current.setOrigin(userLocation.current);
      directionsControl.current.setDestination([locationDetails.lng, locationDetails.lat]);
    }
    setIsDrawerOpen(false); // Close drawer after setting directions
  }


  return (
    <div className="h-screen w-screen overflow-hidden bg-background font-body dark">
        <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
        <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && handleDrawerClose()}>
          <SheetContent side="bottom" className="rounded-t-lg p-0">
            {locationDetails && (
              <div>
                <Image
                  alt="Location placeholder image"
                  className="w-full h-48 object-cover rounded-t-lg"
                  height={192}
                  src={`https://picsum.photos/seed/${locationDetails.lng}/800/400`}
                  width={800}
                  data-ai-hint="landscape random"
                />
                <div className="p-6">
                  <SheetHeader>
                    {isFetchingAddress ? (
                       <Skeleton className="h-7 w-2/3" />
                    ) : (
                      <SheetTitle>{addressDetails?.formatted || "Location Details"}</SheetTitle>
                    )}
                     {isFetchingAddress ? (
                      <div className="space-y-2 pt-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ) : (
                      <SheetDescription>
                        {addressDetails ? `Country: ${addressDetails.country}` : 'Details about the selected location.'}
                      </SheetDescription>
                    )}
                  </SheetHeader>
                  <div className="py-4 text-sm text-muted-foreground">
                    <p><strong>Latitude:</strong> {locationDetails.lat.toFixed(6)}</p>
                    <p><strong>Longitude:</strong> {locationDetails.lng.toFixed(6)}</p>
                  </div>
                  <SheetFooter className="flex-row gap-2 pt-4">
                    <Button variant="outline" className="flex-1" onClick={handleGetDirections}>Get Directions</Button>
                    <Button className="flex-1">Save Place</Button>
                  </SheetFooter>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
    </div>
  );
}
