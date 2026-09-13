const sessions = {};

module.exports = {
    getSession: (sessionId) => {
        if (!sessions[sessionId]) {
            sessions[sessionId] = { 
                history: [], 
                activeContext: {}, 
                pendingSlots: null, 
                escalated: false, 
                consecutiveFallbacks: 0, 
                userName: null 
            };
        }
        return sessions[sessionId];
    },
    pushTurn: (session, turn) => {
        if (session && session.history) {
            session.history.push(turn);
        }
    },
    startSlotFilling: (session, targetIntent, missing) => {
        if (session) {
            session.pendingSlots = { targetIntent, missing, slots: {} };
        }
    },
    fillSlotsFromEntities: (session, entities) => {
        if (!session || !session.pendingSlots) return null;
        session.pendingSlots.missing = session.pendingSlots.missing.filter(slot => {
            if (entities && entities[slot]) {
                session.pendingSlots.slots[slot] = entities[slot];
                return false;
            }
            return true;
        });
        const result = { ...session.pendingSlots };
        if (session.pendingSlots.missing.length === 0) {
            session.pendingSlots = null;
        }
        return result;
    },
    resolveContext: (session, nlu) => {
        const resolved = { ...(session?.activeContext || {}), ...(nlu?.entities || {}) };
        const usedContext = Object.keys(session?.activeContext || {}).some(k => !nlu?.entities || !nlu.entities[k]);
        return { resolved, usedContext };
    },
    updateActiveContext: (session, nlu, entities) => {
        if (session) {
            session.activeContext = { ...(session.activeContext || {}), ...(entities || {}) };
        }
    },
    setUserName: (session, name) => {
        if (session) {
            session.userName = name;
        }
    }
};
