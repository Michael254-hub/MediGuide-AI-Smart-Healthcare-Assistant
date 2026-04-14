const {
  buildMemoryContext,
  rebuildMemoryRecord,
} = require('../services/mediChatMemoryService');

describe('MediChat memory service', () => {
  it('should build personalized memory from recent user MediChat history', () => {
    const user = { id: 'user-123', role: 'medical_professional' };
    const memoryRecord = rebuildMemoryRecord(user, [
      {
        messages: [
          {
            role: 'user',
            content:
              'Please explain asthma triggers in simple language and compare inhalers for quick reference.',
            attachments: [],
          },
          {
            role: 'assistant',
            content: 'Assistant reply',
          },
          {
            role: 'user',
            content: 'Walk me through the steps and keep it brief.',
            attachments: [{ name: 'spirometry.pdf', type: 'application/pdf' }],
          },
        ],
      },
    ]);

    expect(memoryRecord).toMatchObject({
      user_id: 'user-123',
      role: 'medical_professional',
    });
    expect(memoryRecord.preferences.communicationStyle).toEqual(
      expect.arrayContaining(['simple-language', 'concise', 'step-by-step', 'comparison-focused'])
    );
    expect(memoryRecord.preferences.prefersAttachments).toBe(true);
    expect(memoryRecord.recent_topics).toEqual(
      expect.arrayContaining(['asthma', 'inhalers'])
    );
    expect(memoryRecord.memory_summary).toContain('User role: medical_professional.');
  });

  it('should return null when there is no user-authored MediChat history', () => {
    const memoryRecord = rebuildMemoryRecord(
      { id: 'user-456', role: 'admin' },
      [
        {
          messages: [
            {
              role: 'assistant',
              content: 'No user messages yet.',
            },
          ],
        },
      ]
    );

    expect(memoryRecord).toBeNull();
  });

  it('should format stored memory as reusable AI context', () => {
    const context = buildMemoryContext(
      {
        role: 'patient',
        memory_summary: 'User role: patient. Recent MediChat topics: migraine, nausea.',
        preferences: {
          communicationStyle: ['simple-language', 'concise'],
        },
        recent_topics: ['migraine', 'nausea'],
      },
      { role: 'patient' }
    );

    expect(context).toContain('PERSONALIZED MEDICHAT MEMORY:');
    expect(context).toContain('Preferred communication style: simple-language, concise');
    expect(context).toContain('Recent topics: migraine, nausea');
  });
});
