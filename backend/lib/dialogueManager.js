const { understand } = require('./nlu');
const {
  getSession, pushTurn, startSlotFilling, fillSlotsFromEntities,
  resolveContext, updateActiveContext, setUserName,
} = require('./contextEngine');
const R = require('./responder');
const P = require('./practicalReplies');
const { DESTINATIONS } = require('./knowledgeBase');

function triggerAgentTransfer(session, reason) {
  console.log(`[trigger_agent_transfer] reason="${reason}" turns=${session.history.length}`);
  return {
    handoff: true,
    transcript: session.history.slice(-10),
  };
}

function buildActions(intentKey) {
  const map = {
    create_tour: ['create-tour'],
    daily_mode: ['daily-mode'],
    hotels: ['hotels'],
    tours_browse: ['tours'],
    booking: ['profile'],
    profile: ['profile'],
  };
  return map[intentKey] || [];
}

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return null;
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

function finalize(reply, intent, confidence, nlu, session) {
  return {
    reply,
    meta: {
      intent,
      confidence,
      actions: buildActions(intent),
      sentiment: nlu.sentiment
    }
  };
}

function resolveIntent(intent, entities, nlu, session, { tours, hotels }) {
  const textNorm = nlu.normalized;
  switch (intent) {
    case 'greeting': {
      const opener = R.pick(R.GREET_OPENERS)(R.firstName(session.userName));
      const body = R.pick(R.GREET_BODIES);
      return `${opener} ${body}`;
    }
    case 'thanks':
      return R.pick(R.THANKS_REPLIES)(R.firstName(session.userName));
    case 'farewell':
      return R.pick(R.FAREWELL_REPLIES);
    case 'affirm':
      return R.pick(R.AFFIRM_FOLLOWUPS);
    case 'deny':
      return "No problem. Let me know if you change your mind or want to explore something else.";
    case 'help':
      return R.pick(R.GREET_BODIES);
    case 'destination_info': {
      if (entities.destination) {
        const rep = R.replyDestination(entities.destination, session);
        if (rep) return rep;
      }
      return "Which destination in Sri Lanka are you interested in? I can tell you about Sigiriya, Ella, Kandy, Galle, Mirissa, and many more.";
    }
    case 'food':
      return R.replyFood(textNorm, entities.destination);
    case 'transport':
      return R.replyTransport(textNorm);
    case 'weather':
      return R.replyWeather(textNorm);
    case 'budget':
      return R.replyBudget(textNorm);
    case 'visa':
      return P.replyVisa();
    case 'safety':
      return P.replySafety(nlu.sentiment);
    case 'health':
      return P.replyHealth();
    case 'connectivity':
      return P.replyConnectivity();
    case 'electricity':
      return P.replyElectricity();
    case 'shopping':
      return P.replyShopping();
    case 'culture':
      return P.replyCulture();
    case 'region_overview':
      return P.replyRegionOverview();
    case 'beach':
      return R.replyBeach(textNorm);
    case 'wildlife':
      return R.replyWildlife(textNorm);
    case 'hiking':
      return R.replyHiking();
    case 'itinerary': {
      const rep = R.replyItinerary(textNorm, entities.duration);
      if (rep) return rep;
      startSlotFilling(session, 'itinerary', ['duration']);
      return `Got it. ${R.askForDuration()}`;
    }
    case 'create_tour':
      return "You can build your custom tour route easily! Check out the /create-tour page to start planning.";
    case 'daily_mode':
      return "Daily Mode helps you navigate in real-time with live route planning. Head over to /daily to try it out.";
    case 'hotels':
      return "Looking for a place to stay? You can browse and book hotels directly on our /hotels page.";
    case 'tours_browse':
      return "Check out our available tours at /tours to find the perfect pre-planned Sri Lankan adventure.";
    case 'booking':
      return "You can view and manage all your bookings and reservations on your /profile page.";
    case 'profile':
      return "Access your account details, booking history, and trip plans on your /profile page.";
    default:
      return "I'm not quite sure how to help with that specifically, but I can guide you on destinations, food, transport, weather, budgets, and itineraries in Sri Lanka! What are you planning?";
  }
}

function handleMessage({ text, sessionId, userName, tours = [], hotels = [] }) {
  const session = getSession(sessionId);
  if (userName) setUserName(session, userName);

  const nlu = understand(text);
  const { resolved: entities, usedContext } = resolveContext(session, nlu);
  const sentiment = nlu.sentiment || { label: 'neutral', escalate: false };

  if (sentiment.escalate && !session.escalated) {
    session.escalated = true;
    const handoffData = triggerAgentTransfer(session, 'negative_sentiment');
    pushTurn(session, { role: 'user', intent: nlu.intent, entities, sentiment, text });
    const reply = `${R.empathyPrefix(sentiment)}I want to make sure this gets sorted properly, so I'm flagging this conversation for our team to follow up directly.${R.escalationNote()}\n\nIn the meantime, is there anything I can help clarify right now?`;
    pushTurn(session, { role: 'assistant', intent: 'escalation', text: reply });
    const result = finalize(reply, 'escalation', 1, nlu, session);
    result.handoff = handoffData;
    return result;
  }

  if (nlu.intent === 'human_handoff') {
    session.escalated = true;
    const handoffData = triggerAgentTransfer(session, 'explicit_request');
    pushTurn(session, { role: 'user', intent: nlu.intent, entities, sentiment, text });
    const reply = 'Of course — I\'ve flagged this conversation for our team. Someone will pick this up as soon as possible. While you wait, feel free to keep asking me anything — I\'m still here.';
    pushTurn(session, { role: 'assistant', intent: 'escalation', text: reply });
    const result = finalize(reply, 'human_handoff', 1, nlu, session);
    result.handoff = handoffData;
    return result;
  }

  if (session.pendingSlots) {
    const completed = fillSlotsFromEntities(session, entities);
    if (completed && completed.missing.length === 0) {
      const reply = resolveIntent(completed.targetIntent, { ...entities, ...completed.slots }, nlu, session, { tours, hotels });
      pushTurn(session, { role: 'user', intent: nlu.intent, entities, sentiment, text });
      pushTurn(session, { role: 'assistant', intent: completed.targetIntent, text: reply });
      updateActiveContext(session, nlu, entities);
      return finalize(reply, completed.targetIntent, 1, nlu, session);
    } else {
      const reply = `Got it. ${R.askForDuration()}`;
      pushTurn(session, { role: 'user', intent: nlu.intent, entities, sentiment, text });
      pushTurn(session, { role: 'assistant', intent: 'itinerary_slot', text: reply });
      return finalize(reply, 'itinerary', 0.9, nlu, session);
    }
  }

  pushTurn(session, { role: 'user', intent: nlu.intent, entities, sentiment, text });
  session.consecutiveFallbacks = nlu.fallback ? session.consecutiveFallbacks + 1 : 0;

  let reply;
  if (nlu.fallback) {
    reply = "I'm not completely sure I understood. Could you explain what you're looking for, or ask about Sri Lankan destinations, itineraries, transport, or food?";
  } else {
    reply = resolveIntent(nlu.intent, entities, nlu, session, { tours, hotels });
  }

  pushTurn(session, { role: 'assistant', intent: nlu.intent, text: reply });
  updateActiveContext(session, nlu, entities);
  return finalize(reply, nlu.intent, nlu.confidence, nlu, session);
}

module.exports = {
  triggerAgentTransfer,
  buildActions,
  timeOfDayGreeting,
  handleMessage,
  resolveIntent
};