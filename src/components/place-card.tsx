
'use client';

import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { Place } from '@/app/page';


interface PlaceCardProps {
  place: Place;
  onClick: () => void;
}

export function PlaceCard({ place, onClick }: PlaceCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden cursor-pointer" onClick={onClick}>
      <Carousel className="w-full">
        <CarouselContent>
          {place.images && place.images.length > 0 ? (
            place.images.map((image, index) => (
              <CarouselItem key={index}>
                <img src={image} alt={`${place.name} image ${index + 1}`} className="w-full h-40 object-cover" data-ai-hint="restaurant interior" />
              </CarouselItem>
            ))
           ) : (
            <CarouselItem>
              <div className="w-full h-40 bg-muted flex items-center justify-center">
              </div>
            </CarouselItem>
           )
          }
        </CarouselContent>
        {place.images && place.images.length > 1 && (
          <>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
          </>
        )}
      </Carousel>
      <div className="p-4">
        <h3 className="font-semibold text-lg">{place.name}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span>{place.rating}</span>
          </div>
          <span>({place.reviews} reviews)</span>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {place.type} &middot; {place.hours}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {place.tags.map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
