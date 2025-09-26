// backend/api/route.js

export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "https://manima.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: "Paramètres manquants: start et end sont requis" });
  }

  try {
    const [startLng, startLat] = start.split(",").map(Number);
    const [endLng, endLat] = end.split(",").map(Number);

    if ([startLng, startLat, endLng, endLat].some(isNaN)) {
      return res.status(400).json({ error: "Coordonnées invalides" });
    }

    // Limite distance max 100 km
    const distance = calculateDistance(startLat, startLng, endLat, endLng);
    if (distance > 100) {
      return res.status(400).json({ error: "Distance trop importante (max 100km)" });
    }

    // --- Timeout fetch avec AbortController ---
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s

    let response;
    try {
      response = await fetch(osrmUrl, { signal: controller.signal });
    } catch (err) {
      if (err.name === "AbortError") {
        return res.status(504).json({ error: "Timeout du service d'itinéraire" });
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return res.status(502).json({ error: "Service d'itinéraire indisponible" });
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return res.status(404).json({ error: "Aucun itinéraire trouvé" });
    }

    // Cache-control
    res.setHeader("Cache-Control", "public, max-age=300"); // 5 min

    res.status(200).json(data);
  } catch (err) {
    console.error("Backend error:", err);
    res.status(500).json({
      error: "Erreur interne du serveur",
      details: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
}

// --- Fonction utilitaire ---
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}