
'use client';
import React, { useRef, useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Map as MapIcon, Compass, LocateFixed, Star, Phone, Globe, Calendar, Clock, X, Navigation } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { listPlaces } from '@/ai/flows/list-places-flow';
import { getDirections } from '@/ai/flows/get-directions-flow';
import type { ListPlacesInput, ListPlacesOutput } from '@/ai/schemas';
import type { GetDirectionsInput } from '@/ai/schemas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PlaceCard } from '@/components/place-card';
import { Skeleton } from '@/components/ui/skeleton';


mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const initialCenter: [number, number] = [-73.9876, 40.7484];
const initialZoom = 13;
const initialStyle = 'mapbox://styles/mapbox/standard';

export interface Place {
  id: string;
  name: string;
  description: string;
  coordinates: [number, number];
  rating: number;
  reviews: number;
  type: string;
  images: string[];
  hours: string;
  tags: string[];
  phone: string;
  website: string;
  icon?: string;
  photosBy: string;
  posts: {
    date: string;
    text: string;
    image?: string;
  }[];
}


export default function MapExplorerPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const placeMarkers = useRef<mapboxgl.Marker[]>([]);
  const [mapStyle, setMapStyle] = useState(initialStyle);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const droppedMarker = useRef<mapboxgl.Marker | null>(null);
  const [directionsLoading, setDirectionsLoading] = useState(false);


  const createMarkerElement = (place: Place) => {
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage = `url('https://placehold.co/40x40/f97316/ffffff.png?text=${place.type.charAt(0)}')`;
    el.style.width = `40px`;
    el.style.height = `40px`;
    el.style.backgroundSize = '100%';
    el.style.cursor = 'pointer';
    return el;
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
      style: mapStyle,
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

    map.current.on('click', (e) => {
      if (droppedMarker.current) {
        droppedMarker.current.remove();
      }
      
      const newMarker = new mapboxgl.Marker({ draggable: true, color: '#3b82f6' })
        .setLngLat(e.lngLat)
        .addTo(map.current!);

      newMarker.on('dragend', () => {
        const lngLat = newMarker.getLngLat();
        const locationQuery = `places near ${lngLat.lat}, ${lngLat.lng}`;
        setQuery(`Dropped Pin`);
        handleSearch(locationQuery, activeFilter);
      });

      droppedMarker.current = newMarker;

      const lngLat = newMarker.getLngLat();
      const locationQuery = `places near ${lngLat.lat}, ${lngLat.lng}`;
      setQuery(`Dropped Pin`);
      handleSearch(locationQuery, activeFilter);
    });

    return () => {
        map.current?.remove();
        map.current = null;
    }
  }, []);

  useEffect(() => {
    if (map.current) {
      map.current.setStyle(mapStyle);
    }
  }, [mapStyle]);

  useEffect(() => {
    if (!map.current) return;
    placeMarkers.current.forEach(m => m.remove());
    placeMarkers.current = [];

    places.forEach(place => {
        const el = createMarkerElement(place);
        const marker = new mapboxgl.Marker(el)
            .setLngLat(place.coordinates as [number, number])
            .addTo(map.current!);
        
        marker.getElement().addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedPlace(place);
            setSheetOpen(true);
            map.current?.flyTo({ center: place.coordinates as [number, number], zoom: 15 });
        });
        placeMarkers.current.push(marker);
    });
  }, [places]);

  const handleSearch = async (searchQuery: string, filter?: string) => {
    if (!searchQuery) return;
    setLoading(true);
    setPlaces([]);
    setSelectedPlace(null);
    setSheetOpen(true);

    if (droppedMarker.current && searchQuery !== `Dropped Pin` && !searchQuery.startsWith('places near')) {
        droppedMarker.current.remove();
        droppedMarker.current = null;
    }

    const searchOptions: ListPlacesInput = { query: searchQuery };
    if (filter && filter !== 'All') {
      searchOptions.type = filter;
    }

    try {
      const result = await listPlaces(searchOptions);
      setPlaces(result.places as Place[]);

      if (result.places.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          result.places.forEach(p => bounds.extend(p.coordinates as [number, number]));
          map.current?.fitBounds(bounds, { padding: 80, pitch: 45 });
      }
      
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: "Could not find the requested location. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDirections = () => {
    if (!selectedPlace) return;

    setDirectionsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const origin: [number, number] = [longitude, latitude];
          const destination = selectedPlace.coordinates;

          try {
            const directions = await getDirections({ origin, destination });
            
            if (map.current?.getSource('route')) {
                map.current.removeLayer('route');
                map.current.removeSource('route');
            }

            map.current?.addSource('route', {
              'type': 'geojson',
              'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                  'type': 'LineString',
                  'coordinates': directions.route,
                }
              }
            });

            map.current?.addLayer({
              'id': 'route',
              'type': 'line',
              'source': 'route',
              'layout': {
                'line-join': 'round',
                'line-cap': 'round'
              },
              'paint': {
                'line-color': '#3b82f6',
                'line-width': 6
              }
            });
            
            const bounds = new mapboxgl.LngLatBounds();
            directions.route.forEach(point => bounds.extend(point as [number, number]));
            map.current?.fitBounds(bounds, { padding: 80 });

            setSheetOpen(false);

          } catch (error) {
             toast({
              variant: "destructive",
              title: "Directions failed",
              description: "Could not get directions. Please try again.",
            });
          } finally {
            setDirectionsLoading(false);
          }
        },
        () => {
          toast({
            variant: "destructive",
            title: "Geolocation failed",
            description: "Could not get your location.",
          });
          setDirectionsLoading(false);
        }
      );
    } else {
       toast({
        variant: "destructive",
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation.",
      });
      setDirectionsLoading(false);
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent<HTMLFormEvent>) => {
    e.preventDefault();
    handleSearch(query, activeFilter);
  };
  
  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    if(query) {
      handleSearch(query, filter);
    }
  }

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.current?.flyTo({ center: [longitude, latitude], zoom: 15 });
          const locationQuery = `places near ${latitude}, ${longitude}`;
          setQuery("Nearby places");
          handleSearch(locationQuery, activeFilter);
        },
        () => {
          toast({
            variant: "destructive",
            title: "Geolocation failed",
            description: "Could not get your location.",
          });
        }
      );
    } else {
      toast({
        variant: "destructive",
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation.",
      });
    }
  };

  const handleSheetClose = (open: boolean) => {
    if (!open) {
      setSelectedPlace(null);
    }
    setSheetOpen(open);
  }

  const handleBackToList = () => {
    setSelectedPlace(null);
    if (places.length > 1 && map.current) {
        const bounds = new mapboxgl.LngLatBounds();
        places.forEach(p => bounds.extend(p.coordinates as [number, number]));
        map.current.fitBounds(bounds, { padding: 80, pitch: 45 });
    }
  }

  const mapStyles = [
    { name: 'Standard', value: 'mapbox://styles/mapbox/standard' },
    { name: 'Streets', value: 'mapbox://styles/mapbox/streets-v12' },
    { name: 'Outdoors', value: 'mapbox://styles/mapbox/outdoors-v12' },
    { name: 'Light', value: 'mapbox://styles/mapbox/light-v11' },
    { name: 'Dark', value: 'mapbox://styles/mapbox/dark-v11' },
    { name: 'Satellite', value: 'mapbox://styles/mapbox/satellite-v9' },
    { name: 'Satellite Streets', value: 'mapbox://styles/mapbox/satellite-streets-v12' },
  ];

  const filters = ['All', 'Restaurants', 'Hotels', 'Gas'];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background font-sans">
      <div ref={mapContainer} style={containerStyle} className="absolute inset-0" />
      
       <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white/80 backdrop-blur-sm">
                <MapIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Map Styles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mapStyles.map((style) => (
              <DropdownMenuItem key={style.value} onSelect={() => setMapStyle(style.value)}>
                {style.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!sheetOpen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <Button
            size="lg"
            className="rounded-full shadow-lg"
            onClick={() => setSheetOpen(true)}
          >
            <Compass className="mr-2 h-5 w-5" />
            Explore
          </Button>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-xl flex flex-col p-0" overlayClassName="bg-black/20">
             <SheetHeader className="p-4 pt-2 border-b">
                <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-2" />
                <SheetTitle className="sr-only">Locations</SheetTitle>
                <form onSubmit={handleFormSubmit}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search for a place or address" className="pl-10 pr-12" value={query} onChange={(e) => setQuery(e.target.value)} />
                     <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={handleMyLocation}><LocateFixed className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </form>
                <div className="flex gap-2 pt-2">
                    {filters.map(filter => (
                      <Button 
                        key={filter}
                        variant={activeFilter === filter ? "default" : "outline"} 
                        size="sm" 
                        className="rounded-full"
                        onClick={() => handleFilterClick(filter)}
                      >
                        {filter === 'All' && <MapIcon className="h-4 w-4 mr-2" />}
                        {filter}
                      </Button>
                    ))}
                </div>
              </SheetHeader>
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {selectedPlace ? (
                    <div className="space-y-6">
                      <div className="relative h-48 w-full rounded-lg overflow-hidden">
                        <img src={selectedPlace.images[0] || 'https://placehold.co/600x400.png'} alt={selectedPlace.name} className="h-full w-full object-cover" data-ai-hint="restaurant food" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold">{selectedPlace.name}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                           <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span>{selectedPlace.rating}</span>
                          </div>
                          <span>({selectedPlace.reviews} reviews)</span>
                          <span>&middot;</span>
                          <span>{selectedPlace.type}</span>
                        </div>
                         <div className="flex flex-wrap gap-2 pt-2">
                          {selectedPlace.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {selectedPlace.hours}</div>
                        <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {selectedPlace.phone}</div>
                        <div className="flex items-center gap-2 col-span-2"><Globe className="h-4 w-4" /> {selectedPlace.website}</div>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="font-semibold">From the business</h3>
                        <p className="text-sm text-muted-foreground mt-2">{selectedPlace.description}</p>
                      </div>
                      <Separator />
                       <div>
                        <h3 className="font-semibold mb-2">Photos</h3>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedPlace.images.map((img, i) => (
                            <img key={i} src={img} alt={`${selectedPlace.name} photo ${i}`} className="rounded-lg object-cover aspect-square" data-ai-hint="restaurant interior" />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Photos by {selectedPlace.photosBy}</p>
                      </div>
                       <Separator />
                       <div>
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold">Latest Posts</h3>
                        </div>
                        <div className="space-y-4 mt-2">
                          {selectedPlace.posts?.map((post, i) => (
                            <div key={i} className="flex gap-4">
                               <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0">
                                {post.image && <img src={post.image} className="w-full h-full object-cover rounded-lg" data-ai-hint="food" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {post.date}
                                </div>
                                <p className="text-sm font-medium mt-1 line-clamp-2">{post.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                     <div className="space-y-4">
                      { loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="border rounded-lg overflow-hidden">
                                <Skeleton className="w-full h-40" />
                                <div className="p-4 space-y-2">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-1/3" />
                                </div>
                            </div>
                        ))
                      ) : places.length > 0 ? (
                        <>
                          <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Results for "{query}"</h2>
                          </div>
                          {places.map((place) => (
                            <PlaceCard key={place.id} place={place} onClick={() => { setSelectedPlace(place); map.current?.flyTo({ center: place.coordinates as [number, number], zoom: 15 }); }} />
                          ))}
                        </>
                      ) : (
                        <div className="text-center py-20 text-muted-foreground">
                            <Compass className="h-12 w-12 mx-auto" />
                            <p className="mt-4 font-medium">Search for something to get started.</p>
                            <p className="text-sm">Try searching for "parks in san francisco" or click the map.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
              {selectedPlace ? (
                <div className="p-4 border-t grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full" onClick={handleBackToList}>
                    Back to list
                  </Button>
                  <Button className="w-full" onClick={handleDirections} disabled={directionsLoading}>
                    {directionsLoading ? 'Loading...' : <><Navigation className="mr-2 h-4 w-4" />Directions</>}
                  </Button>
                </div>
              ) : (
                <div className="p-4 border-t">
                  <SheetClose asChild>
                    <Button variant="outline" className="w-full">
                      Close
                    </Button>
                  </SheetClose>
                </div>
              )}
          </SheetContent>
      </Sheet>
    </div>
  );
}
