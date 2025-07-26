/**
 * @fileoverview This file contains Zod schemas that define the data structures
 * for AI-powered features in the Map Explorer application. These schemas are
 * used for validating inputs and outputs of Genkit flows.
 */
import { z } from 'zod';

/**
 * Defines the geographic coordinates of a location.
 */
export const LocationSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});

/**
 * Defines a post, which could be an update or an article associated with a place.
 */
export const PostSchema = z.object({
    date: z.string().describe("The publication date of the post, in a readable format (e.g., 'July 26, 2024')."),
    text: z.string().describe('The content of the post.'),
    image: z.string().optional().describe('A URL to an image for the post.'),
});

/**
 * Defines the structure for a place, including its name, description, category,
 * location, and associated images and posts.
 */
export const PlaceSchema = z.object({
  name: z.string().describe('The name of the place.'),
  description: z.string().describe('A detailed description of the place.'),
  category: z.string().describe('The category of the place (e.g., "Park", "Restaurant", "Museum").'),
  location: LocationSchema,
  photos: z.array(z.string()).describe('An array of URLs for photos of the place.'),
  posts: z.array(PostSchema).optional().describe('A list of recent posts or updates related to the place.'),
});
export type Place = z.infer<typeof PlaceSchema>;

/**
 * Defines the input for the `listPlaces` flow, which includes the user's query
 * and the geographic boundaries of the map view.
 */
export const ListPlacesInputSchema = z.object({
  query: z.string().describe('The user\'s search query for finding places.'),
  center: LocationSchema.describe('The center point of the current map view.'),
  northEast: LocationSchema.describe('The northeast corner of the current map view.'),
  southWest: LocationSchema.describe('The southwest corner of the current map view.'),
});
export type ListPlacesInput = z.infer<typeof ListPlacesInputSchema>;

/**
 * Defines the output for the `listPlaces` flow, which is a list of places
 * that match the search query.
 */
export const ListPlacesOutputSchema = z.object({
  places: z.array(PlaceSchema),
});
export type ListPlacesOutput = z.infer<typeof ListPlacesOutputSchema>;

/**
 * Defines the schema for a single message in a chat conversation.
 */
export const ChatMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * Defines the input for the `chat` flow, which consists of a history of
 * previous messages in the conversation.
 */
export const ChatInputSchema = z.object({
    history: z.array(ChatMessageSchema),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;
