import { supabase } from './supabaseClient';

/**
 * Analytics Service for Botanica-AI
 * Tracks user interactions and app usage for Beta Launch metrics
 * 
 * Events are stored in botanica_analytics table (created via migration)
 */

export type AnalyticsEvent =
  // Onboarding & Auth
  | 'user_signup'
  | 'user_login'
  | 'user_logout'
  // Garden Management
  | 'plant_added'
  | 'plant_removed'
  | 'plant_viewed'
  | 'plant_photo_changed'
  // Tasks
  | 'task_completed'
  | 'task_viewed'
  // Care Plan
  | 'care_plan_viewed'
  | 'care_plan_regenerated'
  | 'care_plan_cache_used'
  // Chat AI
  | 'chat_message_sent'
  | 'chat_photo_uploaded'
  | 'chat_response_received'
  // Notes
  | 'note_added'
  | 'note_saved'
  // Navigation
  | 'screen_view'
  | 'calendar_viewed'
  // Settings
  | 'language_changed'
  // Beta specific
  | 'beta_feedback_submitted';

export interface AnalyticsPayload {
  event: AnalyticsEvent;
  user_id?: string;
  properties?: Record<string, any>;
  timestamp?: string;
  session_id?: string;
}

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('botanica_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('botanica_session_id', sessionId);
  }
  return sessionId;
};

// Get current user ID from Supabase auth
const getCurrentUserId = async (): Promise<string | undefined> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};

/**
 * Track an analytics event
 * Sends to Supabase botanica_analytics table
 * Falls back to console in development or on error
 */
export const trackEvent = async (
  event: AnalyticsEvent,
  properties?: Record<string, any>
): Promise<void> => {
  const payload: AnalyticsPayload = {
    event,
    user_id: await getCurrentUserId(),
    properties: {
      ...properties,
      url: window.location.href,
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
    },
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
  };

  // In development, log to console
  if (import.meta.env.DEV) {
    console.log('[Analytics]', payload);
  }

  // Send to Supabase
  try {
    const { error } = await supabase
      .from('botanica_analytics')
      .insert(payload);

    if (error) {
      console.warn('Analytics tracking failed:', error);
    }
  } catch (err) {
    // Silently fail - analytics should not break the app
    console.warn('Analytics error:', err);
  }
};

/**
 * Track screen/page views
 */
export const trackScreenView = (screenName: string, properties?: Record<string, any>): void => {
  trackEvent('screen_view', { screen: screenName, ...properties });
};

/**
 * Track plant-related actions
 */
export const trackPlantAction = (
  action: 'added' | 'removed' | 'viewed' | 'photo_changed',
  plantId: string,
  plantName?: string
): void => {
  const eventMap: Record<typeof action, AnalyticsEvent> = {
    added: 'plant_added',
    removed: 'plant_removed',
    viewed: 'plant_viewed',
    photo_changed: 'plant_photo_changed',
  };
  trackEvent(eventMap[action], { plant_id: plantId, plant_name: plantName });
};

/**
 * Track task completion
 */
export const trackTaskComplete = (taskId: string, taskName: string, plantName?: string): void => {
  trackEvent('task_completed', { task_id: taskId, task_name: taskName, plant_name: plantName });
};

/**
 * Track chat interactions
 */
export const trackChatMessage = (hasPhoto: boolean = false): void => {
  trackEvent('chat_message_sent', { has_photo: hasPhoto });
  if (hasPhoto) {
    trackEvent('chat_photo_uploaded');
  }
};

/**
 * Initialize analytics on app start
 * Tracks session start and captures initial referrer
 */
export const initAnalytics = (): void => {
  const sessionId = getSessionId();
  
  // Track app open / session start
  trackEvent('screen_view', {
    screen: 'app_init',
    referrer: document.referrer || 'direct',
    session_id: sessionId,
  });
};

export default {
  trackEvent,
  trackScreenView,
  trackPlantAction,
  trackTaskComplete,
  trackChatMessage,
  initAnalytics,
};
