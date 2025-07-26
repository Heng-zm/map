'use server';
/**
 * @fileOverview A Genkit flow for finding and listing places based on a user's
 * query and the current map view.
 *
 * - listPlaces - A function that takes a query and map boundaries and returns a
 *   list of matching places.
 * - ListPlacesInput - The Zod schema for the input of the `listPlaces` flow.
 * - ListPlacesOutput - The Zod schema for the output of the `listPlaces` flow.
 */

import { ai } from '@/ai/genkit';
import {
  ListPlacesInputSchema,
  ListPlacesOutputSchema,
  type ListPlacesInput,
  type ListPlacesOutput,
} from '@/ai/schemas';

const prompt = ai.definePrompt({
  name: 'listPlacesPrompt',
  input: { schema: ListPlacesInputSchema },
  output: { schema: ListPlacesOutputSchema },
  prompt: `
    You are a helpful local guide assistant for an interactive map application.
    Your task is to find places that match the user's query within the visible
    area of the map.

    The user is currently viewing a map with the following boundaries:
    - Center: {{center.latitude}}, {{center.longitude}}
    - Northeast Corner: {{northEast.latitude}}, {{northEast.longitude}}
    - Southwest Corner: {{southWest.latitude}}, {{southWest.longitude}}

    User's query: "{{query}}"

    Based on this query and the map boundaries, find relevant places. For each
    place, provide a name, a detailed description, a category, geographic
    coordinates, at least 2-3 high-quality photo URLs, and 2-3 recent posts.
    The posts should be creative and relevant to the business.
    Ensure the locations are within the provided map boundaries.
  `,
});

const listPlacesFlow = ai.defineFlow(
  {
    name: 'listPlacesFlow',
    inputSchema: ListPlacesInputSchema,
    outputSchema: ListPlacesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

/**
 * Finds places based on a search query and map boundaries.
 * @param input The search query and map boundaries.
 * @returns A promise that resolves to a list of places.
 */
export async function listPlaces(
  input: ListPlacesInput
): Promise<ListPlacesOutput> {
  return listPlacesFlow(input);
}
