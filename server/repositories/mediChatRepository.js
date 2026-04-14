const { supabase } = require('../config/supabaseClient');

class MediChatRepository {
  async createConversation(conversationData) {
    const { data, error } = await supabase
      .from('medichat_conversations')
      .insert([conversationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateConversation(conversationId, userId, updates) {
    const { data, error } = await supabase
      .from('medichat_conversations')
      .update(updates)
      .eq('id', conversationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findConversationByIdForUser(conversationId, userId) {
    const { data, error } = await supabase
      .from('medichat_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findConversationsByUser(userId) {
    const { data, error } = await supabase
      .from('medichat_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findMessagesByConversationIds(conversationIds = []) {
    const uniqueConversationIds = [...new Set(conversationIds.filter(Boolean))];

    if (uniqueConversationIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('medichat_messages')
      .select('*')
      .in('conversation_id', uniqueConversationIds)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async findConversationWithMessagesByIdForUser(conversationId, userId) {
    const conversation = await this.findConversationByIdForUser(conversationId, userId);

    if (!conversation) {
      return null;
    }

    const messages = await this.findMessagesByConversationIds([conversationId]);

    return {
      conversation,
      messages,
    };
  }

  async findConversationsWithMessagesByUser(userId) {
    const conversations = await this.findConversationsByUser(userId);
    const messages = await this.findMessagesByConversationIds(
      conversations.map((conversation) => conversation.id)
    );
    const messagesByConversation = messages.reduce((accumulator, message) => {
      const currentMessages = accumulator.get(message.conversation_id) || [];
      currentMessages.push(message);
      accumulator.set(message.conversation_id, currentMessages);
      return accumulator;
    }, new Map());

    return conversations.map((conversation) => ({
      conversation,
      messages: messagesByConversation.get(conversation.id) || [],
    }));
  }

  async createMessages(messages = []) {
    if (!Array.isArray(messages) || messages.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('medichat_messages')
      .insert(messages)
      .select('*');

    if (error) throw error;
    return data;
  }

  async deleteConversation(conversationId, userId) {
    const { data, error } = await supabase
      .from('medichat_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId)
      .select('id')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getUserMemory(userId) {
    const { data, error } = await supabase
      .from('ai_user_memories')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async upsertUserMemory(memoryData) {
    const { data, error } = await supabase
      .from('ai_user_memories')
      .upsert([memoryData], { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async deleteUserMemory(userId) {
    const { error } = await supabase
      .from('ai_user_memories')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
}

module.exports = new MediChatRepository();
