const normalizeDurationDays = (duration) => {
  if (typeof duration === 'number' && Number.isFinite(duration)) {
    return duration;
  }

  const normalizedDuration = typeof duration === 'string' ? duration.trim().toLowerCase() : '';
  const durationDaysMap = {
    'just started (less than a day)': 0,
    '1-3 days': 3,
    '4-7 days': 7,
    '1-2 weeks': 14,
    'more than 2 weeks': 21,
  };

  return durationDaysMap[normalizedDuration] ?? 0;
};

const normalizeSeverityScore = (severity) => {
  if (typeof severity === 'number' && Number.isFinite(severity)) {
    return severity;
  }

  const normalizedSeverity = typeof severity === 'string' ? severity.trim().toLowerCase() : '';
  const severityScoreMap = {
    mild: 3,
    moderate: 6,
    severe: 9,
  };

  return severityScoreMap[normalizedSeverity] ?? 0;
};

/**
 * Classify triage risk from symptom text, duration, and severity.
 *
 * @param {string} symptomsText - Free-text description of symptoms.
 * @param {string|number} [duration=0] - Duration label or approximate days.
 * @param {string|number} [severity=0] - Severity label or approximate score.
 * @returns {{ level: string, recommendation: string, flaggedEmergency: boolean }}
 */
const classifyRisk = (symptomsText, duration = 0, severity = 0) => {
  const text = typeof symptomsText === 'string' ? symptomsText.toLowerCase() : '';
  const normalizedDurationDays = normalizeDurationDays(duration);
  const normalizedSeverityScore = normalizeSeverityScore(severity);

  const emergencyKeywords = [
    'chest pain',
    'difficulty breathing',
    'shortness of breath',
    'trouble breathing',
    'bleeding',
    'blood in your vomit',
    'blood in your stool',
    'blood in the urine',
    'unconscious',
    'unconsciousness',
    'stroke',
    'heart attack',
    'trouble speaking',
    'weakness',
    'numbness',
  ];
  const highKeywords = ['severe pain', 'high fever', 'vision loss', 'confusion', 'fainted', 'almost fainted'];
  const mediumKeywords = ['fever', 'headache', 'vomiting', 'nausea', 'dizziness'];

  // --- Step 1: Keyword matching ---

  // Emergency keywords always win regardless of severity/duration
  for (const keyword of emergencyKeywords) {
    if (text.includes(keyword)) {
      return {
        level: 'EMERGENCY',
        recommendation: '⚠ Possible medical emergency detected. Please visit the nearest hospital immediately or call emergency services.',
        flaggedEmergency: true
      };
    }
  }

  let keywordLevel = 'LOW';

  for (const keyword of highKeywords) {
    if (text.includes(keyword)) {
      keywordLevel = 'HIGH';
      break;
    }
  }

  if (keywordLevel === 'LOW') {
    let mediumMatchCount = 0;
    for (const keyword of mediumKeywords) {
      if (text.includes(keyword)) mediumMatchCount++;
    }
    if (mediumMatchCount >= 2 || (text.includes('fever') && text.includes('headache'))) {
      keywordLevel = 'MEDIUM';
    }
  }

  // --- Step 2: Numeric promotion using severity and duration ---

  const levels = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];
  const bump = (current, target) =>
    levels.indexOf(target) > levels.indexOf(current) ? target : current;

  let level = keywordLevel;

  // Severity 9–10 → at least EMERGENCY; severity 8 → at least HIGH
  if (normalizedSeverityScore >= 9) {
    level = bump(level, 'EMERGENCY');
  } else if (normalizedSeverityScore >= 8) {
    level = bump(level, 'HIGH');
  }

  // Symptoms lasting more than a week that haven't self-resolved → escalate one tier
  if (normalizedDurationDays > 7) {
    const nextIdx = Math.min(levels.indexOf(level) + 1, levels.length - 1);
    level = levels[nextIdx];
  }

  // --- Step 3: Build response ---

  const recommendations = {
    EMERGENCY: '⚠ Possible medical emergency detected. Please visit the nearest hospital immediately or call emergency services.',
    HIGH:      'Please seek medical attention from a doctor as soon as possible.',
    MEDIUM:    'Please consult with a healthcare professional or visit an urgent care center.',
    LOW:       'Your symptoms appear mild. Please rest, stay hydrated, and monitor your condition. Consult a doctor if symptoms worsen.'
  };

  return {
    level,
    recommendation: recommendations[level],
    flaggedEmergency: level === 'EMERGENCY'
  };
};

module.exports = {
  classifyRisk,
  normalizeDurationDays,
  normalizeSeverityScore,
};
