const NON_CRITICAL_GUIDANCE_PRINCIPLES = [
  'This reference is for adults with typically non-critical conditions and is not a diagnosis or prescription.',
  'Self-care is only appropriate when symptoms are mild, expected, improving, and no red-flag features are present.',
  'Do not recommend medicine doses. Keep OTC advice general, avoid duplicate multi-ingredient products, and suggest pharmacist review when suitability is unclear.',
  'When a condition profile fits, give practical self-care, clear red flags, and a time-based follow-up plan.',
  'When no profile fits exactly, use the same structure as an example for other non-critical adult conditions without inventing unsupported details.',
];

const CONDITION_GUIDANCE = [
  {
    id: 'tension-type-headache',
    title: 'Tension-type headache',
    keywords: [
      'tension headache',
      'tight band',
      'pressure around head',
      'pressing headache',
      'headache',
      'neck pain',
      'face pain',
      'stress headache',
    ],
    symptomPattern:
      'A pressing or tightening headache, often on both sides, sometimes with face or neck discomfort and stress or sleep-related triggers.',
    selfCare: [
      'Rest, hydrate, and address likely triggers such as poor sleep, stress, posture strain, or excess caffeine.',
      'Use simple pain relief only as labeled and avoid frequent repeated painkiller use that can worsen rebound headaches.',
    ],
    safetyNet: [
      'Urgent review is needed for sudden severe headache, confusion, meningitis symptoms, or headache after head injury.',
      'Seek care sooner for weakness, numbness, vision changes, or headaches that are severe, frequent, or not improving.',
    ],
    followUp:
      'Persistent or recurrent headaches should be reviewed even if they began like a typical tension-type pattern.',
  },
  {
    id: 'common-cold',
    title: 'Common cold',
    keywords: [
      'common cold',
      'cold',
      'runny nose',
      'blocked nose',
      'stuffy nose',
      'sore throat',
      'hoarse voice',
      'cough',
      'sneezing',
    ],
    symptomPattern:
      'A gradual upper-respiratory illness with runny or blocked nose, sneezing, sore throat, cough, and tiredness.',
    selfCare: [
      'Rest and drink enough fluids to avoid dehydration.',
      'Use simple symptom relief such as saline or pharmacist-guided OTC products, and avoid taking multiple combination products with overlapping ingredients.',
    ],
    safetyNet: [
      'Seek medical review for shortness of breath, chest pain, dehydration, or fever that is very high or lasts more than a few days.',
      'Seek review if symptoms worsen, do not improve after about 10 days, or the cough lasts longer than about 3 weeks.',
    ],
    followUp:
      'Mild cold symptoms can usually be monitored at home when they are stable or improving over 1 to 2 weeks.',
  },
  {
    id: 'allergic-rhinitis',
    title: 'Allergic rhinitis',
    keywords: [
      'allergic rhinitis',
      'hay fever',
      'itchy nose',
      'itchy palate',
      'runny nose',
      'blocked nose',
      'sneezing',
      'watery eyes',
      'itchy eyes',
      'allergy',
    ],
    symptomPattern:
      'Cold-like symptoms that begin quickly after allergen exposure, often with itchy nose, sneezing, blocked or runny nose, and watery or itchy eyes.',
    selfCare: [
      'Reduce exposure to likely triggers where practical and consider saline rinses or pharmacist-guided allergy treatments.',
      'Keep advice general and avoid prolonged use of nasal sprays without professional advice.',
    ],
    safetyNet: [
      'Seek review if symptoms are worsening, affecting sleep or daily function, or the trigger is unclear.',
      'Get medical help sooner if asthma or breathing symptoms worsen alongside nasal allergy symptoms.',
    ],
    followUp:
      'Persistent symptoms despite OTC treatment should prompt pharmacist or clinician review.',
  },
  {
    id: 'acute-sinusitis',
    title: 'Acute sinusitis',
    keywords: [
      'sinusitis',
      'sinus infection',
      'facial pressure',
      'facial pain',
      'sinus pain',
      'green mucus',
      'yellow mucus',
      'reduced smell',
      'toothache',
    ],
    symptomPattern:
      'Facial pain or pressure with blocked or runny nose, thick mucus, reduced smell, and sometimes fever or toothache after a cold.',
    selfCare: [
      'Rest, hydrate, use suitable pain relief, and clean the nose gently with saline.',
      'Avoid smoking and consider pharmacist-guided nasal therapies when congestion or allergy is contributing.',
    ],
    safetyNet: [
      'Seek prompt review if pain relief is not helping, symptoms are worsening, or the person feels very unwell.',
      'Seek review if symptoms do not improve after about 7 days of treatment or around 3 weeks of self-care, or if symptoms are mainly one-sided.',
    ],
    followUp:
      'Most mild cases can be watched at home, but persistent or clearly worsening sinus symptoms should be reassessed.',
  },
  {
    id: 'viral-gastroenteritis',
    title: 'Viral gastroenteritis',
    keywords: [
      'gastroenteritis',
      'stomach bug',
      'diarrhea',
      'diarrhoea',
      'vomiting',
      'watery stool',
      'nausea',
      'stomach cramps',
      'abdominal cramps',
    ],
    symptomPattern:
      'A short-lived gastrointestinal illness with watery diarrhea, vomiting, nausea, cramps, and sometimes fever or body aches.',
    selfCare: [
      'Prioritize hydration with frequent small sips of fluids or oral rehydration solution and rest.',
      'Return to food as tolerated and use hygiene measures to reduce spread to other people.',
    ],
    safetyNet: [
      'Urgent review is needed for blood in stool or vomit, severe abdominal pain, confusion, or inability to keep fluids down.',
      'Seek review if dehydration persists, vomiting lasts more than about 2 days, or diarrhea lasts more than about 7 days.',
    ],
    followUp:
      'Home care is only reasonable while hydration can be maintained and symptoms are clearly improving.',
  },
  {
    id: 'lower-uti',
    title: 'Uncomplicated lower urinary tract infection',
    keywords: [
      'uti',
      'urinary tract infection',
      'burning urination',
      'burning when peeing',
      'pain when peeing',
      'dysuria',
      'frequent urination',
      'urinary frequency',
      'urinary urgency',
      'cloudy urine',
      'blood in urine',
    ],
    symptomPattern:
      'Burning urination with urgency, frequency, cloudy urine, lower abdominal discomfort, and sometimes visible blood.',
    selfCare: [
      'While arranging assessment, rest, drink enough fluids, and avoid bladder irritants if they make symptoms worse.',
      'Use only suitable simple pain relief and avoid presenting cranberry or alkalinizing products as proven treatment.',
    ],
    safetyNet: [
      'Same-day review is needed for fever, shivering, flank pain, blood in urine, or rapidly worsening symptoms.',
      'Seek earlier assessment in pregnancy, diabetes, immunosuppression, catheter use, recurrent infections, or male patients.',
    ],
    followUp:
      'UTI symptoms often need pharmacist or clinician assessment even when the pattern seems straightforward.',
  },
  {
    id: 'mild-atopic-eczema',
    title: 'Mild atopic eczema',
    keywords: [
      'eczema',
      'atopic dermatitis',
      'itchy dry skin',
      'cracked skin',
      'scaly skin',
      'inflamed patches',
      'itchy rash',
    ],
    symptomPattern:
      'Dry, itchy, inflamed skin with recurrent flares, scaling, cracking, or thickened patches.',
    selfCare: [
      'Moisturize often, keep the skin barrier protected, and avoid overheating, harsh soaps, or known irritants.',
      'Keep nails short and avoid scratching when possible to reduce skin damage and infection risk.',
    ],
    safetyNet: [
      'Seek urgent review for pus, leaking fluid, crusting, rapidly spreading rash, fever, or feeling generally unwell.',
      'Seek review if symptoms are not responding to basic treatment or are significantly affecting sleep or daily life.',
    ],
    followUp:
      'Stable mild eczema can be managed at home, but infection or poor control needs reassessment.',
  },
  {
    id: 'contact-dermatitis',
    title: 'Contact dermatitis',
    keywords: [
      'contact dermatitis',
      'rash after contact',
      'irritant rash',
      'allergic rash',
      'blistered rash',
      'rash after soap',
      'rash after detergent',
      'rash after chemical',
    ],
    symptomPattern:
      'An itchy, inflamed, sometimes blistered rash that appears after contact with an irritant or allergen.',
    selfCare: [
      'Identify and avoid the likely trigger, rinse exposed skin, and support the skin barrier with emollients.',
      'Use protective measures such as gloves carefully and seek pharmacist guidance before anti-inflammatory topical products.',
    ],
    safetyNet: [
      'Seek review for persistent, recurrent, widespread, or severe symptoms, or when the trigger is unclear.',
      'Seek earlier review for facial or genital involvement or symptoms that are not improving with trigger avoidance.',
    ],
    followUp:
      'If avoiding the trigger and simple skin care do not help, clinician review is appropriate.',
  },
  {
    id: 'plantar-fasciitis',
    title: 'Plantar fasciitis',
    keywords: [
      'plantar fasciitis',
      'heel pain',
      'arch pain',
      'pain first steps',
      'foot pain in morning',
      'sole pain',
    ],
    symptomPattern:
      'Heel or arch pain that is often worse with the first steps after rest and improves somewhat with movement.',
    selfCare: [
      'Stretch the calf and foot, reduce aggravating activity, and use supportive shoes or insoles.',
      'Ice and relative rest can help during painful flares.',
    ],
    safetyNet: [
      'Seek review if pain is severe, function is worsening, or weight bearing becomes difficult.',
      'Seek review if symptoms are not improving over the next few weeks or the diagnosis is uncertain.',
    ],
    followUp:
      'A typical mild plantar fasciitis pattern can be managed conservatively if walking remains possible and symptoms gradually improve.',
  },
  {
    id: 'ankle-sprain',
    title: 'Ankle sprain',
    keywords: [
      'ankle sprain',
      'twisted ankle',
      'rolled ankle',
      'ankle injury',
      'ankle swelling',
      'ankle bruising',
    ],
    symptomPattern:
      'Pain, swelling, and bruising after twisting the ankle, often with reduced weight bearing but no obvious deformity.',
    selfCare: [
      'Use protection, relative rest, ice, compression, and elevation in the first few days, then begin gentle movement as tolerated.',
      'Support the joint and return to activity gradually rather than pushing through sharp pain.',
    ],
    safetyNet: [
      'Urgent assessment is needed for deformity, a crack at the time of injury, cold or blue foot, tingling, or inability to bear weight.',
      'Seek review if swelling or pain is worsening or not improving over about 2 weeks.',
    ],
    followUp:
      'Mild sprains should slowly improve with early support and rehab; lack of progress needs reassessment.',
  },
  {
    id: 'viral-conjunctivitis',
    title: 'Viral conjunctivitis',
    keywords: [
      'viral conjunctivitis',
      'pink eye',
      'red eye',
      'gritty eye',
      'burning eye',
      'watery eye',
      'sticky lashes',
      'eye discharge',
    ],
    symptomPattern:
      'A red, gritty, watery eye illness that may spread easily and can include discharge sticking to the lashes.',
    selfCare: [
      'Use gentle eyelid hygiene, cool compresses, and avoid contact lenses until fully better.',
      'Wash hands often and avoid sharing towels or pillowcases to reduce spread.',
    ],
    safetyNet: [
      'Urgent eye assessment is needed for eye pain, light sensitivity, vision change, or a very red eye.',
      'Contact lens wearers with red-eye symptoms need earlier urgent review because of corneal infection risk.',
    ],
    followUp:
      'If symptoms are not clearly improving within about 7 days, eye review is appropriate.',
  },
  {
    id: 'allergic-conjunctivitis',
    title: 'Allergic conjunctivitis',
    keywords: [
      'allergic conjunctivitis',
      'itchy eyes',
      'red itchy eyes',
      'watery eyes',
      'swollen eyelids',
      'eye allergy',
      'hay fever eyes',
    ],
    symptomPattern:
      'Usually both eyes become itchy, red, watery, and puffy, often with other allergy symptoms.',
    selfCare: [
      'Avoid rubbing the eyes and use cold compresses or lubricating drops for comfort.',
      'Consider pharmacist-guided allergy eye care if symptoms fit a typical allergy pattern.',
    ],
    safetyNet: [
      'Urgent eye review is needed for significant pain, light sensitivity, or blurred vision not explained by tearing.',
      'Seek earlier review if contact lenses are involved or symptoms are not controllable.',
    ],
    followUp:
      'Persistent or severe allergy eye symptoms should be assessed rather than repeatedly self-treated.',
  },
  {
    id: 'mild-acne',
    title: 'Mild acne',
    keywords: [
      'acne',
      'blackheads',
      'whiteheads',
      'papules',
      'pustules',
      'oily skin',
      'spots on face',
      'spots on chest',
      'spots on back',
    ],
    symptomPattern:
      'Comedones or small inflamed spots on the face, chest, or back with oily skin and no deep nodules.',
    selfCare: [
      'Cleanse gently, avoid picking or squeezing, and use non-comedogenic skin products.',
      'Pharmacist-guided benzoyl peroxide can be considered for mild acne, with caution for irritation and fabric bleaching.',
    ],
    safetyNet: [
      'Seek review for nodules, cysts, significant distress, or scarring risk.',
      'Seek review if consistent self-care and OTC treatment are not leading to improvement.',
    ],
    followUp:
      'Mild acne often improves slowly, so reassess over weeks rather than expecting a quick change in days.',
  },
  {
    id: 'oral-thrush',
    title: 'Oral thrush',
    keywords: [
      'oral thrush',
      'white patches in mouth',
      'sore mouth',
      'mouth candida',
      'tongue white patches',
      'cracks at mouth corners',
    ],
    symptomPattern:
      'White mouth patches with soreness, altered taste, cracked mouth corners, or pain when eating and drinking.',
    selfCare: [
      'Support good oral and denture hygiene and rinse after inhaler use when relevant.',
      'Do not assume every white tongue or mouth coating is thrush, because confirmation and antifungal treatment may be needed.',
    ],
    safetyNet: [
      'Seek review if eating or drinking is difficult, symptoms are recurrent, or the diagnosis is uncertain.',
      'Seek earlier review if immunosuppression or another major risk factor is present.',
    ],
    followUp:
      'Adult oral thrush usually deserves pharmacist or clinician assessment rather than home treatment alone.',
  },
  {
    id: 'external-haemorrhoids',
    title: 'External haemorrhoids',
    keywords: [
      'hemorrhoids',
      'haemorrhoids',
      'piles',
      'itchy anus',
      'anal lump',
      'bright red blood after stool',
      'pain around anus',
    ],
    symptomPattern:
      'Itching, discomfort, or a lump around the anus, sometimes with bright red bleeding after bowel movements.',
    selfCare: [
      'Use fluids and fiber to keep stools soft, avoid straining, and limit time on the toilet.',
      'Warm baths, wrapped cold packs, and short-term pharmacist-guided topical products can help with discomfort.',
    ],
    safetyNet: [
      'Seek urgent or same-day review for fever, pus, feeling unwell, heavy bleeding, or severe thrombosed pain.',
      'Any rectal bleeding should be clinically reviewed to rule out other causes, especially if persistent or recurrent.',
    ],
    followUp:
      'If symptoms are not improving with stool-softening measures and comfort care, reassessment is needed.',
  },
  {
    id: 'constipation',
    title: 'Constipation',
    keywords: [
      'constipation',
      'hard stool',
      'hard stools',
      'infrequent stool',
      'straining',
      'bloating',
      'incomplete emptying',
      'cannot poop',
    ],
    symptomPattern:
      'Hard or infrequent stools with straining, bloating, abdominal discomfort, or incomplete evacuation.',
    selfCare: [
      'Increase fiber gradually, drink enough fluids, and stay physically active when possible.',
      'Use a regular toilet routine and consider short-term pharmacist-guided laxatives if lifestyle measures are not enough.',
    ],
    safetyNet: [
      'Seek review for blood in stool, weight loss, persistent tiredness, sudden bowel habit change, or significant abdominal pain.',
      'Seek review if symptoms are not improving or may be related to medicines such as opioid painkillers.',
    ],
    followUp:
      'Short-lived mild constipation can be managed conservatively, but recurrent or persistent symptoms need review.',
  },
  {
    id: 'gerd-heartburn',
    title: 'GERD or heartburn',
    keywords: [
      'heartburn',
      'acid reflux',
      'gerd',
      'burning chest',
      'sour taste',
      'reflux',
      'food coming up',
    ],
    symptomPattern:
      'Burning discomfort behind the chest or upper abdomen with sour taste, worse after meals or when lying down.',
    selfCare: [
      'Avoid late meals and likely triggers, use smaller meals, and stay upright after eating.',
      'Pharmacist-guided short-term antacids or alginates can be considered, but they should not be framed as a long-term fix.',
    ],
    safetyNet: [
      'Seek review for food sticking in the throat, frequent vomiting, unexplained weight loss, or symptoms on most days.',
      'Seek review if symptoms are not improving despite lifestyle changes and simple pharmacy treatment.',
    ],
    followUp:
      'Occasional mild reflux can be self-managed, but persistent or progressive symptoms need medical review.',
  },
  {
    id: 'aphthous-mouth-ulcers',
    title: 'Aphthous mouth ulcers',
    keywords: [
      'mouth ulcer',
      'canker sore',
      'oral ulcer',
      'painful ulcer in mouth',
      'ulcer on tongue',
      'ulcer on cheek',
    ],
    symptomPattern:
      'One or more painful ulcers inside the mouth, often after irritation, stress, or minor trauma.',
    selfCare: [
      'Avoid spicy, salty, acidic, and rough foods, use a soft toothbrush, and prefer softer foods and cool drinks.',
      'Pharmacist-guided mouthwash or topical pain relief can be used for symptom relief.',
    ],
    safetyNet: [
      'Seek dental or medical review for an ulcer lasting more than about 3 weeks, unusual location, or increasing redness or bleeding.',
      'Seek earlier review for recurrent severe ulcers or ulcers with symptoms elsewhere in the body.',
    ],
    followUp:
      'Typical simple ulcers should improve within 1 to 2 weeks; a longer course needs assessment.',
  },
  {
    id: 'athletes-foot',
    title: "Athlete's foot",
    keywords: [
      "athlete's foot",
      'athletes foot',
      'tinea pedis',
      'itchy between toes',
      'flaky feet',
      'cracked skin between toes',
      'foot fungus',
    ],
    symptomPattern:
      'Itchy, flaky, cracked, or sore skin on the feet, especially between the toes, sometimes spreading to the sole.',
    selfCare: [
      'Use pharmacist-guided antifungal products and keep the feet clean and thoroughly dry, especially between the toes.',
      'Change socks regularly, avoid sharing towels or shoes, and reduce prolonged hot or sweaty footwear when possible.',
    ],
    safetyNet: [
      'Seek review if treatments are not working, the foot becomes hot, very painful, or red, or the infection spreads.',
      'Seek earlier assessment in diabetes or immunosuppression.',
    ],
    followUp:
      'If symptoms are not improving with OTC antifungal care, the diagnosis should be reassessed.',
  },
  {
    id: 'iron-deficiency',
    title: 'Suspected iron deficiency or mild iron-deficiency anemia',
    keywords: [
      'iron deficiency',
      'anemia',
      'anaemia',
      'fatigue',
      'pallor',
      'shortness of breath on exertion',
      'palpitations',
      'restless legs',
    ],
    symptomPattern:
      'Tiredness, low energy, pallor, breathlessness, headaches, or palpitations where iron deficiency is a possibility.',
    selfCare: [
      'Arrange clinical assessment and blood testing rather than trying to self-diagnose from fatigue alone.',
      'Supportive dietary advice can focus on iron-rich foods while avoiding overconfident supplement recommendations.',
    ],
    safetyNet: [
      'Possible iron deficiency should not be managed as simple self-care because the cause needs evaluation.',
      'Urgent review is needed sooner if symptoms are significant, progressive, or associated with possible bleeding.',
    ],
    followUp:
      'Use this profile mainly to steer the user toward evaluation, not to extend home-management advice.',
  },
];

