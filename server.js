const express = require('express');
const fetch = require('node-fetch'); // indispensable pour fetch en Node.js
const app = express();
const PORT = 3000;

const OPENWEATHER_API_KEY = '5b8c517e1582cb51d2ec1422e9c0b10d';

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/weather', async (req, res) => {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Lille,fr&appid=${OPENWEATHER_API_KEY}&units=metric`);
    const data = await response.json();
    
    // Vérif pluie par ID météo
    const rainIds = [500, 501, 502, 503, 504, 511, 520, 521, 522, 531];
    const isRainingById = data.weather.some(w => rainIds.includes(w.id));
    
    // Vérif pluie via volume sur 1h ou 3h
    const hasRecentRain = data.rain && ((data.rain["1h"] || 0) > 0 || (data.rain["3h"] || 0) > 0);
    
    // Résultat pluie final
    const isRaining = isRainingById || hasRecentRain;

    // Température et humidité
    const temp = data.main.temp;
    const humidity = data.main.humidity;

    // Définition des règles pour extérieur / intérieur
    let recommendation = "intérieur"; 

    if (!isRaining && temp >= 18 && temp <= 28 && humidity < 70) {
      recommendation = "extérieur";
    } else if (temp < 10 || humidity > 85) {
      // Température trop basse ou humidité très élevée → intérieur
      recommendation = "intérieur";
    } else {
      // Sinon, conseil par défaut selon pluie et humidité
      recommendation = "intérieur";
    }

    res.json({
      recommendation, // "extérieur" ou "intérieur"
      temp,
      humidity,
      raining: isRaining,
      debug: {
        weather: data.weather,
        rain: data.rain
      }
    });
  } catch (error) {
    console.error("Erreur serveur météo:", error);
    res.status(500).json({ 
      recommendation: "intérieur", 
      temp: null,
      humidity: null,
      raining: null,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur météo lancé sur http://localhost:${PORT}`);
});