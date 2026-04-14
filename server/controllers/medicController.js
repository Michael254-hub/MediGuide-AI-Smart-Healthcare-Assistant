const symptomRepository = require('../repositories/symptomRepository');
const {
  medicalProfessionalApplicationService,
} = require('../services/medicalProfessionalApplicationService');

const MEDIC_PERMISSIONS = [
  {
    id: 'priority_queue',
    title: 'Priority case queue',
    description: 'Review submitted assessments ordered by urgency and triage output.',
  },
  {
    id: 'clinical_recommendations',
    title: 'Clinical recommendations',
    description: 'See risk levels, emergency flags, and system recommendations for each case.',
  },
  {
    id: 'mediguid_ai',
    title: 'MediGuide AI support',
    description: 'Use the AI-assisted MediChat workspace for follow-up reasoning and case review.',
  },
  {
    id: 'professional_status',
    title: 'Verified role profile',
    description: 'Access your approved role, reviewer notes, and credential status in one place.',
  },
];

const HIGH_PRIORITY_LEVELS = new Set(['HIGH', 'EMERGENCY']);

const formatCase = (log) => ({
  id: log.id || log._id,
  riskLevel: log.risk_level || log.riskLevel,
  recommendation: log.recommendation,
  flaggedEmergency: Boolean(log.flagged_emergency ?? log.flaggedEmergency),
  createdAt: log.created_at || log.createdAt,
  patient: {
    name: log.submission_id?.user_id?.name || 'Unknown patient',
    email: log.submission_id?.user_id?.email || null,
  },
  submission: {
    symptoms: log.submission_id?.symptoms || '',
    duration: log.submission_id?.duration || '',
    severity: log.submission_id?.severity || '',
    submittedAt: log.submission_id?.submitted_at || log.submission_id?.submittedAt || null,
  },
});

const getMedicWorkspace = async (req, res, next) => {
  try {
    const [application, rawLogs] = await Promise.all([
      medicalProfessionalApplicationService.getMyApplication(req.user.id),
      symptomRepository.findAllLogsWithDetails(),
    ]);

    const cases = rawLogs.map(formatCase);
    const priorityCases = cases.filter((item) => HIGH_PRIORITY_LEVELS.has(item.riskLevel));
    const generatedAt = new Date().toISOString();
    const last24HoursIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    res.status(200).json({
      success: true,
      data: {
        professionalProfile: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
          role: req.user.role,
          approvedRole: application?.approvedRole || application?.desiredRole || null,
          status: application?.status || 'approved',
          reviewerNotes: application?.reviewerNotes || null,
          approvedAt: application?.reviewedAt || null,
          specialties: application?.specialties || [],
        },
        permissions: MEDIC_PERMISSIONS,
        stats: {
          totalCases: cases.length,
          priorityCases: priorityCases.length,
          emergencyCases: cases.filter((item) => item.flaggedEmergency).length,
          recentCases: cases.filter(
            (item) => item.createdAt && new Date(item.createdAt).toISOString() >= last24HoursIso
          ).length,
          generatedAt,
        },
        priorityQueue: priorityCases.slice(0, 12),
        recentCases: cases.slice(0, 12),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMedicWorkspace,
};