const DEFAULT_EXAMPLE_IDS = ['common-cold', 'viral-gastroenteritis', 'ankle-sprain'];

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildSubmissionText = (submissionData = {}) => {
  const followUpSegments = Array.isArray(submissionData.followUpResponses)
    ? submissionData.followUpResponses.flatMap((item) => {
        const question = typeof item?.question === 'string' ? item.question : '';
        const answer = typeof item?.answer === 'string' ? item.answer : '';

        if (!question) {
          return [];
        }

        if (answer === 'yes') {
          return [question];
        }

        return [`${question} ${answer}`.trim()];
      })
    : [];

  return normalizeText([
    submissionData.symptoms,
    submissionData.duration,
    submissionData.severity,
    ...followUpSegments,
  ].join(' '));
};

const scoreConditionMatch = (condition, haystack) => {
  const hits = condition.keywords.filter((keyword) => haystack.includes(normalizeText(keyword)));
  return {
    condition,
    score: hits.length,
    hits,
  };
};

const formatConditionExample = (condition, scoreDetails) => {
  const hitLine =
    scoreDetails?.hits?.length > 0
      ? `Matched cues: ${scoreDetails.hits.join(', ')}.`
      : 'Representative example for a similar non-critical adult condition.';

  return [
    `- ${condition.title}: ${condition.symptomPattern}`,
    `  ${hitLine}`,
    `  Self-care anchors: ${condition.selfCare.join(' ')}`,
    `  Safety-net anchors: ${condition.safetyNet.join(' ')}`,
    `  Follow-up anchor: ${condition.followUp}`,
  ].join('\n');
};

