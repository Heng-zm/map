
'use server';
/**
 * @fileOverview A weather fetching flow.
 *
 * - getWeather - A function that fetches weather for a given location.
 * - WeatherInputSchema - The input type for the getWeather function.
 * - WeatherOutputSchema - The return type for the getWeather function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getWeatherFromApi } from '@/services/weather-service';

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

export async function getWeather(input: WeatherInput): Promise<WeatherOutput> {
    return weatherFlow(input);
}

const weatherFlow = ai.defineFlow(
  {
    name: 'weatherFlow',
    inputSchema: WeatherInputSchema,
    outputSchema: WeatherOutputSchema,
  },
  async (input) => {
    const weatherData = await getWeatherFromApi(input.latitude, input.longitude);
    
    return {
      temperature: weatherData.main.temp,
      condition: weatherData.weather[0]?.description || 'N/A',
      windSpeed: weatherData.wind.speed,
      location: weatherData.name,
    };
  }
);
