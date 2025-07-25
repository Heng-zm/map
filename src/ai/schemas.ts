import {z} from 'genkit';

export const GetDirectionsInputSchema = z.object({
  origin: z.array(z.number()).length(2).describe('The starting coordinates, in [longitude, latitude] format.'),
  destination: z.array(z.number()).length(2).describe('The destination coordinates, in [longitude, latitude] format.'),
});
export type GetDirectionsInput = z.infer<typeof GetDirectionsInputSchema>;

export const GetDirectionsOutputSchema = z.object({
  route: z.array(z.array(z.number()).length(2)).describe('An array of coordinates representing the route path, where each coordinate is [longitude, latitude].'),
});
export type GetDirectionsOutput = z.infer<typeof GetDirectionsOutputSchema>;


export const ListPlacesInputSchema = z.object({
  query: z.string().describe('The search query from the user, e.g. "restaurants in new york" or "places near 40.7128, -74.0060"'),
  type: z.string().optional().describe('An optional type of place to filter by, e.g. "Restaurant" or "Hotel".'),
});
export type ListPlacesInput = z.infer<typeof ListPlacesInputSchema>;

const PlaceSchema = z.object({
    id: z.string().describe("A unique identifier for the place."),
    name: z.string().describe("The name of the place."),
    description: z.string().describe("A brief, interesting description of the place."),
    coordinates: z.array(z.number()).length(2).describe("The longitude and latitude of the place, in that order: [longitude, latitude]."),
    rating: z.number().describe("The rating of the place, from 1 to 5."),
    reviews: z.number().describe("The number of reviews for the place."),
    type: z.string().describe("The type of the place, e.g. 'American Restaurant'."),
    images: z.array(z.string()).describe("A list of placeholder image URLs for the place, from `https://placehold.co/600x400.png`."),
    hours: z.string().describe("The business hours for the place, e.g. 'Open now' or 'Closed'."),
    tags: z.array(z.string()).describe("A list of tags for the place."),
    phone: z.string().describe("The phone number of the place."),
    website: z.string().describe("The website of the place."),
    photosBy: z.string().describe("The source of the photos."),
    posts: z.array(z.object({
        date: z.string().describe("The date of the post, in a human-readable format like 'June 26'."),
        text: z.string().describe("The text content of the post."),
        image: z.string().optional().describe("An optional placeholder image URL for the post from `https://placehold.co/100x100.png`."),
    })).describe("A list of recent posts from the place.")
});

export const ListPlacesOutputSchema = z.object({
  places: z.array(PlaceSchema).describe("A list of places that match the search query."),
});
export type ListPlacesOutput = z.infer<typeof ListPlacesOutputSchema>;
