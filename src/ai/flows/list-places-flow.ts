
'use server';
/**
 * @fileOverview A flow for finding a list of places from a search query.
 *
 * - listPlaces - A function that handles the location list search process.
 * - ListPlacesInput - The input type for the listPlaces function.
 * - ListPlacesOutput - The return type for the listPlaces function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ListPlacesInputSchema = z.object({
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
        date: z.string().describe("The date of the post."),
        text: z.string().describe("The text of the post."),
        image: z.string().optional().describe("An optional placeholder image URL for the post from `https://placehold.co/100x100.png`."),
    })).describe("A list of recent posts from the place.")
});

const ListPlacesOutputSchema = z.object({
  places: z.array(PlaceSchema).describe("A list of places that match the search query."),
});
export type ListPlacesOutput = z.infer<typeof ListPlacesOutputSchema>;

export async function listPlaces(
  input: ListPlacesInput
): Promise<ListPlacesOutput> {
  return listPlacesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'listPlacesPrompt',
  input: {schema: ListPlacesInputSchema},
  output: {schema: ListPlacesOutputSchema},
  prompt: `You are a helpful assistant that can find places on a map and provide a brief description of them.
The user will provide a search query and you will return a list of places that match.
For each place, provide all the information in the schema. Generate realistic but not necessarily real data for fields like phone, website, etc.
If the search query contains coordinates, prioritize results near that location.
For images, use placeholder URLs from https://placehold.co.
Generate 3-5 realistic posts for each business, with dates from the last month.

{{#if type}}
Only return places of type: {{{type}}}.
{{/if}}

Search Query: {{{query}}}`,
});

const listPlacesFlow = ai.defineFlow(
  {
    name: 'listPlacesFlow',
    inputSchema: ListPlacesInputSchema,
    outputSchema: ListPlacesOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

    
