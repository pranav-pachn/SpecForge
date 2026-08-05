const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, '../src');

function fix(filePath, replacements) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  let newContent = content;
  for (const {from, to} of replacements) {
    if (typeof from === 'string') {
      newContent = newContent.split(from).join(to);
    } else {
      newContent = newContent.replace(from, to);
    }
  }
  if (content !== newContent) {
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`Fixed ${filePath}`);
  }
}

// 1. application -> enterprise paths
fix('src/application/ApprovalApplicationService.ts', [
  { from: "'../enterprise/governance/approval/ApprovalEngine'", to: "'@/platform/governance/approval/ApprovalEngine'" },
  { from: "'../enterprise/governance/rbac/PermissionGuard'", to: "'@/platform/governance/rbac/PermissionGuard'" }
]);

fix('src/application/WorkflowApplicationService.ts', [
  { from: "'../enterprise/governance/rbac/PermissionGuard'", to: "'@/platform/governance/rbac/PermissionGuard'" },
  { from: "'../enterprise/events/PlatformEventBus'", to: "'@/platform/events/PlatformEventBus'" },
  { from: "'../enterprise/governance/policy/PolicyEngine'", to: "'@/platform/governance/policy/PolicyEngine'" }
]);

// 2. lib/memory -> db paths
const memoryFiles = [
  'ConsolidationEngine.ts', 'DriftEngine.ts', 'MemoryEngine.ts', 'MemoryStore.ts', 
  'RelationshipResolver.ts', 'Timeline.ts'
];
for (const file of memoryFiles) {
  fix(`src/lib/memory/${file}`, [
    { from: "'../db'", to: "'@/platform/storage/db'" },
    { from: '"../db"', to: '"@/platform/storage/db"' }
  ]);
}

// 3. auth index
fix('src/platform/auth/index.ts', [
  { from: "'./db'", to: "'@/platform/storage/db'" },
  { from: '"./db"', to: '"@/platform/storage/db"' }
]);

// 4. organizations -> flags
fix('src/platform/organizations/OrganizationService.ts', [
  { from: "'../flags/CapabilityFlags'", to: "'@/platform/config/flags/CapabilityFlags'" }
]);

// 5. telemetry -> events
fix('src/platform/telemetry/analytics-ext/AnalyticsService.ts', [
  { from: "'../events/PlatformEventBus'", to: "'@/platform/events/PlatformEventBus'" },
  { from: "payload =>", to: "(payload: any) =>" } // fix the any type too
]);

fix('src/platform/telemetry/audit/AuditLogger.ts', [
  { from: "'../events/PlatformEventBus'", to: "'@/platform/events/PlatformEventBus'" },
  { from: "payload =>", to: "(payload: any) =>" }
]);

fix('src/platform/telemetry/audit/AuditMapper.ts', [
  { from: "'../events/PlatformEventBus'", to: "'@/platform/events/PlatformEventBus'" }
]);

fix('src/platform/telemetry/audit/FeedFormatter.ts', [
  { from: "'../events/PlatformEventBus'", to: "'@/platform/events/PlatformEventBus'" }
]);

// 6. tests
fix('testDrift.ts', [
  { from: "'./src/lib/db'", to: "'./src/platform/storage/db'" }
]);

fix('testImpact.ts', [
  { from: "'./src/lib/db'", to: "'./src/platform/storage/db'" }
]);

fix('testMemory.ts', [
  { from: "'./src/lib/db'", to: "'./src/platform/storage/db'" },
  { from: "const edges = mem.edges.map(m => ({", to: "const edges = mem.edges.map((m: any) => ({" }
]);

// 7. ContextBuilder
fix('src/lib/knowledge/ContextBuilder.ts', [
  { from: "const docs = results.map(m =>", to: "const docs = results.map((m: any) =>" },
  { from: "const similar = similarNodes.map(m =>", to: "const similar = similarNodes.map((m: any) =>" },
  { from: "const related = relatedMemories.map(m =>", to: "const related = relatedMemories.map((m: any) =>" }
]);
