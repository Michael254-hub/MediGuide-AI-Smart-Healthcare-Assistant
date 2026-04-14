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
    const conversationHistory = parseConversationHistory(req.body.conversationHistory);
    const question = normalizeQuestion(req.body.question, attachments);

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'A text prompt or at least one attachment is required'
      });
    }

    const patientData = await getClinicalDataForUser(req.user, req);
    const clinicalContext = buildClinicalContext(patientData);

    // Get MediChat response
    const consultation = await consultWithAI(
      clinicalContext,
      question,
      conversationHistory,
      attachments
    );

    if (!consultation.success) {
      return res.status(500).json({
        success: false,
        message: consultation.error || 'Failed to generate consultation'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        consultation: consultation.response,
        artifacts: consultation.artifacts || [],
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
    const conversationHistory = parseConversationHistory(req.body.conversationHistory);
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

    const patientData = await getClinicalDataForUser(req.user, req);
    const clinicalContext = buildClinicalContext(patientData);

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

    stream.on('end', () => {
      res.write(`data: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
      res.end();
    });

    stream.on('error', (error) => {
      console.error('Stream error:', error);
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
    const patientData = await getClinicalDataForUser(req.user, req);
    const clinicalContext = buildClinicalContext(patientData);

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
  getSuggestions,
  getDifferentialDiagnosis,
  getMedications,
  getLabResults
};
