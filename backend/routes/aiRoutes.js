const express = require('express');
const router = express.Router();
const { handleGeminiMessage } = require('../lib/geminiAssistant');
const { buildRouteSuggestions, buildDailyTips } = require('../lib/routeSuggestions');
const { buildTripTypeRecommendations, TRIP_TYPES, TRIP_TYPE_META } = require('../lib/tripRecommendations');

router.post('/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }
    const valid = messages
      .filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.trim())
      .slice(-20);
    if (!valid.length) return res.status(400).json({ error: 'No valid messages' });

    const lastUser = valid.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
    const ctx = context || {};
    const sessionId = ctx.sessionId || req.ip || 'anonymous';

    const { reply, meta } = await handleGeminiMessage({
      text: lastUser,
      sessionId,
      userName: ctx.userName || null,
      tours: Array.isArray(ctx.tours) ? ctx.tours : [],
      hotels: Array.isArray(ctx.hotels) ? ctx.hotels : [],
      messages: valid,
    });

    res.json({
      reply: reply || "Ayubowan! 🌿 Ask me anything about Sri Lanka — destinations, tours, hotels, food, transport, or travel tips!",
      meta,
    });
  } catch (err) {
    console.error('AI error:', err.message);
    res.json({
      reply: "Ayubowan! 🌿 I had a small hiccup — please ask again, I'm ready to help with all your Sri Lanka travel questions.",
      meta: { intent: 'error', confidence: 0, actions: [] },
    });
  }
});

router.post('/trip-type-recommendations', (req, res) => {
  try {
    const {
      tripType, origin, destination, distanceKm, durationHours,
      transportMode, travelerCount, pois,
    } = req.body || {};

    if (!origin || !destination || typeof distanceKm !== 'number' || typeof durationHours !== 'number') {
      return res.status(400).json({ error: 'origin, destination, distanceKm, durationHours required' });
    }

    const recommendations = buildTripTypeRecommendations({
      tripType,
      origin,
      destination,
      distanceKm,
      durationHours,
      transportMode: transportMode || 'driving',
      travelerCount: typeof travelerCount === 'number' && travelerCount > 0 ? travelerCount : 2,
      pois: Array.isArray(pois) ? pois.slice(0, 50) : [],
    });

    res.json({ recommendations });
  } catch (err) {
    console.error('Trip-type recommendations error:', err.message);
    res.json({ recommendations: [] });
  }
});

router.get('/trip-types', (_req, res) => {
  res.json({
    tripTypes: TRIP_TYPES.map((t) => ({ value: t, ...TRIP_TYPE_META[t] })),
  });
});

router.post('/route-suggestions', (req, res) => {
  try {
    const { origin, destination, distanceKm, durationHours, transportMode, pois } = req.body || {};
    if (!origin || !destination || typeof distanceKm !== 'number' || typeof durationHours !== 'number') {
      return res.status(400).json({ error: 'origin, destination, distanceKm, durationHours required' });
    }
    const suggestions = buildRouteSuggestions({
      origin, destination, distanceKm, durationHours,
      transportMode: transportMode || 'driving',
      pois: Array.isArray(pois) ? pois.slice(0, 50) : [],
    });
    res.json({ suggestions });
  } catch (err) {
    console.error('Route suggestions error:', err.message);
    res.json({ suggestions: [] });
  }
});

router.post('/daily-tips', (req, res) => {
  try {
    const { hour, weatherCode, destinationName } = req.body || {};
    const h = typeof hour === 'number' ? hour : new Date().getHours();
    const weatherContext = typeof weatherCode === 'number'
      ? (weatherCode <= 2 ? 'sunny' : weatherCode <= 49 ? 'cloudy' : 'rainy')
      : 'unknown';
    const tips = buildDailyTips({ hour: h, weatherContext, originDestName: destinationName || null });
    res.json({ tips });
  } catch (err) {
    console.error('Daily tips error:', err.message);
    res.json({ tips: [] });
  }
});

router.post('/reset', (req, res) => {
  res.json({ success: true, message: 'Chat context cleared' });
});

router.get('/status', (_req, res) => {
  res.json({
    engine: process.env.OPENROUTER_API_KEY
      ? (process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free')
      : 'rule-based',
    openrouterEnabled: !!process.env.OPENROUTER_API_KEY,
  });
});

module.exports = router;
