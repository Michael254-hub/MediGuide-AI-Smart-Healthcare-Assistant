const MAX_FOLLOW_UP_QUESTIONS = 15;

const QUESTION_BANK = [
  {
    id: 'symptoms_worsening',
    question: 'Have your symptoms been getting worse since they started?',
  },
  {
    id: 'daily_activities',
    question: 'Are these symptoms making it hard to do your usual daily activities?',
  },
  {
    id: 'respiratory_shortness_of_breath',
    question: 'Do you have shortness of breath or trouble breathing?',
    keywords: ['cough', 'cold', 'flu', 'breathing', 'shortness of breath', 'wheezing', 'congestion', 'sore throat'],
  },
  {
    id: 'respiratory_fever',
    question: 'Do you also have a fever or chills?',
    keywords: ['cough', 'cold', 'flu', 'breathing', 'congestion', 'sore throat'],
  },
  {
    id: 'respiratory_chest_discomfort',
    question: 'Do you feel chest discomfort when you cough or breathe deeply?',
    keywords: ['cough', 'breathing', 'shortness of breath', 'wheezing'],
  },
  {
    id: 'headache_sudden',
    question: 'Did the headache start very suddenly and feel unusually intense?',
    keywords: ['headache', 'migraine', 'head pain'],
  },
  {
    id: 'headache_light',
    question: 'Do you have sensitivity to light or sound with the headache?',
    keywords: ['headache', 'migraine', 'head pain'],
  },
  {
    id: 'headache_neuro',
    question: 'Have you noticed weakness, numbness, confusion, or trouble speaking?',
    keywords: ['headache', 'migraine', 'dizziness', 'head pain'],
  },
  {
    id: 'gi_vomiting',
    question: 'Have you been vomiting or unable to keep fluids down?',
    keywords: ['stomach', 'abdominal', 'abdomen', 'nausea', 'vomiting', 'diarrhea', 'cramps'],
  },
  {
    id: 'gi_bowel_changes',
    question: 'Have you had diarrhea or a major change in bowel movements?',
    keywords: ['stomach', 'abdominal', 'abdomen', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'cramps'],
  },
  {
    id: 'gi_blood',
    question: 'Have you noticed blood in your vomit or stool?',
    keywords: ['stomach', 'abdominal', 'abdomen', 'vomiting', 'diarrhea', 'cramps'],
  },
  {
    id: 'urinary_burning',
    question: 'Do you feel burning or pain when urinating?',
    keywords: ['urine', 'urinary', 'pee', 'bladder', 'kidney', 'flank'],
  },
  {
    id: 'urinary_frequency',
    question: 'Are you urinating more often than usual?',
    keywords: ['urine', 'urinary', 'pee', 'bladder'],
  },
  {
    id: 'urinary_blood',
    question: 'Have you seen blood in the urine?',
    keywords: ['urine', 'urinary', 'pee', 'bladder', 'kidney', 'flank'],
  },
  {
    id: 'skin_spreading',
    question: 'Is the rash, swelling, or skin change spreading?',
    keywords: ['rash', 'itching', 'itchy', 'skin', 'hives', 'swelling', 'redness'],
  },
  {
    id: 'skin_discharge',
    question: 'Is the area warm, painful, or draining fluid?',
    keywords: ['rash', 'skin', 'swelling', 'redness', 'wound', 'cut', 'bite'],
  },
  {
    id: 'skin_allergy',
    question: 'Did this start after a new medicine, food, soap, or skin product?',
    keywords: ['rash', 'itching', 'itchy', 'skin', 'hives', 'swelling'],
  },
  {
    id: 'skin_face_swelling',
    question: 'Do you have swelling of the lips, tongue, or face?',
    keywords: ['rash', 'itching', 'itchy', 'hives', 'swelling'],
  },
  {
    id: 'musculoskeletal_injury',
    question: 'Did the pain start after an injury, fall, or heavy lifting?',
    keywords: ['back pain', 'joint pain', 'muscle pain', 'leg pain', 'arm pain', 'sprain', 'strain', 'neck pain'],
  },
  {
    id: 'musculoskeletal_swelling',
    question: 'Do you have swelling or trouble moving the painful area?',
    keywords: ['back pain', 'joint pain', 'muscle pain', 'leg pain', 'arm pain', 'sprain', 'strain', 'neck pain'],
  },
  {
    id: 'musculoskeletal_radiating',
    question: 'Does the pain travel down your arm or leg, or cause tingling?',
    keywords: ['back pain', 'leg pain', 'arm pain', 'neck pain', 'numbness', 'tingling'],
  },
  {
    id: 'dizziness_fainting',
    question: 'Have you fainted or almost fainted?',
    keywords: ['dizziness', 'lightheaded', 'vertigo', 'faint'],
  },
  {
    id: 'dizziness_chest',
    question: 'Do you have chest pain, palpitations, or trouble breathing with the dizziness?',
    keywords: ['dizziness', 'lightheaded', 'vertigo', 'faint'],
  },
  {
    id: 'eye_vision',
    question: 'Has your vision become blurry, dim, or more painful?',
    keywords: ['eye', 'vision', 'red eye', 'eye pain', 'blurred vision'],
  },
  {
    id: 'eye_discharge',
    question: 'Do you have eye redness, discharge, or sensitivity to light?',
    keywords: ['eye', 'vision', 'red eye', 'eye pain', 'blurred vision'],
  },
  {
    id: 'fever_temperature',
    question: 'Have you checked your temperature and found a fever?',
    keywords: ['fever', 'chills', 'infection', 'body aches'],
  },
  {
    id: 'fever_contact',
    question: 'Have you recently been around someone who is sick?',
    keywords: ['fever', 'chills', 'infection', 'body aches', 'cough', 'cold'],
  },
];

