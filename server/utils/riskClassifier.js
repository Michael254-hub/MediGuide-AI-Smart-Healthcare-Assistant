const classifyRisk = (symptomsText) => {
  const text = symptomsText.toLowerCase();
  
  const emergencyKeywords = ['chest pain', 'difficulty breathing', 'breathing', 'bleeding', 'unconscious', 'unconsciousness', 'stroke', 'heart attack'];
  const highKeywords = ['severe pain', 'high fever', 'vision loss', 'confusion'];
  const mediumKeywords = ['fever', 'headache', 'vomiting', 'nausea', 'dizziness'];
  
  // Check for emergency
  for (const keyword of emergencyKeywords) {
    if (text.includes(keyword)) {
      return {
        level: 'EMERGENCY',
        recommendation: '⚠ Possible medical emergency detected. Please visit the nearest hospital immediately or call emergency services.',
        flaggedEmergency: true
      };
    }
  }

  // Check for high risk
  for (const keyword of highKeywords) {
    if (text.includes(keyword)) {
      return {
        level: 'HIGH',
        recommendation: 'Please seek medical attention from a doctor as soon as possible.',
        flaggedEmergency: false
      };
    }
  }

  // Check for medium risk
  let mediumMatchCount = 0;
  for (const keyword of mediumKeywords) {
    if (text.includes(keyword)) {
      mediumMatchCount++;
    }
  }
  
  if (mediumMatchCount >= 2 || (text.includes('fever') && text.includes('headache'))) {
    return {
      level: 'MEDIUM',
      recommendation: 'Please consult with a healthcare professional or visit an urgent care center.',
      flaggedEmergency: false
    };
  }

  // Default low risk
  return {
    level: 'LOW',
    recommendation: 'Your symptoms appear mild. Please rest, stay hydrated, and monitor your condition. Consult a doctor if symptoms worsen.',
    flaggedEmergency: false
  };
};

module.exports = {
  classifyRisk
};
