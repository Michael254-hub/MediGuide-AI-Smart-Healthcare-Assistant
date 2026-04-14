/**
 * MediChat Controller
 * Handles all endpoints for the MediChat health education experience
 */

const {
  generateMockPatientData,
  mergeProfileIntoClinicalData,
  buildClinicalContext,
} = require('../services/clinicalDataService');
const {
  consultWithAI,
  generateSuggestions,
  DEFAULT_SUGGESTIONS,
} = require('../services/aiConsultationService');
const patientProfileService = require('../services/patientProfileService');
const mediChatService = require('../services/mediChatService');
const triageService = require('../services/triageService');
const { getRequestContext } = require('../utils/requestContext');
const DEFAULT_ATTACHMENT_PROMPT =
  'Please review the attached materials and provide general educational health information, key safety considerations, and when someone should seek professional care.';

const getClinicalDataForUser = async (user, req, auditAction = 'READ') => {
  const baseClinicalData = generateMockPatientData(user.id);
  const profile = await patientProfileService.getProfile(user, getRequestContext(req), {
    auditAction,
    resourceType: 'cdss_profile_bundle',
  });

  return mergeProfileIntoClinicalData(baseClinicalData, user, profile);
};

const parseConversationHistory = (rawHistory) => {
  if (!rawHistory) {
    return [];
  }

  let parsedHistory = rawHistory;

  if (typeof rawHistory === 'string') {
    try {
      parsedHistory = JSON.parse(rawHistory);
    } catch (error) {
      return [];
    }
  }

  if (!Array.isArray(parsedHistory)) {
    return [];
  }

  return parsedHistory
    .filter(
      (message) =>
        message &&
        typeof message.role === 'string' &&
        typeof message.content === 'string' &&
        message.content.trim()
    )
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));
};

const buildAttachmentPayload = (files = []) =>
  files.map((file) => ({
    name: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    data: file.buffer.toString('base64'),
  }));

const inferAttachmentKind = (mimeType = '') => {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }

  return 'document';
};

const buildStoredUserAttachments = (files = []) =>
  files.map((file) => ({
    name: file.originalname,
    size: file.size,
    type: file.mimetype,
    kind: inferAttachmentKind(file.mimetype),
    description: 'Original upload reviewed in this MediChat exchange.',
    url: '',
    generated: false,
  }));

const buildStoredAssistantAttachments = (artifacts = []) =>
  Array.isArray(artifacts)
    ? artifacts.map((artifact) => ({
        id: artifact.id,
        name: artifact.name,
        size: artifact.size,
        type: artifact.type,
        kind: artifact.kind,
        description: artifact.description || '',
        url: artifact.url || '',
        generated: Boolean(artifact.generated),
      }))
    : [];

const normalizeQuestion = (rawQuestion, attachments) => {
  const trimmedQuestion =
    typeof rawQuestion === 'string' ? rawQuestion.trim() : '';

  if (trimmedQuestion) {
    return trimmedQuestion;
  }

  if (attachments.length > 0) {
    return DEFAULT_ATTACHMENT_PROMPT;
  }

  return '';
};

const truncateText = (value, maxLength = 255) => {
  if (!value) {
    return '';
  }

  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
};

const buildAssessmentHistoryContext = async (userId) => {
  const history = await triageService.getUserHistory(userId);

  if (!Array.isArray(history) || history.length === 0) {
    return '';
  }

  return `RECENT ASSESSMENT HISTORY:
${history
  .slice(0, 3)
  .map((record) => {
    const symptoms = record.submission?.symptoms || 'No symptoms recorded';
    const riskLevel = record.triageLog?.riskLevel || record.triageLog?.risk_level || 'UNKNOWN';
    return `- ${truncateText(symptoms, 120)} (Risk: ${riskLevel})`;
  })
  .join('\n')}
- Use this only as prior context. Do not assume previous symptoms are still active unless the current request confirms them.`;
};

