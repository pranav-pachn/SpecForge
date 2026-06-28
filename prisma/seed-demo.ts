import { PrismaClient, WorkflowStatus, ArtifactType, ArtifactVersionStatus, TaskStatus, ToolName } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Job Application Workflow demo data...');

  // 1. Create a demo user
  const passwordHash = await bcrypt.hash('password123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@specforge.com' },
    update: {},
    create: {
      email: 'demo@specforge.com',
      name: 'Demo User',
      passwordHash,
    },
  });

  // 2. Create workspace & project
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Corp',
      members: {
        create: {
          userId: demoUser.id,
          role: 'ADMIN',
        },
      },
    },
  });

  const project = await prisma.project.create({
    data: {
      name: 'Applicant Tracking System',
      description: 'Internal ATS for hiring pipeline',
      workspaceId: workspace.id,
    },
  });

  // 3. Create the flagship workflow (Job Application Pipeline)
  const workflow = await prisma.workflow.create({
    data: {
      name: 'Candidate Portal & Resume Parser',
      status: WorkflowStatus.PLANNING, // It's currently in planning phase
      projectId: project.id,
      creatorId: demoUser.id,
    },
  });

  // 4. Create SPEC Artifact
  const specContent = `# Candidate Portal & Resume Parser

## 1. Feature Description
A candidate-facing portal where applicants can submit their resumes, which are automatically parsed into structured data for the hiring team.

## 2. Target Audience
- Candidates applying for open roles
- Recruiters reviewing parsed profiles

## 3. Business Goal
Reduce manual data entry for candidates by 80% and standardize applicant profiles for faster recruiter screening.

## 4. Key Use Cases
- Candidate uploads a PDF resume and sees auto-filled form fields.
- Candidate confirms or edits the parsed data before final submission.
- Recruiter views standardized candidate profile in the ATS dashboard.

## 5. Non-Goals (Out of Scope)
- Video interviews or assessments
- Automated resume scoring/ranking (AI evaluation)

## 6. Constraints & Assumptions
- Must use Next.js App Router and TailwindCSS.
- Resume parsing will use a 3rd-party API (e.g., Affinda or custom OpenAI prompt).
- Strict PII handling required; data must be encrypted at rest.

## 7. Data Models
- \`CandidateProfile\`: id, userId, parsedData, resumeUrl, status.
- \`JobApplication\`: id, candidateId, jobId, stage.

## 8. State Management
- Candidate form state needs complex validation (Zod + React Hook Form).

## 9. Third-Party Dependencies
- AWS S3 / Vercel Blob for PDF storage.
- OpenAI API for parsing (or dedicated resume parser API).

## 10. Security & Privacy
- Resumes are sensitive. Signed URLs for access.

## 11. Edge Cases
- Unparseable PDFs (image-based).
- Rate limits on the parsing API.

## 12. Success Metrics
- 95% of candidates use the auto-parse feature.
- Time to complete application < 2 minutes.`;

  const specArtifact = await prisma.artifact.create({
    data: {
      workflowId: workflow.id,
      type: ArtifactType.SPEC,
      title: 'Feature Specification',
      versions: {
        create: {
          version: 1,
          content: specContent,
          status: ArtifactVersionStatus.APPROVED, // Spec is approved
        },
      },
    },
  });

  const specVersionId = (await prisma.artifactVersion.findFirst({ where: { artifactId: specArtifact.id } }))!.id;

  // 5. Create PLAN Artifact (Draft)
  const planContent = `# Implementation Plan: Candidate Portal

## Architecture
- **Frontend**: Next.js App Router (\`/apply\`, \`/dashboard/candidates\`)
- **Backend**: Next.js Server Actions for form submission and parsing.
- **Storage**: Vercel Blob for PDF uploads.
- **Parsing**: OpenAI structured output for extracting \`{name, email, experience, education}\`.

## Components
1. \`FileUploadDropzone\`: Handles PDF selection and upload.
2. \`ApplicationForm\`: React Hook Form bound to Zod schema, auto-populates from parse result.
3. \`CandidateProfileView\`: Recruiter facing read-only view.

## Sequencing
1. Setup database schema (Prisma) and S3/Blob storage.
2. Build PDF upload endpoint and parser integration.
3. Build the Candidate UI (Dropzone + Form).
4. Build the Recruiter UI (Profile View).

## Risks
- OpenAI structured output might occasionally fail or hallucinate on weird resume formats.
  - *Mitigation*: Fallback to manual entry if parsing fails or takes > 5 seconds.`;

  await prisma.artifact.create({
    data: {
      workflowId: workflow.id,
      type: ArtifactType.PLAN,
      title: 'Implementation Plan',
      versions: {
        create: {
          version: 1,
          content: planContent,
          status: ArtifactVersionStatus.DRAFT, // Plan is currently being edited/reviewed
        },
      },
    },
  });

  // 6. Create some sample tasks that *would* be generated from this plan
  await prisma.task.createMany({
    data: [
      {
        workflowId: workflow.id,
        versionId: specVersionId,
        title: 'Setup Database and Storage',
        description: 'Add CandidateProfile and JobApplication models. Configure Vercel Blob for resume uploads.',
        acceptanceCriteria: 'Models exist in schema. Prisma client generated. S3/Blob env vars configured.',
        status: TaskStatus.TODO,
        order: 1,
      },
      {
        workflowId: workflow.id,
        versionId: specVersionId,
        title: 'Build Resume Parser Integration',
        description: 'Create a Server Action that takes a PDF URL, extracts text, and uses OpenAI to return structured JSON matching the CandidateProfile schema.',
        acceptanceCriteria: 'Action returns strictly typed JSON. Handles parsing errors gracefully.',
        status: TaskStatus.TODO,
        order: 2,
      },
      {
        workflowId: workflow.id,
        versionId: specVersionId,
        title: 'Candidate Application UI',
        description: 'Implement FileUploadDropzone and the dynamic ApplicationForm that auto-fills when parsing completes.',
        acceptanceCriteria: 'Form validates with Zod. Uploading a PDF triggers parsing and updates form fields.',
        status: TaskStatus.TODO,
        order: 3,
      }
    ]
  });

  console.log('Seeding complete! You can log in with:');
  console.log('Email: demo@specforge.com');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
