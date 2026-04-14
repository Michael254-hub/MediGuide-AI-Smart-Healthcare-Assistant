/**
 * MediGuide Chat Service
 * Uses Google Gemini API to provide clinical decision support
 */

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const env = require('../config/env');

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_MODEL = env.geminiModel;
const MAX_ARTIFACTS = 3;
const ARTIFACT_FORMAT_CONFIG = {
  svg: { extension: 'svg', mimeType: 'image/svg+xml', kind: 'image' },
  md: { extension: 'md', mimeType: 'text/markdown', kind: 'document' },
  markdown: { extension: 'md', mimeType: 'text/markdown', kind: 'document' },
  html: { extension: 'html', mimeType: 'text/html', kind: 'document' },
  csv: { extension: 'csv', mimeType: 'text/csv', kind: 'document' },
  json: { extension: 'json', mimeType: 'application/json', kind: 'document' },
  text: { extension: 'txt', mimeType: 'text/plain', kind: 'document' },
  txt: { extension: 'txt', mimeType: 'text/plain', kind: 'document' },
};
const DEFAULT_SUGGESTIONS = [
  "What findings in this patient suggest the highest immediate risk?",
  "What differential diagnoses should we prioritize based on the current data?",
  "Which follow-up tests or monitoring steps would be most useful next?",
  "Are there any medication safety concerns or interaction risks to address?",
];
const DEFAULT_SYMPTOM_ASSESSMENT = {
  patientSummary: 'The symptom assessment could not be expanded beyond the baseline triage rules.',
  clinicalImpression: 'Use the current symptom description, follow-up answers, and patient profile as the main context for next-step review.',
  recommendations: [],
  redFlags: [],
  followUpPlan: 'Monitor symptoms closely and seek medical attention sooner if symptoms worsen or new warning signs appear.',
};

const CLINICAL_SYSTEM_PROMPT = `You are MediGuide AI, an advanced clinical decision support assistant powered by Google Gemini and evidence-based medical knowledge. You have deep expertise in:

- Internal Medicine and Primary Care
- Clinical Pharmacology and Drug Interactions
- Diagnostic Decision-Making and Differential Diagnosis
- Evidence-Based Medicine and Clinical Guidelines
- Risk Stratification and Patient Safety

IMPORTANT GUIDELINES FOR RESPONSES:
1. Always provide evidence-based reasoning tied to clinical data
2. Consider differential diagnoses with probability estimates
3. Reference current clinical guidelines (ACC/AHA, ADA, etc.)
4. Include relevant drug interaction alerts
5. Recommend specific diagnostic workup and follow-up
6. Flag any patient safety concerns
7. Use structured, professional medical language
8. When uncertain, acknowledge limitations and recommend specialist consultation

FORMAT YOUR RESPONSES with:
- Clear clinical reasoning
- Differential diagnoses prioritized by probability
- Risk assessment
- Specific actionable recommendations
- Follow-up timeline and monitoring parameters

CRITICAL: This is a decision support tool to assist clinicians, NOT a replacement for clinical judgment. Always recommend human physician review of all recommendations.

When responding in conversations, identify yourself as MediGuide AI when relevant and maintain a clear, supportive, professional tone.`;

const CLINICAL_STRUCTURED_RESPONSE_PROMPT = `${CLINICAL_SYSTEM_PROMPT}

You may also generate supporting artifacts when clinically useful or when the user asks for them. Always return valid JSON with this exact top-level shape and no markdown fences:
{
  "responseText": "Primary clinician-facing answer in plain text",
  "artifacts": [
    {
      "kind": "image or document",
      "format": "svg, markdown, html, csv, json, or txt",
      "title": "Short artifact title",
      "filename": "safe-file-name.ext",
      "description": "One sentence describing the artifact",
      "content": "Complete artifact contents"
    }
  ]
}

Artifact rules:
- Keep artifacts concise and useful
- Generate at most ${MAX_ARTIFACTS} artifacts
- Image artifacts must be valid standalone SVG markup
- Documents may be markdown, html, csv, json, or txt
- If no artifact is useful, return an empty artifacts array`;

