
/**
 * @fileOverview Service for interacting with the OpenWeatherMap API.
 */

const API_ENDPOINT = 'https://api.openweathermap.org/data/2.5/weather';

export async function getWeatherFromApi(lat: number, lon: number): Promise<any> {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) {
        throw new Error('OpenWeatherMap API key is not configured.');
    }
    
    const url = `${API_ENDPOINT}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    
    const response = await fetch(url);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch weather data from OpenWeatherMap.');
    }

    return response.json();
}
