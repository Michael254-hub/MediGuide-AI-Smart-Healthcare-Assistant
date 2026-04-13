jest.mock('../repositories/medicalProfessionalApplicationRepository', () => ({
  findByUserId: jest.fn(),
  findById: jest.fn(),
  saveForUser: jest.fn(),
  listAll: jest.fn(),
  review: jest.fn(),
  countPending: jest.fn(),
}));

jest.mock('../repositories/userRepository', () => ({
  findById: jest.fn(),
  findManyByIds: jest.fn(),
  update: jest.fn(),
}));

const medicalProfessionalApplicationRepository = require('../repositories/medicalProfessionalApplicationRepository');
const userRepository = require('../repositories/userRepository');
const {
  medicalProfessionalApplicationService,
} = require('../services/medicalProfessionalApplicationService');

describe('medicalProfessionalApplicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits a pending application and clears prior review decisions', async () => {
    medicalProfessionalApplicationRepository.findByUserId.mockResolvedValue({
      id: 'app-1',
      user_id: 'user-1',
      status: 'rejected',
    });

    medicalProfessionalApplicationRepository.saveForUser.mockResolvedValue({
      id: 'app-1',
      user_id: 'user-1',
      desired_role: 'nurse',
      license_number: 'KNH-2233',
      licensing_authority: 'Kenya Medical Practitioners and Dentists Council',
      license_jurisdiction: 'Kenya',
      license_expiry_date: '2027-09-01',
      education_institution: 'University of Nairobi',
      education_qualification: 'Bachelor of Science in Nursing',
      education_graduation_year: 2018,
      years_of_experience: 7,
      current_employer: 'MediCare Hospital',
      work_experience_summary: 'Seven years of nursing experience in triage, telehealth, and patient education.',
      specialties: ['triage', 'telemedicine'],
      supporting_documents: ['License scan reference'],
      professional_statement: 'Ready to support patients when escalation is needed.',
      status: 'pending',
      reviewer_notes: null,
      reviewed_by: null,
      reviewed_at: null,
      approved_role: null,
      created_at: '2026-04-13T10:00:00.000Z',
      updated_at: '2026-04-13T10:05:00.000Z',
    });

    const result = await medicalProfessionalApplicationService.submitApplication(
      { id: 'user-1', role: 'patient' },
      {
        desiredRole: 'nurse',
        licenseNumber: 'KNH-2233',
        licensingAuthority: 'Kenya Medical Practitioners and Dentists Council',
        licenseJurisdiction: 'Kenya',
        licenseExpiryDate: '2027-09-01',
        educationInstitution: 'University of Nairobi',
        educationQualification: 'Bachelor of Science in Nursing',
        educationGraduationYear: 2018,
        yearsOfExperience: 7,
        currentEmployer: 'MediCare Hospital',
        workExperienceSummary:
          'Seven years of nursing experience in triage, telehealth, and patient education.',
        specialties: ['triage', 'telemedicine', 'triage'],
        supportingDocuments: ['License scan reference'],
        professionalStatement: 'Ready to support patients when escalation is needed.',
      }
    );

    expect(medicalProfessionalApplicationRepository.saveForUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        status: 'pending',
        reviewer_notes: null,
        reviewed_by: null,
        approved_role: null,
        specialties: ['triage', 'telemedicine'],
      })
    );
    expect(result.status).toBe('pending');
    expect(result.specialties).toEqual(['triage', 'telemedicine']);
  });

  it('approves an application and upgrades the applicant role', async () => {
    medicalProfessionalApplicationRepository.findById.mockResolvedValue({
      id: 'app-2',
      user_id: 'user-2',
      desired_role: 'pharmacist',
      status: 'pending',
    });

    userRepository.findById.mockResolvedValue({
      id: 'user-2',
      role: 'patient',
    });

    medicalProfessionalApplicationRepository.review.mockResolvedValue({
      id: 'app-2',
      user_id: 'user-2',
      desired_role: 'pharmacist',
      license_number: 'PHA-100',
      licensing_authority: 'Pharmacy and Poisons Board',
      license_jurisdiction: 'Kenya',
      license_expiry_date: '2028-02-01',
      education_institution: 'Kenyatta University',
      education_qualification: 'Bachelor of Pharmacy',
      education_graduation_year: 2016,
      years_of_experience: 9,
      current_employer: 'City Pharmacy',
      work_experience_summary: 'Clinical pharmacist with strong outpatient counseling experience.',
      specialties: ['medication safety'],
      supporting_documents: ['Registration certificate'],
      professional_statement: 'Focused on safe medication guidance.',
      status: 'approved',
      reviewer_notes: 'Credentials verified against submitted details.',
      reviewed_by: 'admin-1',
      reviewed_at: '2026-04-13T10:30:00.000Z',
      approved_role: 'pharmacist',
      created_at: '2026-04-12T08:00:00.000Z',
      updated_at: '2026-04-13T10:30:00.000Z',
    });

    userRepository.findManyByIds.mockResolvedValue([
      {
        id: 'user-2',
        name: 'Alex Doe',
        email: 'alex@example.com',
        phone: '+254700000000',
        role: 'medical_professional',
      },
      {
        id: 'admin-1',
        name: 'Admin Reviewer',
        email: 'admin@example.com',
        phone: null,
        role: 'admin',
      },
    ]);

    const result = await medicalProfessionalApplicationService.reviewApplication(
      'app-2',
      'admin-1',
      {
        status: 'approved',
        reviewerNotes: 'Credentials verified against submitted details.',
      }
    );

    expect(userRepository.update).toHaveBeenCalledWith(
      'user-2',
      expect.objectContaining({ role: 'medical_professional' })
    );
    expect(result.status).toBe('approved');
    expect(result.approvedRole).toBe('pharmacist');
    expect(result.applicant.name).toBe('Alex Doe');
    expect(result.reviewer.name).toBe('Admin Reviewer');
  });
});
