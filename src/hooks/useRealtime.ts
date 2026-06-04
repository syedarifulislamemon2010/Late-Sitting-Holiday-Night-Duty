import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize Supabase client if environment variables are configured.
// Provides a safe fallback to prevent crashes on startup.
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Custom React hook to listen for real-time changes in a Supabase table.
 * 
 * @param table Table name to subscribe to (e.g. 'duties', 'chats')
 * @param callback Callback function executed when changes occur
 * @param event Event type filter ('INSERT', 'UPDATE', 'DELETE', or '*' for all)
 */
export function useRealtime(
  table: string,
  callback: (payload: any) => void,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
) {
  useEffect(() => {
    if (!supabase) {
      console.warn(`Supabase credentials missing. Skipped real-time subscription for '${table}'.`);
      return;
    }

    // Create channel subscription
    const channel = supabase
      .channel(`realtime-channel-${table}`)
      .on(
        'postgres_changes',
        {
          event: event,
          schema: 'public',
          table: table
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to real-time changes on table: ${table}`);
        }
      });

    // Unsubscribe on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, callback, event]);
}
