
'use client';

import { Place } from '@/ai/schemas';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Bookmark } from 'lucide-react';
import Image from 'next/image';
import { ScrollArea } from './ui/scroll-area';

interface PlaceDetailsProps {
  place: Place;
  onClose: () => void;
  onSaveToggle: (place: Place) => void;
  isSaved: boolean;
}

export function PlaceDetails({ place, onClose, onSaveToggle, isSaved }: PlaceDetailsProps) {
  return (
    <Card className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[90vw] max-w-lg bg-card/80 backdrop-blur-sm shadow-lg text-card-foreground">
      <CardHeader className="flex-row items-start justify-between">
        <div>
            <CardTitle>{place.name}</CardTitle>
            <CardDescription>{place.category}</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
            <p className="text-sm mb-4">{place.description}</p>
            
            <h3 className="font-semibold mb-2">Photos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {place.photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square">
                        <Image src={photo} alt={`${place.name} photo ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md" />
                    </div>
                ))}
            </div>

            {place.posts && place.posts.length > 0 && (
                <>
                    <h3 className="font-semibold mb-2">Latest Posts</h3>
                    <div className="space-y-4">
                        {place.posts.map((post, index) => (
                            <div key={index} className="flex gap-4 p-2 rounded-md border border-border/50">
                                {post.image && (
                                     <div className="relative w-16 h-16 shrink-0">
                                        <Image src={post.image} alt={`Post image`} layout="fill" objectFit="cover" className="rounded-md" />
                                     </div>
                                )}
                                <div>
                                    <p className="text-xs text-muted-foreground">{post.date}</p>
                                    <p className="text-sm">{post.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onSaveToggle(place)} variant={isSaved ? "secondary" : "outline"} className="w-full">
          <Bookmark className={`mr-2 h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          {isSaved ? 'Saved' : 'Save Place'}
        </Button>
      </CardFooter>
    </Card>
  );
}
