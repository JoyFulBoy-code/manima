import express from 'express';

const app = express();
const OPENWEATHER_API_KEY = '5b8c517e1582cb51d2ec1422e9c0b10d';

// Middleware CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// Endpoint de test
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working with Node.js 22!' });
});

// Endpoint météo
app.get('/weather', async (req, res) => {
  try {
    console.log('🌤️ Fetching weather data...');
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Lille,fr&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Weather data received:', data);

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
      weather: data.weather[0].description
    });
    
  } catch (error) {
    console.error("❌ Backend error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message
    });
  }
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;