/**
 * Classify triage risk from symptom text, duration, and severity.
 *
 * @param {string} symptomsText - Free-text description of symptoms.
 * @param {number} [duration=0]  - Duration in days the patient has had symptoms.
 * @param {number} [severity=0]  - Patient-reported severity on a 1-10 scale.
 * @returns {{ level: string, recommendation: string, flaggedEmergency: boolean }}
 */
const classifyRisk = (symptomsText, duration = 0, severity = 0) => {
  const text = symptomsText.toLowerCase();

  const emergencyKeywords = ['chest pain', 'difficulty breathing', 'bleeding', 'unconscious', 'unconsciousness', 'stroke', 'heart attack'];
  const highKeywords = ['severe pain', 'high fever', 'vision loss', 'confusion'];
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
  if (severity >= 9) {
    level = bump(level, 'EMERGENCY');
  } else if (severity >= 8) {
    level = bump(level, 'HIGH');
  }

  // Symptoms lasting more than a week that haven't self-resolved → escalate one tier
  if (duration > 7) {
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

module.exports = { classifyRisk };