const SYMPTOM_ASSESSMENT_SYSTEM_PROMPT = `You are MediGuide AI supporting a patient-facing symptom assessment workflow.

Your role is to enhance a baseline rule-based triage result using the supplied patient profile, symptom description, follow-up answers, and any uploaded symptom images.

Safety requirements:
1. Treat the provided baseline risk level as the minimum safe urgency floor. Do not downplay a HIGH or EMERGENCY baseline.
2. Focus on non-diagnostic clinical reasoning. Do not claim certainty or provide definitive diagnoses.
3. Ground every recommendation in the actual supplied context only. Do not invent vitals, labs, exam findings, or medications.
4. Make the recommendations practical, concise, and suitable for a patient symptom assessment page.
5. Highlight medication allergies or comorbidity considerations when directly relevant.
6. Clearly flag red-flag symptoms that should prompt urgent or emergency care escalation.
7. Avoid excessive jargon. Use plain, supportive language.

Return valid JSON only with this exact shape:
{
  "patientSummary": "1-2 sentence grounded summary of the case",
  "clinicalImpression": "Short explanation of the most likely symptom pattern and main uncertainty",
  "recommendations": ["specific next step", "specific self-care or care-seeking step"],
  "redFlags": ["warning sign 1", "warning sign 2"],
  "followUpPlan": "brief time-based follow-up guidance"
}

Additional formatting rules:
- Keep recommendations to 2-5 items
- Keep red flags to 0-5 items
- If baseline risk is EMERGENCY, emphasize immediate emergency care
- If baseline risk is HIGH, emphasize prompt same-day or urgent medical review
- If context is limited, acknowledge that limitation briefly`;

const describeAttachment = (attachment) => {
  if (attachment.mimeType.startsWith('image/')) {
    return `image: ${attachment.name}`;
  }

  if (attachment.mimeType.startsWith('video/')) {
    return `video: ${attachment.name}`;
  }

  if (attachment.mimeType.startsWith('audio/')) {
    return `audio: ${attachment.name}`;
  }

  return `document: ${attachment.name}`;
};

const buildAttachmentParts = (attachments = []) =>
  attachments.map((attachment) => ({
    inlineData: {
      mimeType: attachment.mimeType,
      data: attachment.data,
    },
  }));

const createModel = (options = {}) =>
  client.getGenerativeModel({
    model: GEMINI_MODEL,
    ...options,
  });

const sanitizeFilename = (value, fallbackName) => {
  const safeValue =
    typeof value === 'string'
      ? value
          .trim()
          .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      : '';

  return safeValue || fallbackName;
};

const ensureExtension = (filename, extension) =>
  filename.toLowerCase().endsWith(`.${extension}`) ? filename : `${filename}.${extension}`;

const toDataUrl = (mimeType, content) =>
  `data:${mimeType};base64,${Buffer.from(content, 'utf8').toString('base64')}`;

const extractJsonObject = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  try {
    return JSON.parse(trimmedValue);
  } catch {
    const objectMatch = trimmedValue.match(/\{[\s\S]*\}/);

    if (!objectMatch) {
      return null;
    }

    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      return null;
    }
  }
};

const normalizeArtifact = (artifact, index) => {
  if (!artifact || typeof artifact !== 'object') {
    return null;
  }

  const formatKey =
    typeof artifact.format === 'string' ? artifact.format.trim().toLowerCase() : '';
  const formatConfig = ARTIFACT_FORMAT_CONFIG[formatKey];

  if (!formatConfig) {
    return null;
  }

  const content = typeof artifact.content === 'string' ? artifact.content.trim() : '';

  if (!content) {
    return null;
  }

  const artifactTitle =
    typeof artifact.title === 'string' && artifact.title.trim()
      ? artifact.title.trim()
      : `Artifact ${index + 1}`;
  const fallbackName =
    artifactTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `artifact-${index + 1}`;
  const baseFilename = sanitizeFilename(artifact.filename, fallbackName);
  const filename = ensureExtension(baseFilename, formatConfig.extension);

  return {
    id: `artifact-${Date.now()}-${index}`,
    name: filename,
    title: artifactTitle,
    description:
      typeof artifact.description === 'string' && artifact.description.trim()
        ? artifact.description.trim()
        : '',
    kind: formatConfig.kind,
    type: formatConfig.mimeType,
    size: Buffer.byteLength(content, 'utf8'),
    url: toDataUrl(formatConfig.mimeType, content),
    generated: true,
  };
};

