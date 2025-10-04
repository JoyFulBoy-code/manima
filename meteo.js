const express = require('express');
const fetch = require('node-fetch'); // indispensable pour fetch en Node.js
const app = express();
const PORT = process.env.PORT || 3000; // Vercel définit automatiquement process.env.PORT

const OPENWEATHER_API_KEY = '5b8c517e1582cb51d2ec1422e9c0b10d';

// Middleware CORS pour autoriser ton frontend
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // ou remplace '*' par ton domaine frontend
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

/* =======================
   🌦️ Endpoint météo
======================= */
// Dans votre backend Express
app.get('/weather', async (req, res) => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Lille,fr&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    const data = await response.json();

    const rainIds = [500, 501, 502, 503, 504, 511, 520, 521, 522, 531];
    const isRainingById = data.weather.some(w => rainIds.includes(w.id));
    const hasRecentRain = data.rain && ((data.rain["1h"] || 0) > 0 || (data.rain["3h"] || 0) > 0);
    const isRaining = isRainingById || hasRecentRain;

    const temp = data.main.temp;
    const humidity = data.main.humidity;

    // VOS CONDITIONS EXACTES :
    let recommendation = "intérieur"; // Par défaut
    
    if (!isRaining && temp >= 18) {
      recommendation = "extérieur";
    }
    // Si il pleut OU température < 18°C → intérieur

    res.json({
      recommendation,
      temp: Math.round(temp * 10) / 10, // Arrondi à 1 décimale
      humidity,
      raining: isRaining,
      debug: { 
        weather: data.weather, 
        rain: data.rain,
        conditions: `Pluie: ${isRaining}, Temp: ${temp}°C, Décision: ${recommendation}`
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