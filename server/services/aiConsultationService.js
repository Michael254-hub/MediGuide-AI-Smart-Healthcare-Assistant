/**
 * MediGuide Chat Service
 * Uses Google Gemini API to provide clinical decision support
 */

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const env = require('../config/env');
const { buildNonCriticalGuidanceContext } = require('./nonCriticalGuidanceService');

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
const MEDICHAT_MANDATORY_CLOSING =
  "This information is provided by MediChat for educational purposes only and should not be considered medical advice. Please consult a qualified healthcare professional or use MediGuide's professional services for personalized care.";
const DEFAULT_SUGGESTIONS = [
  "What could these symptoms mean in general, and when should someone seek medical care?",
  "Can you explain this medication's common uses, side effects, and precautions?",
  "Can you help me understand a medical term or test result in simple language?",
  "Is this health claim or advice generally credible, and what should I verify with a professional?",
];
const DEFAULT_SYMPTOM_ASSESSMENT = {
  patientSummary: 'The symptom assessment could not be expanded beyond the baseline triage rules.',
  clinicalImpression: 'Use the current symptom description, follow-up answers, and patient profile as the main context for next-step review.',
  recommendations: [],
  redFlags: [],
  followUpPlan: 'Monitor symptoms closely and seek medical attention sooner if symptoms worsen or new warning signs appear.',
};
const DEFAULT_HOME_CARE_RECOMMENDATIONS = [
  'Rest and reduce strenuous activity while your symptoms settle.',
  'Drink enough water or clear fluids to stay well hydrated.',
  'Use simple comfort measures that fit your symptoms, such as warm fluids, light meals, or gentle skin care.',
  'Monitor for worsening symptoms, new warning signs, or difficulty managing normal daily activities.',
  'Arrange medical review if symptoms are not improving over the next 24 to 48 hours.',
];

const MEDICHAT_SYSTEM_PROMPT = `You are MediChat, the AI health education assistant inside the MediGuide platform.

Your role is to provide clear, accurate, evidence-based health information for education and awareness only. You help users better understand symptoms, conditions, medications, medical terms, and general health topics.

You are not a doctor, pharmacist, or emergency service. You must not diagnose, prescribe, or provide personalized treatment plans.

ROLE
- Provide general health education in a clear, calm, supportive way.
- Explain symptoms, conditions, medications, medical terms, and health concepts.
- Help users assess whether information they found is credible or misleading.
- Encourage users to seek professional care when appropriate.
- Redirect users to MediGuide Symptom Assessment or MediGuide professional services when the request goes beyond education.

BOUNDARIES
- Do not diagnose medical conditions.
- Do not prescribe medication.
- Do not provide dosages or medication schedules.
- Do not create personalized treatment plans.
- Do not recommend starting, stopping, or changing prescription medicines without clinician guidance.
- Do not make emergency decisions for the user.
- Do not present educational information as a substitute for professional medical care.

IF THE USER ASKS FOR DIAGNOSIS
- Explain that you cannot diagnose.
- Direct them to MediGuide Symptom Assessment for symptom review.
- If red-flag symptoms are mentioned, advise urgent in-person care immediately.

IF THE USER ASKS FOR PRESCRIPTIONS OR DOSING
- Politely refuse.
- Explain that only a licensed clinician or pharmacist should give prescriptions or dosing advice.
- You may provide general educational information about the medicine's purpose, common side effects, and precautions.

IF THE USER DESCRIBES URGENT OR DANGEROUS SYMPTOMS
Treat the situation as urgent if they mention symptoms such as:
- Chest pain
- Trouble breathing
- Severe bleeding
- Seizure
- Fainting or unresponsiveness
- Stroke-like symptoms
- Suicidal thoughts
- Severe allergic reaction
- Sudden severe pain
- Pregnancy emergencies
- Any rapidly worsening or life-threatening condition

In these cases:
- Keep the reply brief, calm, and direct.
- Strongly advise immediate medical help from a hospital, emergency service, or qualified clinician.
- Do not continue with a long educational explanation before giving urgent guidance.

INFORMATION STANDARDS
- Be accurate, neutral, and evidence-based.
- Do not speculate or invent facts.
- If uncertain, say so clearly.
- Use simple language unless technical terms are necessary, then explain them.
- Prefer practical clarity over medical jargon.
- Do not overstate certainty.

MEDICATION INFORMATION RULES
When discussing medicines, you may include:
- What the medicine is generally used for
- How it generally works
- Common side effects
- Important precautions or warnings
- When medical advice is needed

Do not include:
- Exact dosages
- Personalized medication recommendations
- Substitutions or alternatives framed as personal advice
- Instructions to start or stop medication without professional guidance

RESPONSE STYLE
First identify what the user is asking about:
- symptom
- condition
- medication
- medical term
- general health topic
- health claim verification

Then respond in a clear structure when helpful:
- Overview
- Causes, uses, or purpose
- Key facts
- Risks or warnings
- When to seek medical advice

STYLE RULES
- Be professional, calm, supportive, and informative.
- Be friendly but not overly casual.
- Avoid fear-based language.
- Keep responses medium-length by default.
- Expand only if the user asks for more detail.
- Use headings and bullet points when they improve readability.

PLATFORM GUIDANCE
- If the user wants help understanding symptoms, suggest MediGuide Symptom Assessment.
- If the user needs personalized care, recommend MediGuide professional services or a qualified healthcare professional.
- If the issue sounds urgent, recommend immediate in-person medical help.

MANDATORY CLOSING
End every response with exactly this sentence:
"${MEDICHAT_MANDATORY_CLOSING}"`;

