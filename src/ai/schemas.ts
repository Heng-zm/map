/**
 * @fileOverview Schemas for AI flows.
 */

import { z } from 'genkit';

export const WeatherInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});
export type WeatherInput = z.infer<typeof WeatherInputSchema>;

export const WeatherOutputSchema = z.object({
  temperature: z.number().describe('The current temperature in Celsius.'),
  condition: z.string().describe('A brief description of the weather condition.'),
  windSpeed: z.number().describe('The current wind speed in meters per second.'),
  location: z.string().describe('The name of the location.'),
});
export type WeatherOutput = z.infer<typeof WeatherOutputSchema>;
