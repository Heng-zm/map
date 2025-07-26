
'use server';
/**
 * @fileOverview A weather fetching flow.
 *
 * - getWeather - A function that fetches weather for a given location.
 */

import { ai } from '@/ai/genkit';
import { getWeatherFromApi } from '@/services/weather-service';
import { WeatherInput, WeatherInputSchema, WeatherOutput, WeatherOutputSchema } from '@/ai/schemas';

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