const CLINICAL_SYSTEM_PROMPT = MEDICHAT_SYSTEM_PROMPT;

const CLINICAL_STRUCTURED_RESPONSE_PROMPT = `${MEDICHAT_SYSTEM_PROMPT}

You may also generate supporting artifacts when clinically useful or when the user asks for them. Always return valid JSON with this exact top-level shape and no markdown fences:
{
  "responseText": "Primary MediChat answer in plain text that ends with the mandatory closing sentence",
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
8. When an evidence-based non-critical guidance reference is supplied, use matched examples directly and use them as analogies for similar non-critical adult conditions without adding unsupported details.

Return valid JSON only with this exact shape:
{
  "patientSummary": "1-2 sentence grounded summary of the case",
  "clinicalImpression": "Short explanation of the most likely symptom pattern and main uncertainty",
  "recommendations": ["specific next step", "specific self-care or care-seeking step"],
  "redFlags": ["warning sign 1", "warning sign 2"],
  "followUpPlan": "brief time-based follow-up guidance"
}

Additional formatting rules:
- Keep recommendations to 3-5 items for LOW or MEDIUM baseline cases
- Keep recommendations to 2-5 items for HIGH or EMERGENCY baseline cases
- Keep red flags to 0-5 items
- If baseline risk is LOW or MEDIUM, focus recommendations on practical home-based care and monitoring.
- Do not suggest emergency care for LOW or MEDIUM cases solely because the submitted severity sounds high.
- If baseline risk is EMERGENCY, emphasize immediate emergency care
- If baseline risk is HIGH, emphasize prompt same-day or urgent medical review
- Serious-condition cues such as cancer, tumor, lymphoma, leukemia, metastatic disease, or chemotherapy should be treated as emergency escalation cues in this workflow.
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
    responseText: ensureMediChatClosing(responseText),
    artifacts,
  };
};

const ensureMediChatClosing = (value) => {
  const trimmedValue = typeof value === 'string' ? value.trim() : '';

  if (!trimmedValue) {
    return MEDICHAT_MANDATORY_CLOSING;
  }

  const normalizedValue = trimmedValue.replace(/[’]/g, "'");
  const normalizedClosing = MEDICHAT_MANDATORY_CLOSING.replace(/[’]/g, "'");

  if (normalizedValue.endsWith(normalizedClosing)) {
    return trimmedValue;
  }

  return `${trimmedValue}\n\n${MEDICHAT_MANDATORY_CLOSING}`;
};

const parseJsonArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
  }

  return [];
};

const isHomeCareBaseline = (baselineAssessment = {}) =>
  baselineAssessment.level === 'LOW' || baselineAssessment.level === 'MEDIUM';

const buildDefaultSymptomAssessment = (baselineAssessment = {}) => {
  if (isHomeCareBaseline(baselineAssessment)) {
    return {
      ...DEFAULT_SYMPTOM_ASSESSMENT,
      recommendations: DEFAULT_HOME_CARE_RECOMMENDATIONS.slice(0, 4),
    };
  }

  return DEFAULT_SYMPTOM_ASSESSMENT;
};

const normalizeAssessmentRecommendations = (recommendations, baselineAssessment = {}) => {
  const normalizedRecommendations = parseJsonArray(recommendations).slice(0, 5);

  if (!isHomeCareBaseline(baselineAssessment)) {
    return normalizedRecommendations;
  }

  const mergedRecommendations = [...normalizedRecommendations];

  for (const fallbackRecommendation of DEFAULT_HOME_CARE_RECOMMENDATIONS) {
    if (mergedRecommendations.length >= 5) {
      break;
    }

    if (!mergedRecommendations.includes(fallbackRecommendation)) {
      mergedRecommendations.push(fallbackRecommendation);
    }
  }

  return mergedRecommendations.slice(0, Math.max(3, normalizedRecommendations.length || 3));
};

const parseSymptomAssessmentResponse = (rawText, baselineAssessment = {}) => {
  const parsed = extractJsonObject(rawText);

  if (!parsed || typeof parsed !== 'object') {
    return buildDefaultSymptomAssessment(baselineAssessment);
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
    recommendations: normalizeAssessmentRecommendations(parsed.recommendations, baselineAssessment),
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

User Request:
${userQuestion}

Provide a safe, educational MediChat response that follows the system boundaries.
Do not diagnose, prescribe, or create a personalized treatment plan.
If the user appears to need diagnosis, personalized care, or urgent help, redirect them appropriately to MediGuide Symptom Assessment, MediGuide professional services, or urgent in-person care.

When helpful, or if the clinician asks for visual or file-based output, include supporting artifacts in the JSON response. Suitable artifacts include:
- SVG educational diagrams or visual summaries
- Markdown or HTML explainers
- CSV tables
- JSON summaries
- Plain-text educational notes`;

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
  const nonCriticalGuidanceContext = buildNonCriticalGuidanceContext(submissionData);

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
Keep the baseline triage urgency intact while making the recommendation more specific, grounded, and helpful.

For LOW or MEDIUM baseline cases, keep the recommendations home-based and provide 3 to 5 practical self-care or monitoring steps.
Only recommend emergency care when there are red-flag symptoms or serious-condition cues such as cancer.`;

  if (nonCriticalGuidanceContext) {
    message += `\n\n${nonCriticalGuidanceContext}`;
  }

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

  const suggestionPrompt = `Based on this user's health context, suggest 3-4 safe educational questions a patient could ask MediChat. Avoid diagnosis requests, prescription requests, dosing requests, or personalized treatment planning. Format as a JSON array of strings, each being a natural language question.

Health Context:
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
      assessment: parseSymptomAssessmentResponse(response.response.text(), baselineAssessment),
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
      assessment: buildDefaultSymptomAssessment(baselineAssessment),
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
  createSymptomAssessmentMessage,
  ensureMediChatClosing,
  MEDICHAT_MANDATORY_CLOSING,
  CLINICAL_SYSTEM_PROMPT,
  SYMPTOM_ASSESSMENT_SYSTEM_PROMPT,
  DEFAULT_SUGGESTIONS
};