const parseConsultationResponse = (rawText) => {
  const parsed = extractJsonObject(rawText);

  if (!parsed || typeof parsed !== 'object') {
    return {
      responseText: typeof rawText === 'string' ? rawText.trim() : '',
      artifacts: [],
    };
  }

  const artifacts = Array.isArray(parsed.artifacts)
    ? parsed.artifacts.map(normalizeArtifact).filter(Boolean).slice(0, MAX_ARTIFACTS)
    : [];
  const responseText =
    typeof parsed.responseText === 'string' && parsed.responseText.trim()
      ? parsed.responseText.trim()
      : artifacts.length > 0
        ? 'Supporting outputs are attached below.'
        : typeof rawText === 'string'
          ? rawText.trim()
          : '';

  return {
    responseText,
    artifacts,
  };
};

const parseJsonArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
  }

  return [];
};

const parseSymptomAssessmentResponse = (rawText) => {
  const parsed = extractJsonObject(rawText);

  if (!parsed || typeof parsed !== 'object') {
    return DEFAULT_SYMPTOM_ASSESSMENT;
  }

  return {
    patientSummary:
      typeof parsed.patientSummary === 'string' && parsed.patientSummary.trim()
        ? parsed.patientSummary.trim()
        : DEFAULT_SYMPTOM_ASSESSMENT.patientSummary,
    clinicalImpression:
      typeof parsed.clinicalImpression === 'string' && parsed.clinicalImpression.trim()
        ? parsed.clinicalImpression.trim()
        : DEFAULT_SYMPTOM_ASSESSMENT.clinicalImpression,
    recommendations: parseJsonArray(parsed.recommendations).slice(0, 5),
    redFlags: parseJsonArray(parsed.redFlags).slice(0, 5),
    followUpPlan:
      typeof parsed.followUpPlan === 'string' && parsed.followUpPlan.trim()
        ? parsed.followUpPlan.trim()
        : DEFAULT_SYMPTOM_ASSESSMENT.followUpPlan,
  };
};

const createConsultationMessage = (patientContext, userQuestion, attachments = []) => {
  let message = `Patient Context:
${patientContext}

Clinical Question:
${userQuestion}

Provide a detailed, evidence-based clinical consultation addressing the question with specific recommendations.

When helpful, or if the clinician asks for visual or file-based output, include supporting artifacts in the JSON response. Suitable artifacts include:
- SVG clinical diagrams or visual summaries
- Markdown or HTML reports
- CSV tables
- JSON summaries
- Plain-text handoff notes`;

  if (attachments.length > 0) {
    message += `\n\nAttached materials for review:
${attachments.map((attachment) => `- ${describeAttachment(attachment)}`).join('\n')}

Incorporate any clinically relevant findings from these materials into your answer.`;
  }

  return message;
};

const createSymptomAssessmentMessage = (
  clinicalContext,
  submissionData,
  baselineAssessment,
  attachments = []
) => {
  const followUpResponses = Array.isArray(submissionData.followUpResponses)
    ? submissionData.followUpResponses
    : [];
  const followUpText =
    followUpResponses.length > 0
      ? followUpResponses
          .map((item) => {
            const normalizedAnswer =
              item.answer === 'i_dont_know'
                ? "I don't know"
                : typeof item.answer === 'string'
                  ? item.answer
                  : 'unknown';

            return `- ${item.question}: ${normalizedAnswer}`;
          })
          .join('\n')
      : '- No follow-up responses were provided';

  let message = `PATIENT CLINICAL CONTEXT:
${clinicalContext}

CURRENT SYMPTOM ASSESSMENT INPUT:
- Symptoms: ${submissionData.symptoms}
- Duration: ${submissionData.duration}
- Severity: ${submissionData.severity}

FOLLOW-UP RESPONSES:
${followUpText}

BASELINE TRIAGE RESULT:
- Risk level: ${baselineAssessment.level}
- Immediate recommendation: ${baselineAssessment.recommendation}
- Emergency flag: ${baselineAssessment.flaggedEmergency ? 'yes' : 'no'}

TASK:
Enhance the patient-facing symptom assessment summary and recommendations using the supplied context.
Keep the baseline triage urgency intact while making the recommendation more specific, grounded, and helpful.`;

  if (attachments.length > 0) {
    message += `\n\nATTACHED SYMPTOM IMAGES:
${attachments.map((attachment) => `- ${describeAttachment(attachment)}`).join('\n')}

Incorporate only clearly relevant visual observations into the grounded assessment.`;
  }

  return message;
};

