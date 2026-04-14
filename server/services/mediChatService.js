const AppError = require('../errors/AppError');
const mediChatRepository = require('../repositories/mediChatRepository');
const { buildMemoryContext, rebuildMemoryRecord } = require('./mediChatMemoryService');

const normalizeAttachment = (attachment = {}) => ({
  id: attachment.id || null,
  name: attachment.name || 'Attachment',
  size: attachment.size || 0,
  type: attachment.type || 'application/octet-stream',
  kind: attachment.kind || 'document',
  url: attachment.url || '',
  description: attachment.description || '',
  generated: Boolean(attachment.generated),
});

class MediChatService {
  normalizeMessage(message) {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.created_at || message.timestamp || new Date().toISOString(),
      usage: message.usage || null,
      isError: Boolean(message.is_error ?? message.isError),
      attachments: Array.isArray(message.attachments)
        ? message.attachments.map(normalizeAttachment)
        : [],
    };
  }

  normalizeConversation(conversation, messages = []) {
    return {
      id: conversation.id,
      title: conversation.title || 'Untitled conversation',
      createdAt: conversation.created_at || conversation.createdAt || new Date().toISOString(),
      updatedAt: conversation.updated_at || conversation.updatedAt || new Date().toISOString(),
      persisted: true,
      messages: messages.map((message) => this.normalizeMessage(message)),
    };
  }

  normalizeImportedMessage(message = {}) {
    const role = message.role === 'assistant' ? 'assistant' : 'user';
    const content = typeof message.content === 'string' ? message.content.trim() : '';

    if (!content) {
      return null;
    }

    return {
      role,
      content,
      attachments: Array.isArray(message.attachments)
        ? message.attachments.map(normalizeAttachment)
        : [],
      usage: message.usage || null,
      is_error: Boolean(message.is_error ?? message.isError),
      created_at: message.created_at || message.createdAt || message.timestamp || new Date().toISOString(),
    };
  }

  async listUserConversations(userId) {
    const conversations = await mediChatRepository.findConversationsWithMessagesByUser(userId);
    return conversations.map((item) =>
      this.normalizeConversation(item.conversation, item.messages)
    );
  }

  async getConversationHistoryForAi(userId, conversationId) {
    if (!conversationId) {
      return [];
    }

    const conversation = await mediChatRepository.findConversationWithMessagesByIdForUser(
      conversationId,
      userId
    );

    if (!conversation) {
      throw new AppError('MediChat conversation not found.', 404, {
        code: 'MEDICHAT_CONVERSATION_NOT_FOUND',
      });
    }

    return conversation.messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));
  }

  async resolveConversation(userId, conversationId, conversationTitle) {
    if (conversationId) {
      const existingConversation = await mediChatRepository.findConversationByIdForUser(
        conversationId,
        userId
      );

      if (!existingConversation) {
        throw new AppError('MediChat conversation not found.', 404, {
          code: 'MEDICHAT_CONVERSATION_NOT_FOUND',
        });
      }

      return existingConversation;
    }

    return mediChatRepository.createConversation({
      user_id: userId,
      title: conversationTitle || 'New conversation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  async rebuildUserMemory(user) {
    const conversations = await mediChatRepository.findConversationsWithMessagesByUser(user.id);
    const memoryRecord = rebuildMemoryRecord(user, conversations);

    if (!memoryRecord) {
      await mediChatRepository.deleteUserMemory(user.id);
      return null;
    }

    return mediChatRepository.upsertUserMemory(memoryRecord);
  }

  async getMemoryContext(user) {
    const memoryRecord = await mediChatRepository.getUserMemory(user.id);
    return buildMemoryContext(memoryRecord, user);
  }

  async saveConsultationExchange({
    user,
    conversationId,
    conversationTitle,
    userMessage,
    userAttachments = [],
    assistantMessage,
    assistantAttachments = [],
    usage = null,
    isError = false,
  }) {
    const resolvedConversation = await this.resolveConversation(
      user.id,
      conversationId,
      conversationTitle
    );
    const assistantTimestamp = new Date().toISOString();

    await mediChatRepository.updateConversation(resolvedConversation.id, user.id, {
      title: conversationTitle || resolvedConversation.title || 'New conversation',
      updated_at: assistantTimestamp,
    });

    await mediChatRepository.createMessages([
      {
        conversation_id: resolvedConversation.id,
        role: 'user',
        content: userMessage,
        attachments: userAttachments,
        usage: null,
        is_error: false,
        created_at: new Date().toISOString(),
      },
      {
        conversation_id: resolvedConversation.id,
        role: 'assistant',
        content: assistantMessage,
        attachments: assistantAttachments,
        usage,
        is_error: isError,
        created_at: assistantTimestamp,
      },
    ]);

    const savedConversation = await mediChatRepository.findConversationWithMessagesByIdForUser(
      resolvedConversation.id,
      user.id
    );

    await this.rebuildUserMemory(user);

    return this.normalizeConversation(savedConversation.conversation, savedConversation.messages);
  }

  async importConversations(user, conversations = []) {
    const importableConversations = Array.isArray(conversations) ? conversations : [];

    for (const conversation of importableConversations) {
      const importedMessages = Array.isArray(conversation.messages)
        ? conversation.messages
            .map((message) => this.normalizeImportedMessage(message))
            .filter(Boolean)
        : [];

      if (importedMessages.length === 0) {
        continue;
      }

      const createdAt =
        conversation.createdAt ||
        conversation.created_at ||
        importedMessages[0].created_at ||
        new Date().toISOString();
      const updatedAt =
        conversation.updatedAt ||
        conversation.updated_at ||
        importedMessages.at(-1)?.created_at ||
        createdAt;

      const savedConversation = await mediChatRepository.createConversation({
        user_id: user.id,
        title: conversation.title || 'Imported conversation',
        created_at: createdAt,
        updated_at: updatedAt,
      });

      await mediChatRepository.createMessages(
        importedMessages.map((message) => ({
          conversation_id: savedConversation.id,
          role: message.role,
          content: message.content,
          attachments: message.attachments,
          usage: message.usage,
          is_error: message.is_error,
          created_at: message.created_at,
        }))
      );
    }

    await this.rebuildUserMemory(user);
    return this.listUserConversations(user.id);
  }

  async deleteConversation(user, conversationId) {
    const deletedConversation = await mediChatRepository.deleteConversation(conversationId, user.id);

    if (!deletedConversation) {
      throw new AppError('MediChat conversation not found.', 404, {
        code: 'MEDICHAT_CONVERSATION_NOT_FOUND',
      });
    }

    await this.rebuildUserMemory(user);
  }
}

module.exports = new MediChatService();
