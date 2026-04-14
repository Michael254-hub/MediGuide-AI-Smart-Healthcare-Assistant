const TOPIC_STOP_WORDS = new Set([
  'about',
  'again',
  'also',
  'amplify',
  'another',
  'anything',
  'around',
  'because',
  'being',
  'between',
  'could',
  'detail',
  'doctor',
  'educational',
  'explain',
  'explained',
  'general',
  'health',
  'hello',
  'history',
  'information',
  'like',
  'medical',
  'medichat',
  'mediguide',
  'message',
  'more',
  'please',
  'question',
  'really',
  'review',
  'should',
  'since',
  'something',
  'summary',
  'symptom',
  'symptoms',
  'their',
  'these',
  'thing',
  'understand',
  'user',
  'want',
  'what',
  'when',
  'where',
  'which',
  'with',
  'would',
]);

const truncateText = (value, maxLength = 220) => {
  if (!value) {
    return '';
  }

  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
};

const normalizeWords = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const extractRecentTopics = (messages = []) => {
  const topicCounts = new Map();

  messages.forEach((message) => {
    normalizeWords(message.content).forEach((word) => {
      if (
        word.length < 4 ||
        TOPIC_STOP_WORDS.has(word) ||
        /^\d+$/.test(word)
      ) {
        return;
      }

      topicCounts.set(word, (topicCounts.get(word) || 0) + 1);
    });
  });

  return [...topicCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([topic]) => topic);
};

const determineCommunicationStyle = (messages = []) => {
  const joinedMessages = messages.map((message) => String(message.content || '').toLowerCase()).join(' ');
  const styles = [];

  if (
    joinedMessages.includes('simple') ||
    joinedMessages.includes('plain language') ||
    joinedMessages.includes('easy to understand')
  ) {
    styles.push('simple-language');
  }

  if (
    joinedMessages.includes('brief') ||
    joinedMessages.includes('short') ||
    joinedMessages.includes('quick summary')
  ) {
    styles.push('concise');
  }

  if (
    joinedMessages.includes('step by step') ||
    joinedMessages.includes('steps') ||
    joinedMessages.includes('walk me through')
  ) {
    styles.push('step-by-step');
  }

  if (
    joinedMessages.includes('compare') ||
    joinedMessages.includes('difference between')
  ) {
    styles.push('comparison-focused');
  }

  return styles.length > 0 ? styles : ['standard'];
};

const determineAttachmentPreference = (messages = []) =>
  messages.some((message) => Array.isArray(message.attachments) && message.attachments.length > 0);

const buildMemorySummary = (user, recentTopics = [], preferences = {}, messages = []) => {
  const userRole = user?.role || 'patient';

  if (messages.length === 0) {
    return `No prior MediChat memory has been stored yet for this ${userRole}.`;
  }

  const summaryParts = [`User role: ${userRole}.`];

  if (recentTopics.length > 0) {
    summaryParts.push(`Recent MediChat topics: ${recentTopics.join(', ')}.`);
  }

  if (Array.isArray(preferences.communicationStyle) && preferences.communicationStyle.length > 0) {
    summaryParts.push(
      `Preferred response style: ${preferences.communicationStyle.join(', ')}.`
    );
  }

  if (preferences.prefersAttachments) {
    summaryParts.push('The user often shares attachments for extra context.');
  }

  const latestQuestion = messages.at(-1)?.content;
  if (latestQuestion) {
    summaryParts.push(`Most recent user request: ${truncateText(latestQuestion, 140)}`);
  }

  return summaryParts.join(' ');
};

const rebuildMemoryRecord = (user, conversations = []) => {
  const userMessages = conversations
    .flatMap((conversation) => conversation.messages || [])
    .filter((message) => message.role === 'user')
    .slice(-20);

  if (userMessages.length === 0) {
    return null;
  }

  const recentTopics = extractRecentTopics(userMessages);
  const preferences = {
    communicationStyle: determineCommunicationStyle(userMessages),
    prefersAttachments: determineAttachmentPreference(userMessages),
  };

  return {
    user_id: user.id,
    role: user.role || 'patient',
    memory_summary: buildMemorySummary(user, recentTopics, preferences, userMessages),
    preferences,
    recent_topics: recentTopics,
    updated_at: new Date().toISOString(),
  };
};

const buildMemoryContext = (memoryRecord, user) => {
  if (!memoryRecord) {
    return `PERSONALIZED MEDICHAT MEMORY:\n- User role: ${user?.role || 'patient'}\n- No prior MediChat memory is stored yet.`;
  }

  const communicationStyle = Array.isArray(memoryRecord.preferences?.communicationStyle)
    ? memoryRecord.preferences.communicationStyle.join(', ')
    : 'standard';
  const recentTopics =
    Array.isArray(memoryRecord.recent_topics) && memoryRecord.recent_topics.length > 0
      ? memoryRecord.recent_topics.join(', ')
      : 'none stored yet';

  return `PERSONALIZED MEDICHAT MEMORY:
- User role: ${memoryRecord.role || user?.role || 'patient'}
- Memory summary: ${memoryRecord.memory_summary}
- Preferred communication style: ${communicationStyle}
- Recent topics: ${recentTopics}
- Use this only to improve continuity and tone. Do not treat memory as verified current medical fact unless confirmed in the latest request.`;
};

module.exports = {
  buildMemoryContext,
  rebuildMemoryRecord,
};
