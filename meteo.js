// api/weather.js
import fetch from 'node-fetch';

const OPENWEATHER_API_KEY = '5b8c517e1582cb51d2ec1422e9c0b10d';

export default async function handler(req, res) {
  // Configurer CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🌤️ Fetching weather data for Lille...');
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Lille,fr&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Weather data received');

    const rainIds = [500, 501, 502, 503, 504, 511, 520, 521, 522, 531];
    const isRainingById = data.weather.some(w => rainIds.includes(w.id));
    const hasRecentRain = data.rain && ((data.rain["1h"] || 0) > 0 || (data.rain["3h"] || 0) > 0);
    const isRaining = isRainingById || hasRecentRain;

    const temp = data.main.temp;
    const humidity = data.main.humidity;

    let recommendation = "intérieur";
    if (!isRaining && temp >= 18) {
      recommendation = "extérieur";
    }

    res.json({
      recommendation,
      temp: Math.round(temp * 10) / 10,
      humidity,
      raining: isRaining,
      city: data.name,
      weather: data.weather[0].description,
      success: true
    });
    
  } catch (error) {
    console.error("❌ Backend error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message,
      success: false
    });
  }
}