const findRelevantConditionGuidance = (submissionData = {}, limit = 3) => {
  const submissionText = buildSubmissionText(submissionData);

  if (!submissionText) {
    return [];
  }

  return CONDITION_GUIDANCE.map((condition) => scoreConditionMatch(condition, submissionText))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.condition.title.localeCompare(right.condition.title))
    .slice(0, limit);
};

const buildNonCriticalGuidanceContext = (submissionData = {}) => {
  const relevantExamples = findRelevantConditionGuidance(submissionData);
  const hasDirectMatch = relevantExamples.length > 0;
  const fallbackExamples = DEFAULT_EXAMPLE_IDS.map((id) => CONDITION_GUIDANCE.find((condition) => condition.id === id))
    .filter(Boolean)
    .map((condition) => ({ condition, score: 0, hits: [] }));
  const examplesToUse = hasDirectMatch ? relevantExamples : fallbackExamples;

  const guidanceHeader = hasDirectMatch
    ? 'Evidence-based non-critical adult guidance examples relevant to this case:'
    : 'Evidence-based non-critical adult guidance examples to use as analogies if this case appears non-critical:';

  return [
    'EVIDENCE-BASED NON-CRITICAL GUIDANCE REFERENCE:',
    'General principles:',
    ...NON_CRITICAL_GUIDANCE_PRINCIPLES.map((principle) => `- ${principle}`),
    guidanceHeader,
    ...examplesToUse.map((entry) => formatConditionExample(entry.condition, entry)),
    'Use the examples above as grounding for self-care, red-flag escalation, and follow-up timing.',
  ].join('\n');
};

module.exports = {
  CONDITION_GUIDANCE,
  buildNonCriticalGuidanceContext,
  findRelevantConditionGuidance,
};
