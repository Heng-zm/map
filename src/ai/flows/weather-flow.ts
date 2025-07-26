
'use server';
/**
 * @fileOverview A Genkit flow for fetching weather data for a given map area.
 *
 * - getWeather - A function that returns weather features within the map boundaries.
 * - WeatherInput - The Zod schema for the input of the `getWeather` flow.
 * - WeatherOutput - The Zod schema for the output of the `getWeather` flow.
 */

import { ai } from '@/ai/genkit';
import {
  WeatherInputSchema,
  WeatherOutputSchema,
  type WeatherInput,
  type WeatherOutput,
} from '@/ai/schemas';
import { z } from 'zod';

const getWeatherFlow = ai.defineFlow(
  {
    name: 'getWeatherFlow',
    inputSchema: WeatherInputSchema,
    outputSchema: WeatherOutputSchema,
  },
  async (input) => {
    // In a real application, you would fetch this data from a weather API.
    // For this example, we will generate some mock weather data.
    const { northEast, southWest } = input;
    const mockWeatherData: WeatherOutput = [];
    const latRange = northEast.latitude - southWest.latitude;
    const lonRange = northEast.longitude - southWest.longitude;

    // Generate a few random weather patches
    for (let i = 0; i < 5; i++) {
      const type = ['rain', 'cloud', 'snow'][Math.floor(Math.random() * 3)] as 'rain' | 'cloud' | 'snow';
      const centerLat = southWest.latitude + Math.random() * latRange;
      const centerLon = southWest.longitude + Math.random() * lonRange;
      const size = Math.random() * 0.1; // Size of the weather patch in degrees

      const polygon = [
        [
          [centerLon - size, centerLat - size],
          [centerLon + size, centerLat - size],
          [centerLon + size, centerLat + size],
          [centerLon - size, centerLat + size],
          [centerLon - size, centerLat - size], // Close the polygon
        ],
      ];

      mockWeatherData.push({
        type,
        polygon,
      });
    }

    return mockWeatherData;
  }
);

/**
 * Fetches weather data for the specified map boundaries.
 * @param input The map boundaries.
 * @returns A promise that resolves to a list of weather features.
 */
export async function getWeather(input: WeatherInput): Promise<WeatherOutput> {
  return getWeatherFlow(input);
}
