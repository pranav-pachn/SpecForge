# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflow.spec.ts >> SpecForge Core Workflow E2E >> Validates 4-layer state machine and artifacts
- Location: tests\e2e\workflow.spec.ts:14:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e4]:
    - banner [ref=e5]:
      - link "SpecForge" [ref=e6] [cursor=pointer]:
        - /url: /
      - generic [ref=e13]:
        - button "Toggle theme" [ref=e14] [cursor=pointer]
        - link "Log in" [ref=e22] [cursor=pointer]:
          - /url: /login
        - link "View Demo" [ref=e23] [cursor=pointer]:
          - /url: /login?demo=true
        - link "Sign up" [ref=e24] [cursor=pointer]:
          - /url: /signup
    - main [ref=e25]:
      - generic [ref=e28]:
        - generic [ref=e29]:
          - generic [ref=e30]: SpecForge is now in Beta
          - heading "AI writes code. SpecForge tells it what to build." [level=1] [ref=e36]: AI writes code.SpecForge tells itwhat to build.
          - paragraph [ref=e37]: Transform rough ideas into engineering-ready specifications, plans, tasks, and AI execution packs.
          - paragraph [ref=e38]: Software projects fail because requirements, architecture, and implementation drift apart. SpecForge keeps them aligned.
          - generic [ref=e39]:
            - link "Start Building" [ref=e40] [cursor=pointer]:
              - /url: /dashboard
            - link "View Demo" [ref=e43] [cursor=pointer]:
              - /url: /login?demo=true
        - generic [ref=e46]:
          - paragraph [ref=e49]: 💡 Need authentication with Google, roles maybe admin, rate limiting?
          - generic [ref=e52]: Specification
          - generic [ref=e64]: Architecture
          - generic [ref=e77]: Tasks
          - generic [ref=e100]:
            - generic [ref=e101]: Execution
            - generic [ref=e102]: Cursor · Claude Code · Windsurf
          - generic [ref=e103]: Validation
      - generic [ref=e114]:
        - generic [ref=e115]:
          - heading "Give your AI the context it actually needs." [level=2] [ref=e116]
          - paragraph [ref=e117]: Export an Execution Pack and never paste a generic prompt again.
        - generic [ref=e119]:
          - generic [ref=e120]:
            - generic [ref=e121]:
              - generic [ref=e122]: TASK-04
              - heading "Implement Login API" [level=3] [ref=e123]
            - generic [ref=e124]: Ready
          - generic [ref=e128]:
            - generic [ref=e129]: Progress
            - generic [ref=e130]: 5 / 5 checks passed
          - generic [ref=e132]:
            - generic [ref=e133]:
              - generic [ref=e134]: Requirements
              - generic [ref=e139]: From §2.1 of spec
            - generic [ref=e142]:
              - generic [ref=e143]: Architecture
              - generic [ref=e148]: AuthService module
            - generic [ref=e151]:
              - generic [ref=e152]: Constraints
              - generic [ref=e157]: "Rate limit: 5/min"
            - generic [ref=e160]:
              - generic [ref=e161]: Acceptance
              - generic [ref=e166]: JWT, Audit, 429
            - generic [ref=e169]:
              - generic [ref=e170]: Tests
              - generic [ref=e175]: 3 auto-generated
          - button "Copy to Cursor" [ref=e178] [cursor=pointer]
      - generic [ref=e184]:
        - generic [ref=e185]:
          - heading "Specification First" [level=3] [ref=e192]
          - paragraph [ref=e193]: No more prompt chaos. Define what to build before the AI starts typing.
        - generic [ref=e194]:
          - heading "Execution Ready" [level=3] [ref=e198]
          - paragraph [ref=e199]: Generate per-task bundles with exact requirements, architecture, and tests.
        - generic [ref=e200]:
          - heading "Stay in Sync" [level=3] [ref=e207]
          - paragraph [ref=e208]: When requirements change, SpecForge flags stale artifacts and regenerates.
      - generic [ref=e211]:
        - heading "Built For" [level=2] [ref=e212]
        - generic [ref=e213]:
          - generic [ref=e214]: AI Engineers
          - generic [ref=e218]: Full Stack Developers
          - generic [ref=e222]: Startups
          - generic [ref=e226]: Hackathons
        - generic [ref=e230]:
          - heading "Used to build" [level=2] [ref=e231]
          - generic [ref=e232]:
            - generic [ref=e233]:
              - generic [ref=e234]: Web Apps
              - generic [ref=e235]: ·
            - generic [ref=e236]:
              - generic [ref=e237]: APIs
              - generic [ref=e238]: ·
            - generic [ref=e239]:
              - generic [ref=e240]: AI Products
              - generic [ref=e241]: ·
            - generic [ref=e242]: Internal Tools
      - generic [ref=e250]:
        - heading "Stop vibe coding. Start engineering." [level=2] [ref=e251]: Stop vibe coding.Start engineering.
        - link "Build with SpecForge" [ref=e253] [cursor=pointer]:
          - /url: /dashboard
    - contentinfo [ref=e256]:
      - generic [ref=e257]:
        - generic [ref=e258]: SpecForge
        - paragraph [ref=e264]: Built for the AI-assisted developer.
        - generic [ref=e265]:
          - link "GitHub" [ref=e266] [cursor=pointer]:
            - /url: https://github.com/pranav-pachn/SpecForge
          - link "Documentation" [ref=e267] [cursor=pointer]:
            - /url: "#"
          - link "Twitter" [ref=e268] [cursor=pointer]:
            - /url: "#"
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { e2eDb, clearE2EDatabase } from './helpers/db';
  3   | import { assertWorkflowStateConsistency, assertArtifactIntegrity } from './helpers/assertions';
  4   | 
  5   | test.describe('SpecForge Core Workflow E2E', () => {
  6   |   let testWorkflowId: string;
  7   | 
  8   |   test.beforeAll(async () => {
  9   |     // Isolated Test Infrastructure
  10  |     // DB URL should be set to e2e in env
  11  |     await clearE2EDatabase();
  12  |   });
  13  | 
  14  |   test('Validates 4-layer state machine and artifacts', async ({ page, request }) => {
  15  |     // --- 1. SETUP ---
  16  |     // Navigate to root to start
  17  |     await page.goto('/');
  18  | 
  19  |     // Create workflow via API to simulate initial DRAFT state
  20  |     const createRes = await request.post('/api/workflows', {
  21  |       data: {
  22  |         name: 'E2E Test Workflow',
  23  |         description: 'Testing the 4 layers',
  24  |         productType: 'SAAS'
  25  |       }
  26  |     });
> 27  |     expect(createRes.ok()).toBeTruthy();
      |                            ^ Error: expect(received).toBeTruthy()
  28  |     const workflow = await createRes.json();
  29  |     testWorkflowId = workflow.id;
  30  | 
  31  |     await page.goto(`/workflow/${testWorkflowId}`);
  32  | 
  33  |     // LAYER 1 & 2 & 3: State Machine, Artifact Integrity, and Refresh Durability
  34  | 
  35  |     // --- DRAFT ---
  36  |     await assertWorkflowStateConsistency(page, testWorkflowId, 'DRAFT');
  37  | 
  38  |     // LAYER 4: Negative Transitions
  39  |     // Attempt invalid transition DRAFT -> COMPLETED
  40  |     const invalidRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
  41  |       data: { status: 'COMPLETED' }
  42  |     });
  43  |     // Should fail (400 or 409 depending on implementation, but NOT 200)
  44  |     expect(invalidRes.ok()).toBeFalsy();
  45  |     
  46  |     // Check DB remains DRAFT
  47  |     await assertWorkflowStateConsistency(page, testWorkflowId, 'DRAFT');
  48  | 
  49  |     // Transition to CLARIFYING
  50  |     let transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
  51  |       data: { status: 'CLARIFYING' }
  52  |     });
  53  |     expect(transRes.ok()).toBeTruthy();
  54  |     await page.reload(); // Refresh Durability
  55  |     await assertWorkflowStateConsistency(page, testWorkflowId, 'CLARIFYING');
  56  |     await assertArtifactIntegrity(testWorkflowId, 'CLARIFYING');
  57  | 
  58  |     // Transition to SPEC_REVIEW
  59  |     transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
  60  |       data: { status: 'SPEC_REVIEW' }
  61  |     });
  62  |     expect(transRes.ok()).toBeTruthy();
  63  |     await page.reload();
  64  |     await assertWorkflowStateConsistency(page, testWorkflowId, 'SPEC_REVIEW');
  65  |     await assertArtifactIntegrity(testWorkflowId, 'SPEC_REVIEW');
  66  | 
  67  |     // Transition to PLANNING
  68  |     transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
  69  |       data: { status: 'PLANNING' }
  70  |     });
  71  |     expect(transRes.ok()).toBeTruthy();
  72  |     await page.reload();
  73  |     await assertWorkflowStateConsistency(page, testWorkflowId, 'PLANNING');
  74  |     await assertArtifactIntegrity(testWorkflowId, 'PLANNING');
  75  | 
  76  |     // Transition to TASK_BREAKDOWN
  77  |     transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
  78  |       data: { status: 'TASK_BREAKDOWN' }
  79  |     });
  80  |     expect(transRes.ok()).toBeTruthy();
  81  |     await page.reload();
  82  |     await assertWorkflowStateConsistency(page, testWorkflowId, 'TASK_BREAKDOWN');
  83  |     await assertArtifactIntegrity(testWorkflowId, 'TASK_BREAKDOWN');
  84  | 
  85  |     // LAYER 4: Negative Transition - readiness gate for EXECUTING
  86  |     // Attempt EXECUTING without execution packs should fail readiness checks
  87  |     const badExecRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
  88  |       data: { status: 'EXECUTING' }
  89  |     });
  90  |     expect(badExecRes.ok()).toBeFalsy(); // Because Execution Packs aren't ready
  91  | 
  92  |     // Transition to READY_FOR_EXECUTION
  93  |     transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
  94  |       data: { status: 'READY_FOR_EXECUTION' }
  95  |     });
  96  |     expect(transRes.ok()).toBeTruthy();
  97  |     await page.reload();
  98  |     await assertWorkflowStateConsistency(page, testWorkflowId, 'READY_FOR_EXECUTION');
  99  |     await assertArtifactIntegrity(testWorkflowId, 'READY_FOR_EXECUTION');
  100 | 
  101 |     // Transition to EXECUTING
  102 |     transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
  103 |       data: { status: 'EXECUTING' }
  104 |     });
  105 |     expect(transRes.ok()).toBeTruthy();
  106 |     await page.reload();
  107 |     await assertWorkflowStateConsistency(page, testWorkflowId, 'EXECUTING');
  108 |     await assertArtifactIntegrity(testWorkflowId, 'EXECUTING');
  109 | 
  110 |     // Transition to ENGINEERING_REVIEW
  111 |     transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
  112 |       data: { status: 'ENGINEERING_REVIEW' }
  113 |     });
  114 |     expect(transRes.ok()).toBeTruthy();
  115 |     await page.reload();
  116 |     await assertWorkflowStateConsistency(page, testWorkflowId, 'ENGINEERING_REVIEW');
  117 |     await assertArtifactIntegrity(testWorkflowId, 'ENGINEERING_REVIEW');
  118 | 
  119 |     // Transition to REVIEWING
  120 |     transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
  121 |       data: { status: 'REVIEWING' }
  122 |     });
  123 |     expect(transRes.ok()).toBeTruthy();
  124 |     await page.reload();
  125 |     await assertWorkflowStateConsistency(page, testWorkflowId, 'REVIEWING');
  126 |     await assertArtifactIntegrity(testWorkflowId, 'REVIEWING');
  127 | 
```