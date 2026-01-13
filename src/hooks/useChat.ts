import { useState, useEffect, useCallback, useRef } from 'react';
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
  const profilesCacheRef = useRef<Map<string, any>>(new Map());

  const fetchMessages = useCallback(async () => {
    if (!user || !workspaceId) return;

    setIsLoading(true);
    
    let query = supabase
      .from('messages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (recipientId) {
      query = query.or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`);
    } else {
      query = query.is('recipient_id', null);
    }

    const { data, error } = await query;

    if (!error && data) {
      const senderIds = [...new Set(data.map(m => m.sender_id))];
      const uncachedIds = senderIds.filter(id => !profilesCacheRef.current.has(id));
      
      if (uncachedIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, name, email, avatar_url')
          .in('user_id', uncachedIds);
        
        profilesData?.forEach(p => {
          profilesCacheRef.current.set(p.user_id, p);
        });
      }

      const formattedMessages = data.map(m => ({
        ...m,
        sender: profilesCacheRef.current.get(m.sender_id) || null
      })) as Message[];
      
      setMessages(formattedMessages);
    }
    setIsLoading(false);
  }, [user, workspaceId, recipientId]);

  useEffect(() => {
    fetchMessages();

    let debounceTimer: NodeJS.Timeout;
    const channel = supabase
      .channel(`messages-${workspaceId}-${recipientId || 'group'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `workspace_id=eq.${workspaceId}`
        },
        (payload) => {
          // Optimistic insert for new messages
          const newMsg = payload.new as Message;
          const profile = profilesCacheRef.current.get(newMsg.sender_id);
          
          // Check if this message is relevant to current view
          const isRelevant = recipientId 
            ? (newMsg.sender_id === user?.id && newMsg.recipient_id === recipientId) ||
              (newMsg.sender_id === recipientId && newMsg.recipient_id === user?.id)
            : newMsg.recipient_id === null;
          
          if (isRelevant) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, { ...newMsg, sender: profile }];
            });
          }
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, workspaceId, recipientId, user?.id]);

  const sendMessage = async (content: string, toRecipientId?: string | null) => {
    if (!user || !content.trim()) return { error: 'Invalid message' };

    const newMessage = {
      workspace_id: workspaceId,
      sender_id: user.id,
      recipient_id: toRecipientId || null,
      content: content.trim()
    };

    // Optimistic update
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      ...newMessage,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: profilesCacheRef.current.get(user.id)
    };
    
    setMessages(prev => [...prev, optimisticMessage]);

    const { data, error } = await supabase
      .from('messages')
      .insert(newMessage)
      .select()
      .single();

    if (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      return { error: error.message };
    }
    
    // Replace optimistic message with real one
    setMessages(prev => prev.map(m => 
      m.id === optimisticId ? { ...data, sender: optimisticMessage.sender } : m
    ));
    
    return { data };
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    }
    return { error: error?.message };
  };

  return {
    messages,
    isLoading,
    sendMessage,
    deleteMessage,
    refetch: fetchMessages
  };
}
