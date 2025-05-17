// For src/modules/battle/multi-player/hooks/useMatchmaking.tsx - update the Supabase subscription

// Line ~180 - Replace with
const channel = supabase.channel('matchmaking');
    
channel.on('postgres_changes', { 
  event: 'INSERT', 
  schema: 'public', 
  table: 'battle_sessions'
}, payload => {
  if (payload.new && isUserInSession(payload.new)) {
    handleMatchCreated(payload.new);
  }
});

channel.subscribe();
