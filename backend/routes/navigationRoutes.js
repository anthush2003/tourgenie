const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

router.get('/route', async (req, res) => {
  const { startLat, startLng, endLat, endLng, mode = 'driving-car' } = req.query;

  if (!startLat || !startLng || !endLat || !endLng) {
    return res.status(400).json({ message: 'startLat, startLng, endLat and endLng are all required' });
  }

  const coords = { startLat, startLng, endLat, endLng };
  const parsed = {};
  for (const [key, val] of Object.entries(coords)) {
    const n = parseFloat(val);
    if (!isFinite(n)) return res.status(400).json({ message: `${key} must be a valid number` });
    parsed[key] = n;
  }

  if (parsed.startLat < 5.7 || parsed.startLat > 10.1 || parsed.startLng < 79.3 || parsed.startLng > 82.2) {
    return res.status(400).json({ message: 'Start coordinates are outside valid geographic bounds (Sri Lanka)' });
  }
  if (parsed.endLat < 5.7 || parsed.endLat > 10.1 || parsed.endLng < 79.3 || parsed.endLng > 82.2) {
    return res.status(400).json({ message: 'End coordinates are outside valid geographic bounds (Sri Lanka)' });
  }

  const ALLOWED_MODES = new Set(['driving-car', 'foot-walking', 'cycling-regular', 'driving-hgv']);
  const safeMode = ALLOWED_MODES.has(mode) ? mode : 'driving-car';

  const url = `https://api.openrouteservice.org/v2/directions/${safeMode}?api_key=${process.env.ORS_API_KEY}&start=${parsed.startLng},${parsed.startLat}&end=${parsed.endLng},${parsed.endLat}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return res.status(502).json({ message: 'Routing service error', detail: body });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(502).json({ message: 'Routing service unavailable', detail: error.message });
  }
});

module.exports = router;