const consultWithAI = async (
  patientContext,
  userQuestion,
  conversationHistory = [],
  attachments = []
) => {
  try {
    const model = createModel({
      systemInstruction: CLINICAL_STRUCTURED_RESPONSE_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    // Build content array for multimodal input
    const contents = [];

    // Add conversation history
    conversationHistory.forEach(msg => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    });

    const messageParts = [...buildAttachmentParts(attachments)];
    messageParts.push({
      text: createConsultationMessage(patientContext, userQuestion, attachments)
    });

    contents.push({
      role: 'user',
      parts: messageParts
    });

    const response = await model.generateContent({
      contents: contents,
    });

    const parsedResponse = parseConsultationResponse(response.response.text());

    return {
      success: true,
      response: parsedResponse.responseText,
      artifacts: parsedResponse.artifacts,
      usage: {
        inputTokens: response.response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.response.usageMetadata?.candidatesTokenCount || 0
      }
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      success: false,
      error: error.message,
      response: 'Unable to process consultation request. Please try again.'
    };
  }
};

// Streaming version for real-time responses
const consultWithAIStream = async (
  patientContext,
  userQuestion,
  conversationHistory = [],
  attachments = []
) => {
  try {
    const model = createModel({
      systemInstruction: CLINICAL_SYSTEM_PROMPT,
    });

    // Build content array
    const contents = [];

    conversationHistory.forEach(msg => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    });

    const messageParts = [...buildAttachmentParts(attachments)];
    messageParts.push({
      text: createConsultationMessage(patientContext, userQuestion, attachments)
    });

    contents.push({
      role: 'user',
      parts: messageParts
    });

    const stream = await model.generateContentStream({
      contents: contents,
    });

    return stream;
  } catch (error) {
    console.error('Gemini Streaming Error:', error);
    throw error;
  }
};

// Generate quick suggestions based on patient data
const generateSuggestions = async (patientContext) => {
  const model = createModel();

  const suggestionPrompt = `Based on this patient's data, suggest 3-4 specific clinical questions a physician might ask for decision support. Format as a JSON array of strings, each being a natural language question.

Patient Data:
${patientContext}

Respond ONLY with valid JSON array like: ["Question 1?", "Question 2?", "Question 3?", "Question 4?"]`;

  try {
    const response = await model.generateContent(suggestionPrompt);
    const content = response.response.text();
    
    // Extract JSON array from response
    const jsonMatch = content.match(/\[.*\]/s);
    if (jsonMatch) {
      const parsedSuggestions = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        suggestions: Array.isArray(parsedSuggestions) && parsedSuggestions.length > 0
          ? parsedSuggestions
          : DEFAULT_SUGGESTIONS
      };
    }
    return { success: true, suggestions: DEFAULT_SUGGESTIONS };
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return { success: true, suggestions: DEFAULT_SUGGESTIONS };
  }
};

const assessSymptomsWithAI = async (
  clinicalContext,
  submissionData,
  baselineAssessment,
  attachments = []
) => {
  try {
    const model = createModel({
      systemInstruction: SYMPTOM_ASSESSMENT_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const messageParts = [...buildAttachmentParts(attachments)];
    messageParts.push({
      text: createSymptomAssessmentMessage(
        clinicalContext,
        submissionData,
        baselineAssessment,
        attachments
      ),
    });

    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: messageParts,
        },
      ],
    });

    return {
      success: true,
      assessment: parseSymptomAssessmentResponse(response.response.text()),
      usage: {
        inputTokens: response.response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.response.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  } catch (error) {
    console.error('Symptom assessment AI error:', error);
    return {
      success: false,
      error: error.message,
      assessment: DEFAULT_SYMPTOM_ASSESSMENT,
    };
  }
};

// Process image for symptom analysis
const analyzeSymptomImage = async (imageData, symptomDescription) => {
  const model = createModel();

  const analysisPrompt = `Analyze this medical image in the context of the following symptom description. Provide clinical observations about what is visible.

Symptom Description: ${symptomDescription}

Please provide:
1. Visual observations
2. Potential clinical correlations
3. Recommendations for follow-up

Note: This is for clinical decision support only, not diagnosis.`;

  try {
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: imageData.mimeType,
                data: imageData.data
              }
            },
            {
              text: analysisPrompt
            }
          ]
        }
      ]
    });

    return {
      success: true,
      analysis: response.response.text()
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      success: false,
      error: error.message,
      analysis: 'Unable to analyze image. Please try again.'
    };
  }
};

module.exports = {
  assessSymptomsWithAI,
  consultWithAI,
  consultWithAIStream,
  generateSuggestions,
  analyzeSymptomImage,
  CLINICAL_SYSTEM_PROMPT,
  SYMPTOM_ASSESSMENT_SYSTEM_PROMPT,
  DEFAULT_SUGGESTIONS
};
