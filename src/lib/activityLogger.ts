import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'agrotrust_guest_session_id';

const createSessionId = () => {
  const random = Math.random().toString(36).slice(2, 10);
  return `sess_${Date.now()}_${random}`;
};

export const getGuestSessionId = () => {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const generated = createSessionId();
  localStorage.setItem(SESSION_KEY, generated);
  return generated;
};

export const logActivity = async (eventName: string, payload: { productId?: string; state?: string; metadata?: Record<string, unknown> } = {}) => {
  try {
    const sessionId = getGuestSessionId();
    const userAgent = navigator.userAgent;
    const referrer = document.referrer || null;

    await supabase.from('session_logs' as never).upsert({
      session_id: sessionId,
      user_agent: userAgent,
      referrer,
      last_seen_at: new Date().toISOString(),
    } as never, { onConflict: 'session_id' });

    await supabase.from('activity_logs' as never).insert({
      session_id: sessionId,
      event_name: eventName,
      product_id: payload.productId || null,
      state: payload.state || null,
      metadata: payload.metadata || {},
    } as never);
  } catch (error) {
    console.debug('Activity logging skipped:', error);
  }
};
