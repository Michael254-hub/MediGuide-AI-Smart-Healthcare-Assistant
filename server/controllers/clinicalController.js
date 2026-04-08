/**
 * Clinical Decision Support Controller
 * Handles all endpoints for the AI-powered clinical support system
 */

const { generateMockPatientData, buildClinicalContext } = require('../services/clinicalDataService');
const { consultWithAI, generateSuggestions } = require('../services/aiConsultationService');

/**
 * GET /api/v1/clinical/patient-data
 * Retrieve patient's clinical data for decision support
 */
const getPatientData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // In production, this would fetch from EHR via FHIR APIs
    const patientData = generateMockPatientData(userId);
    
    res.status(200).json({
      success: true,
      data: patientData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/clinical/consult
 * Get AI consultation based on patient data and clinical question
 */
const getAIConsultation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { question, conversationHistory = [] } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question is required and must be a non-empty string'
      });
    }

    // Get patient data
    const patientData = generateMockPatientData(userId);
    const clinicalContext = buildClinicalContext(patientData);

    // Get AI consultation
    const consultation = await consultWithAI(
      clinicalContext,
      question.trim(),
      conversationHistory
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
        usage: consultation.usage,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/clinical/consult-stream
 * Streaming version of AI consultation for real-time responses
 */
const getAIConsultationStream = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { question, conversationHistory = [] } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    // Set streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Get patient data
    const patientData = generateMockPatientData(userId);
    const clinicalContext = buildClinicalContext(patientData);

    // Import streaming service
    const { consultWithAIStream } = require('../services/aiConsultationService');

    const stream = await consultWithAIStream(
      clinicalContext,
      question.trim(),
      conversationHistory
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
 * GET /api/v1/clinical/suggestions
 * Get AI-suggested clinical questions based on patient data
 */
const getSuggestions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get patient data
    const patientData = generateMockPatientData(userId);
    const clinicalContext = buildClinicalContext(patientData);

    // Generate suggestions
    const suggestionsResult = await generateSuggestions(clinicalContext);

    if (!suggestionsResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate suggestions'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        suggestions: suggestionsResult.suggestions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/clinical/differential-diagnosis
 * Get differential diagnoses from patient data
 */
const getDifferentialDiagnosis = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get patient data
    const patientData = generateMockPatientData(userId);
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
 * GET /api/v1/clinical/medications
 * Get current medications with interaction alerts
 */
const getMedications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get patient data
    const patientData = generateMockPatientData(userId);
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
 * GET /api/v1/clinical/labs
 * Get lab results with reference ranges and trends
 */
const getLabResults = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get patient data
    const patientData = generateMockPatientData(userId);
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
