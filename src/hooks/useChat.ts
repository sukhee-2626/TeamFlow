import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Message {
  id: string;
  workspace_id: string;
  sender_id: string;
  recipient_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  sender?: {
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export function useChat(workspaceId: string, recipientId?: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user || !workspaceId) return;

    setIsLoading(true);
    
    let query = supabase
      .from('messages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    // Filter by recipient for DMs or null for group chat
    if (recipientId) {
      // DM: get messages between current user and recipient
      query = query.or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`);
    } else {
      // Group chat: get messages with no recipient
      query = query.is('recipient_id', null);
    }

    const { data, error } = await query;

    if (!error && data) {
      // Fetch sender profiles
      const senderIds = [...new Set(data.map(m => m.sender_id))];
      let profiles: any[] = [];
      
      if (senderIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, name, email, avatar_url')
          .in('user_id', senderIds);
        profiles = profilesData || [];
      }

      const formattedMessages = data.map(m => ({
        ...m,
        sender: profiles.find(p => p.user_id === m.sender_id) || null
      })) as Message[];
      
      setMessages(formattedMessages);
    }
    setIsLoading(false);
  }, [user, workspaceId, recipientId]);

  useEffect(() => {
    fetchMessages();

    // Set up realtime subscription
    const channel = supabase
      .channel(`messages-${workspaceId}-${recipientId || 'group'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `workspace_id=eq.${workspaceId}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, workspaceId, recipientId]);

  const sendMessage = async (content: string, toRecipientId?: string | null) => {
    if (!user || !content.trim()) return { error: 'Invalid message' };

    const { data, error } = await supabase
      .from('messages')
      .insert({
        workspace_id: workspaceId,
        sender_id: user.id,
        recipient_id: toRecipientId || null,
        content: content.trim()
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { data };
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) return { error: error.message };
    return {};
  };

  return {
    messages,
    isLoading,
    sendMessage,
    deleteMessage,
    refetch: fetchMessages
  };
}
