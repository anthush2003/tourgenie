const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

router.get('/current', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ message: 'lat and lng query parameters are required' });
  }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(502).json({ message: 'Weather service unavailable', detail: error.message });
  }
});

router.get('/forecast', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ message: 'lat and lng query parameters are required' });
  }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(502).json({ message: 'Weather forecast service unavailable', detail: error.message });
  }
});

module.exports = router;