const buildMediChatContext = async (user, req) => {
  const patientData = await getClinicalDataForUser(user, req);
  const clinicalContext = buildClinicalContext(patientData);
  const assessmentHistoryContext = await buildAssessmentHistoryContext(user.id);
  const personalizedMemoryContext = await mediChatService.getMemoryContext(user);

  return {
    patientData,
    clinicalContext: [clinicalContext, assessmentHistoryContext, personalizedMemoryContext]
      .filter(Boolean)
      .join('\n\n'),
  };
};

const getConversationHistory = async (req, res, next) => {
  try {
    const conversations = await mediChatService.listUserConversations(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        conversations,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteConversationHistory = async (req, res, next) => {
  try {
    await mediChatService.deleteConversation(req.user, req.params.conversationId);

    res.status(200).json({
      success: true,
      message: 'MediChat conversation deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const importConversationHistory = async (req, res, next) => {
  try {
    const conversations = await mediChatService.importConversations(
      req.user,
      req.body?.conversations
    );

    res.status(201).json({
      success: true,
      data: {
        conversations,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/medichat/patient-data
 * Retrieve patient context used by MediChat
 */
const getPatientData = async (req, res, next) => {
  try {
    const patientData = await getClinicalDataForUser(req.user, req);
    
    res.status(200).json({
      success: true,
      data: patientData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/medichat/consult
 * Get a MediChat response based on patient context and the user's request
 */
const getAIConsultation = async (req, res, next) => {
  try {
    const attachments = buildAttachmentPayload(req.files);
    const fallbackConversationHistory = parseConversationHistory(req.body.conversationHistory);
    const conversationId =
      typeof req.body.conversationId === 'string' && req.body.conversationId.trim()
        ? req.body.conversationId.trim()
        : '';
    const conversationTitle =
      typeof req.body.conversationTitle === 'string' && req.body.conversationTitle.trim()
        ? truncateText(req.body.conversationTitle.trim())
        : 'New conversation';
    const conversationHistory = conversationId
      ? await mediChatService.getConversationHistoryForAi(req.user.id, conversationId)
      : fallbackConversationHistory;
    const question = normalizeQuestion(req.body.question, attachments);

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'A text prompt or at least one attachment is required'
      });
    }

    const { clinicalContext } = await buildMediChatContext(req.user, req);

    // Get MediChat response
    const consultation = await consultWithAI(
      clinicalContext,
      question,
      conversationHistory,
      attachments
    );

    if (!consultation.success) {
      const failedConversation = await mediChatService.saveConsultationExchange({
        user: req.user,
        conversationId,
        conversationTitle,
        userMessage: question,
        userAttachments: buildStoredUserAttachments(req.files || []),
        assistantMessage:
          consultation.error || 'MediChat could not generate a response for that request.',
        assistantAttachments: [],
        usage: consultation.usage,
        isError: true,
      });

      return res.status(500).json({
        success: false,
        message: consultation.error || 'Failed to generate consultation',
        data: {
          conversation: failedConversation,
        },
      });
    }

    const conversation = await mediChatService.saveConsultationExchange({
      user: req.user,
      conversationId,
      conversationTitle,
      userMessage: question,
      userAttachments: buildStoredUserAttachments(req.files || []),
      assistantMessage: consultation.response,
      assistantAttachments: buildStoredAssistantAttachments(consultation.artifacts),
      usage: consultation.usage,
      isError: false,
    });

    res.status(200).json({
      success: true,
      data: {
        consultation: consultation.response,
        artifacts: consultation.artifacts || [],
        conversation,
        usage: consultation.usage,
        attachmentsProcessed: attachments.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/medichat/consult-stream
 * Streaming version of the MediChat response for real-time delivery
 */
const getAIConsultationStream = async (req, res, next) => {
  try {
    const attachments = buildAttachmentPayload(req.files);
    const fallbackConversationHistory = parseConversationHistory(req.body.conversationHistory);
    const conversationId =
      typeof req.body.conversationId === 'string' && req.body.conversationId.trim()
        ? req.body.conversationId.trim()
        : '';
    const conversationTitle =
      typeof req.body.conversationTitle === 'string' && req.body.conversationTitle.trim()
        ? truncateText(req.body.conversationTitle.trim())
        : 'New conversation';
    const conversationHistory = conversationId
      ? await mediChatService.getConversationHistoryForAi(req.user.id, conversationId)
      : fallbackConversationHistory;
    const question = normalizeQuestion(req.body.question, attachments);

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'A text prompt or at least one attachment is required'
      });
    }

    // Set streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const { clinicalContext } = await buildMediChatContext(req.user, req);

    // Import streaming service
    const { consultWithAIStream } = require('../services/aiConsultationService');

    const stream = await consultWithAIStream(
      clinicalContext,
      question,
      conversationHistory,
      attachments
    );

    let fullResponse = '';

    stream.on('text', (text) => {
      fullResponse += text;
      res.write(`data: ${JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text } })}\n\n`);
    });

    stream.on('end', async () => {
      try {
        if (fullResponse.trim()) {
          await mediChatService.saveConsultationExchange({
            user: req.user,
            conversationId,
            conversationTitle,
            userMessage: question,
            userAttachments: buildStoredUserAttachments(req.files || []),
            assistantMessage: fullResponse,
            assistantAttachments: [],
            usage: null,
            isError: false,
          });
        }
      } catch (persistError) {
        console.error('Failed to persist streamed MediChat exchange:', persistError);
      }

      res.write(`data: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
      res.end();
    });

    stream.on('error', async (error) => {
      console.error('Stream error:', error);
      try {
        await mediChatService.saveConsultationExchange({
          user: req.user,
          conversationId,
          conversationTitle,
          userMessage: question,
          userAttachments: buildStoredUserAttachments(req.files || []),
          assistantMessage:
            error.message || 'MediChat could not process that streamed request.',
          assistantAttachments: [],
          usage: null,
          isError: true,
        });
      } catch (persistError) {
        console.error('Failed to persist streamed MediChat error:', persistError);
      }
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    });
  } catch (error) {
    console.error('Stream setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup streaming'
    });
  }
};

/**
 * GET /api/v1/medichat/suggestions
 * Get AI-suggested MediChat prompts based on patient context
 */
const getSuggestions = async (req, res, next) => {
  try {
    const { clinicalContext } = await buildMediChatContext(req.user, req);

    // Generate MediChat suggestions
    const suggestionsResult = await generateSuggestions(clinicalContext);

    res.status(200).json({
      success: true,
      data: {
        suggestions:
          Array.isArray(suggestionsResult.suggestions) &&
          suggestionsResult.suggestions.length > 0
            ? suggestionsResult.suggestions
            : DEFAULT_SUGGESTIONS
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/medichat/differential-diagnosis
 * Get differential diagnoses from patient data
 */
const getDifferentialDiagnosis = async (req, res, next) => {
  try {
    const patientData = await getClinicalDataForUser(req.user, req);
    const { differentialDiagnoses } = patientData;

    res.status(200).json({
      success: true,
      data: {
        diagnoses: differentialDiagnoses
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/medichat/medications
 * Get current medications with interaction alerts
 */
const getMedications = async (req, res, next) => {
  try {
    const patientData = await getClinicalDataForUser(req.user, req);
    const { medications } = patientData;

    res.status(200).json({
      success: true,
      data: {
        medications
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/medichat/labs
 * Get lab results with reference ranges and trends
 */
const getLabResults = async (req, res, next) => {
  try {
    const patientData = await getClinicalDataForUser(req.user, req);
    const { labResults } = patientData;

    res.status(200).json({
      success: true,
      data: {
        results: labResults
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatientData,
  getAIConsultation,
  getAIConsultationStream,
  getConversationHistory,
  importConversationHistory,
  deleteConversationHistory,
  getSuggestions,
  getDifferentialDiagnosis,
  getMedications,
  getLabResults
};
