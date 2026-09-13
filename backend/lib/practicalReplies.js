const { PRACTICAL } = require('./knowledgeBase');

function replyVisa() {
  return `**Visa / ETA for Sri Lanka**\n\n${PRACTICAL?.visa?.overview || ''}\n\n• **Cost:** ${PRACTICAL?.visa?.cost || ''}\n• **Free visa countries:** ${PRACTICAL?.visa?.freeVisa || ''}\n• **Duration:** 30 days (extendable to 90)\n• **Extension:** ${PRACTICAL?.visa?.extension || ''}\n\nApply before you travel rather than at the airport — it only takes an hour or so online, but it's one less thing to worry about on arrival.`;
}

function replySafety(sentiment) {
  const intro = sentiment && (sentiment.label === 'negative' || sentiment.label === 'very_negative')
    ? "Let's get you the right information. "
    : '';
  return `${intro}**Safety in Sri Lanka**\n\n${PRACTICAL?.safety?.overall || ''}\n\n**Common scams to watch for:**\n${(PRACTICAL?.safety?.scams || []).map(s => `• ${s}`).join('\n')}\n\n**Beaches:** ${PRACTICAL?.safety?.beaches || ''}\n**Wildlife:** ${PRACTICAL?.safety?.wildlife || ''}\n\n**Emergency numbers:** Police 119 · Ambulance 110 · Tourist Police 1912`;
}

function replyHealth() {
  return `**Health while travelling**\n\n**Vaccinations:** ${PRACTICAL?.health?.vaccinations || ''}\n**Water:** ${PRACTICAL?.health?.water || ''}\n**Mosquitoes:** ${PRACTICAL?.health?.mosquitoes || ''}\n**Heat:** ${PRACTICAL?.health?.heat || ''}\n**Medical care:** ${PRACTICAL?.health?.medicalCare || ''}\n**Emergency:** ${PRACTICAL?.health?.emergency || ''}`;
}

function replyConnectivity() {
  return `**SIM cards & internet**\n\n${PRACTICAL?.connectivity?.sim || ''}\n\n**Networks:** ${PRACTICAL?.connectivity?.networks || ''}\n**WiFi:** ${PRACTICAL?.connectivity?.wifi || ''}\n\nGrab your SIM right at the arrivals hall in Colombo (Bandaranaike) — takes about 5 minutes and saves the hassle later.`;
}

function replyElectricity() {
  return `**Electricity**\n\n• **Voltage:** ${PRACTICAL?.electricity?.voltage || ''}\n• **Plug type:** ${PRACTICAL?.electricity?.plugs || ''}\n• **Note:** ${PRACTICAL?.electricity?.note || ''}\n\nUK travellers need no adapter; everyone else should bring a universal one.`;
}

function replyCulture() {
  return `**Culture & etiquette**\n\n**At religious sites:**\n${(PRACTICAL?.culture?.templeEtiquette || []).map(t => `• ${t}`).join('\n')}\n\n**Greeting:** "${PRACTICAL?.culture?.greetings || ''}"\n**Bargaining:** ${PRACTICAL?.culture?.bargaining || ''}\n**Photography:** ${PRACTICAL?.culture?.photography || ''}\n**Languages:** ${PRACTICAL?.culture?.language || ''}`;
}

function replyShopping() {
  return `**Shopping**\n\n**Worth buying:**\n${(PRACTICAL?.shopping?.what || []).map(w => `• ${w}`).join('\n')}\n\n**Where:** ${PRACTICAL?.shopping?.where || ''}\n\nBe careful of: ${PRACTICAL?.shopping?.avoid || ''}`;
}

function replyRegionOverview() {
  return `**Sri Lanka's regions**\n\n**Western** — Colombo, Negombo, Bentota\n**Central** — Kandy, Nuwara Eliya, Horton Plains\n**Uva** — Ella, Haputale, Bandarawela\n**North Central** — Sigiriya, Anuradhapura, Polonnaruwa, Dambulla\n**Southern** — Galle, Mirissa, Unawatuna, Yala\n**Eastern** — Trincomalee, Arugam Bay, Passikudah\n**Northern** — Jaffna, Mannar\n**North Western** — Wilpattu, Kalpitiya\n**Sabaragamuwa** — Ratnapura, Sinharaja, Adam's Peak\n\nWhich region catches your eye?`;
}

module.exports = {
  replyVisa,
  replySafety,
  replyHealth,
  replyConnectivity,
  replyElectricity,
  replyCulture,
  replyShopping,
  replyRegionOverview
};