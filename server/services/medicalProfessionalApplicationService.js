const AppError = require('../errors/AppError');
const medicalProfessionalApplicationRepository = require('../repositories/medicalProfessionalApplicationRepository');
const userRepository = require('../repositories/userRepository');

const APPLICATION_ROLE_OPTIONS = [
  'general_practitioner',
  'specialist_physician',
  'nurse',
  'pharmacist',
  'mental_health_professional',
  'nutrition_specialist',
  'physiotherapist',
];

const normalizeStringArray = (values = []) =>
  [...new Set((Array.isArray(values) ? values : []).map((item) => item.trim()).filter(Boolean))];

const formatUserSummary = (user) =>
  user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      }
    : null;

class MedicalProfessionalApplicationService {
  formatApplication(application, relatedUsersById = new Map()) {
    if (!application) {
      return null;
    }

    return {
      id: application.id,
      userId: application.user_id,
      desiredRole: application.desired_role,
      licenseNumber: application.license_number,
      licensingAuthority: application.licensing_authority,
      licenseJurisdiction: application.license_jurisdiction,
      licenseExpiryDate: application.license_expiry_date,
      educationInstitution: application.education_institution,
      educationQualification: application.education_qualification,
      educationGraduationYear: application.education_graduation_year,
      yearsOfExperience: application.years_of_experience,
      currentEmployer: application.current_employer,
      workExperienceSummary: application.work_experience_summary,
      specialties: application.specialties || [],
      supportingDocuments: application.supporting_documents || [],
      professionalStatement: application.professional_statement,
      status: application.status,
      reviewerNotes: application.reviewer_notes,
      reviewedBy: application.reviewed_by,
      reviewedAt: application.reviewed_at,
      approvedRole: application.approved_role,
      createdAt: application.created_at,
      updatedAt: application.updated_at,
      applicant: formatUserSummary(relatedUsersById.get(application.user_id)),
      reviewer: formatUserSummary(relatedUsersById.get(application.reviewed_by)),
    };
  }

  async getMyApplication(userId) {
    const application = await medicalProfessionalApplicationRepository.findByUserId(userId);
    return this.formatApplication(application);
  }

  async submitApplication(user, applicationPayload) {
    if (!user?.id) {
      throw new AppError('Authenticated user is required', 401, {
        code: 'AUTH_REQUIRED',
      });
    }

    if (user.role === 'admin') {
      throw new AppError('Administrators do not need to submit professional applications', 403, {
        code: 'ADMIN_APPLICATION_NOT_ALLOWED',
      });
    }

    const existingApplication = await medicalProfessionalApplicationRepository.findByUserId(user.id);

    if (existingApplication?.status === 'approved') {
      throw new AppError('This application has already been approved and is locked for editing', 409, {
        code: 'APPROVED_APPLICATION_LOCKED',
      });
    }

    const now = new Date().toISOString();
    const savedApplication = await medicalProfessionalApplicationRepository.saveForUser(user.id, {
      desired_role: applicationPayload.desiredRole,
      license_number: applicationPayload.licenseNumber,
      licensing_authority: applicationPayload.licensingAuthority,
      license_jurisdiction: applicationPayload.licenseJurisdiction,
      license_expiry_date: applicationPayload.licenseExpiryDate,
      education_institution: applicationPayload.educationInstitution,
      education_qualification: applicationPayload.educationQualification,
      education_graduation_year: applicationPayload.educationGraduationYear,
      years_of_experience: applicationPayload.yearsOfExperience,
      current_employer: applicationPayload.currentEmployer,
      work_experience_summary: applicationPayload.workExperienceSummary,
      specialties: normalizeStringArray(applicationPayload.specialties),
      supporting_documents: normalizeStringArray(applicationPayload.supportingDocuments),
      professional_statement: applicationPayload.professionalStatement,
      status: 'pending',
      reviewer_notes: null,
      reviewed_by: null,
      reviewed_at: null,
      approved_role: null,
      updated_at: now,
    });

    return this.formatApplication(savedApplication);
  }

  async listApplications() {
    const applications = await medicalProfessionalApplicationRepository.listAll();
    const relatedUserIds = applications.flatMap((application) => [
      application.user_id,
      application.reviewed_by,
    ]);
    const relatedUsers = await userRepository.findManyByIds(relatedUserIds);
    const relatedUsersById = new Map(relatedUsers.map((user) => [user.id, user]));

    return applications.map((application) => this.formatApplication(application, relatedUsersById));
  }

  async countPendingApplications() {
    return medicalProfessionalApplicationRepository.countPending();
  }

  getReviewedUserRole(currentRole, applicationStatus) {
    if (currentRole === 'admin') {
      return 'admin';
    }

    return applicationStatus === 'approved' ? 'medical_professional' : 'patient';
  }

  async reviewApplication(applicationId, reviewerId, reviewPayload) {
    const application = await medicalProfessionalApplicationRepository.findById(applicationId);

    if (!application) {
      throw new AppError('Professional application not found', 404, {
        code: 'PROFESSIONAL_APPLICATION_NOT_FOUND',
      });
    }

    const applicant = await userRepository.findById(application.user_id);

    if (!applicant) {
      throw new AppError('Applicant account could not be found', 404, {
        code: 'APPLICANT_NOT_FOUND',
      });
    }

    const approvedRole =
      reviewPayload.status === 'approved'
        ? reviewPayload.approvedRole || application.desired_role
        : null;

    if (approvedRole && !APPLICATION_ROLE_OPTIONS.includes(approvedRole)) {
      throw new AppError('Approved role is invalid', 400, {
        code: 'INVALID_APPROVED_ROLE',
      });
    }

    const now = new Date().toISOString();
    const reviewedApplication = await medicalProfessionalApplicationRepository.review(applicationId, {
      status: reviewPayload.status,
      reviewer_notes: reviewPayload.reviewerNotes,
      reviewed_by: reviewerId,
      reviewed_at: now,
      approved_role: approvedRole,
      updated_at: now,
    });

    const nextApplicantRole = this.getReviewedUserRole(applicant.role, reviewPayload.status);
    if (applicant.role !== nextApplicantRole) {
      await userRepository.update(applicant.id, {
        role: nextApplicantRole,
        updated_at: now,
      });
    }

    const relatedUsers = await userRepository.findManyByIds([
      reviewedApplication.user_id,
      reviewedApplication.reviewed_by,
    ]);
    const relatedUsersById = new Map(relatedUsers.map((user) => [user.id, user]));

    return this.formatApplication(reviewedApplication, relatedUsersById);
  }
}

module.exports = {
  medicalProfessionalApplicationService: new MedicalProfessionalApplicationService(),
  APPLICATION_ROLE_OPTIONS,
};