const normalizeText = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const createFallbackQuestions = () => [
  QUESTION_BANK[0],
  QUESTION_BANK[1],
];

const generateFollowUpQuestions = ({ symptoms, duration, severity }) => {
  const normalizedSymptoms = normalizeText(symptoms);
  const normalizedDuration = normalizeText(duration);
  const normalizedSeverity = normalizeText(severity);
  const selectedQuestions = [];
  const seenQuestionIds = new Set();

  const addQuestion = (question) => {
    if (!question || seenQuestionIds.has(question.id) || selectedQuestions.length >= MAX_FOLLOW_UP_QUESTIONS) {
      return;
    }

    selectedQuestions.push({
      id: question.id,
      question: question.question,
    });
    seenQuestionIds.add(question.id);
  };

  createFallbackQuestions().forEach(addQuestion);

  QUESTION_BANK.forEach((question) => {
    if (!Array.isArray(question.keywords)) {
      return;
    }

    const matchesKeyword = question.keywords.some((keyword) => normalizedSymptoms.includes(keyword));
    if (matchesKeyword) {
      addQuestion(question);
    }
  });

  if (normalizedDuration.includes('1-2 weeks') || normalizedDuration.includes('more than 2 weeks')) {
    addQuestion({
      id: 'persistent_duration',
      question: 'Have these symptoms stayed the same or continued without improvement for several days?',
    });
  }

  if (normalizedSeverity === 'moderate' || normalizedSeverity === 'severe') {
    addQuestion({
      id: 'pain_management',
      question: 'Have rest, fluids, or over-the-counter care failed to give meaningful relief?',
    });
  }

  if (selectedQuestions.length <= 2) {
    addQuestion({
      id: 'new_symptom_since_start',
      question: 'Have you noticed any new symptoms since this started?',
    });
    addQuestion({
      id: 'sleep_disruption',
      question: 'Have the symptoms been severe enough to disturb your sleep?',
    });
  }

  return selectedQuestions.slice(0, MAX_FOLLOW_UP_QUESTIONS);
};

module.exports = {
  MAX_FOLLOW_UP_QUESTIONS,
  generateFollowUpQuestions,
};
