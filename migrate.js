const fs = require('fs-extra');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const rootDir = __dirname;

async function migrate() {
  console.log('Starting migration...');

  // 1. Create docs/ and move docs
  await fs.ensureDir(path.join(rootDir, 'docs'));
  for (const file of ['ARCHITECTURE.md', 'CLAUDE.md', 'DEMO_SCRIPT.md']) {
    if (await fs.pathExists(path.join(rootDir, file))) {
      await fs.move(path.join(rootDir, file), path.join(rootDir, 'docs', file));
    }
  }

  // 2. Create new component folders
  await fs.ensureDir(path.join(srcDir, 'components/layout'));
  await fs.ensureDir(path.join(srcDir, 'components/shared'));

  // Move generic components
  const componentsToLayout = ['Navbar.tsx', 'Sidebar.tsx'];
  for (const file of componentsToLayout) {
    if (await fs.pathExists(path.join(srcDir, 'components', file))) {
      await fs.move(path.join(srcDir, 'components', file), path.join(srcDir, 'components/layout', file));
    }
  }

  if (await fs.pathExists(path.join(srcDir, 'components/Providers.tsx'))) {
    await fs.move(path.join(srcDir, 'components/Providers.tsx'), path.join(srcDir, 'components/shared/Providers.tsx'));
  }

  // 3. Set up features
  const features = ['workflows', 'specs', 'plans', 'tasks', 'execution-packs', 'review', 'validation', 'drift', 'dashboard'];
  for (const feature of features) {
    await fs.ensureDir(path.join(srcDir, 'features', feature));
  }

  // Move existing components to features
  // artifacts -> specs/components
  if (await fs.pathExists(path.join(srcDir, 'components/artifacts'))) {
    await fs.move(path.join(srcDir, 'components/artifacts'), path.join(srcDir, 'features/specs/components'));
  }
  // editors -> specs/components
  if (await fs.pathExists(path.join(srcDir, 'components/editors'))) {
    await fs.move(path.join(srcDir, 'components/editors'), path.join(srcDir, 'features/specs/components/editors'));
  }
  // workflow-tabs -> workflows/components
  if (await fs.pathExists(path.join(srcDir, 'components/workflow-tabs'))) {
    await fs.move(path.join(srcDir, 'components/workflow-tabs'), path.join(srcDir, 'features/workflows/components/workflow-tabs'));
  }
  // workflows -> workflows/components
  if (await fs.pathExists(path.join(srcDir, 'components/workflows'))) {
    await fs.move(path.join(srcDir, 'components/workflows'), path.join(srcDir, 'features/workflows/components/workflows'));
  }

  // Move existing features to new structure if they mismatch
  if (await fs.pathExists(path.join(srcDir, 'features/artifacts'))) {
    await fs.move(path.join(srcDir, 'features/artifacts'), path.join(srcDir, 'features/specs'), { overwrite: false }).catch(e => {
        // manually merge if exists
        fs.copySync(path.join(srcDir, 'features/artifacts'), path.join(srcDir, 'features/specs'));
        fs.removeSync(path.join(srcDir, 'features/artifacts'));
    });
  }
  
  if (await fs.pathExists(path.join(srcDir, 'features/approvals'))) {
      fs.copySync(path.join(srcDir, 'features/approvals'), path.join(srcDir, 'features/review'));
      fs.removeSync(path.join(srcDir, 'features/approvals'));
  }

  if (await fs.pathExists(path.join(srcDir, 'features/execution'))) {
      fs.copySync(path.join(srcDir, 'features/execution'), path.join(srcDir, 'features/execution-packs'));
      fs.removeSync(path.join(srcDir, 'features/execution'));
  }

  // 4. Set up lib/
  await fs.ensureDir(path.join(srcDir, 'lib/db'));
  await fs.ensureDir(path.join(srcDir, 'lib/utils'));
  await fs.ensureDir(path.join(srcDir, 'lib/constants'));

  if (await fs.pathExists(path.join(srcDir, 'lib/db.ts'))) {
    await fs.move(path.join(srcDir, 'lib/db.ts'), path.join(srcDir, 'lib/db/index.ts'), { overwrite: true });
  }
  if (await fs.pathExists(path.join(srcDir, 'lib/utils.ts'))) {
    await fs.move(path.join(srcDir, 'lib/utils.ts'), path.join(srcDir, 'lib/utils/index.ts'), { overwrite: true });
  }
  if (await fs.pathExists(path.join(srcDir, 'lib/constants.ts'))) {
    await fs.move(path.join(srcDir, 'lib/constants.ts'), path.join(srcDir, 'lib/constants/index.ts'), { overwrite: true });
  }

  // Move ai to lib
  if (await fs.pathExists(path.join(srcDir, 'ai'))) {
    try {
      await fs.move(path.join(srcDir, 'ai'), path.join(srcDir, 'lib/ai'), { overwrite: true });
    } catch (e) {
      console.log('Skipping ai move', e.message);
    }
  }

  // 5. Set up server/
  await fs.ensureDir(path.join(srcDir, 'server/actions'));
  await fs.ensureDir(path.join(srcDir, 'server/services'));
  await fs.ensureDir(path.join(srcDir, 'server/repositories'));

  // Move some lib server-side stuff
  if (await fs.pathExists(path.join(srcDir, 'lib/api-helpers.ts'))) {
    await fs.move(path.join(srcDir, 'lib/api-helpers.ts'), path.join(srcDir, 'server/services/api-helpers.ts'), { overwrite: true });
  }
  if (await fs.pathExists(path.join(srcDir, 'lib/drift-engine.ts'))) {
    await fs.move(path.join(srcDir, 'lib/drift-engine.ts'), path.join(srcDir, 'server/services/drift-engine.ts'), { overwrite: true });
  }

  console.log('Moved folders successfully. Now updating imports...');

  // Helper to walk through directories
  async function getFiles(dir) {
    const subdirs = await fs.readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
      const res = path.resolve(dir, subdir);
      return (await fs.stat(res)).isDirectory() ? getFiles(res) : res;
    }));
    return files.reduce((a, f) => a.concat(f), []);
  }

  const allFiles = await getFiles(srcDir);
  const tsFiles = allFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

  for (const file of tsFiles) {
    let content = await fs.readFile(file, 'utf8');
    let original = content;

    // We do simple string replaces for the aliased imports
    // Components
    content = content.replace(/@\/components\/Navbar/g, '@/components/layout/Navbar');
    content = content.replace(/@\/components\/Sidebar/g, '@/components/layout/Sidebar');
    content = content.replace(/@\/components\/Providers/g, '@/components/shared/Providers');
    content = content.replace(/@\/components\/artifacts/g, '@/features/specs/components');
    content = content.replace(/@\/components\/editors/g, '@/features/specs/components/editors');
    content = content.replace(/@\/components\/workflow-tabs/g, '@/features/workflows/components/workflow-tabs');
    content = content.replace(/@\/components\/workflows/g, '@/features/workflows/components/workflows');

    // Features renaming
    content = content.replace(/@\/features\/artifacts/g, '@/features/specs');
    content = content.replace(/@\/features\/approvals/g, '@/features/review');
    content = content.replace(/@\/features\/execution/g, '@/features/execution-packs');

    // Lib renaming
    content = content.replace(/@\/lib\/db/g, '@/lib/db'); // wait, db.ts changed to db/index.ts. Default imports from db will work if it's index.ts. But if it was `import ... from '@/lib/db'` it now resolves to `db/index.ts` automatically!
    content = content.replace(/@\/lib\/utils/g, '@/lib/utils'); 
    content = content.replace(/@\/lib\/constants/g, '@/lib/constants'); 

    content = content.replace(/@\/ai/g, '@/lib/ai');
    content = content.replace(/@\/lib\/api-helpers/g, '@/server/services/api-helpers');
    content = content.replace(/@\/lib\/drift-engine/g, '@/server/services/drift-engine');

    if (content !== original) {
      await fs.writeFile(file, content, 'utf8');
    }
  }

  console.log('Migration completed!');
}

migrate().catch(console.error);
