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

fix('src/context/embeddings/Indexer.ts', [
  { from: '"./Node"', to: '"../knowledge/Node"' },
  { from: '"./database/VectorRepository"', to: '"../knowledge/database/VectorRepository"' }
]);

fix('src/context/knowledge/ContextBuilder.ts', [
  { from: '"./Retriever"', to: '"../retrieval/Retriever"' },
  { from: '"../memory/Timeline"', to: '"@/lib/memory/Timeline"' },
  { from: "results.map(m =>", to: "results.map((m: any) =>" },
  { from: "similarNodes.map(m =>", to: "similarNodes.map((m: any) =>" },
  { from: "relatedMemories.map(m =>", to: "relatedMemories.map((m: any) =>" }
]);

fix('src/context/knowledge/KnowledgeService.ts', [
  { from: '"./Retriever"', to: '"../retrieval/Retriever"' }
]);

fix('src/context/retrieval/Ranking.ts', [
  { from: '"./Node"', to: '"../knowledge/Node"' }
]);

fix('src/context/retrieval/Retriever.ts', [
  { from: '"./EmbeddingProvider"', to: '"../embeddings/EmbeddingProvider"' },
  { from: '"./database/VectorRepository"', to: '"../knowledge/database/VectorRepository"' },
  { from: '"./Relationships"', to: '"../knowledge/Relationships"' },
  { from: '"./Node"', to: '"../knowledge/Node"' }
]);

fix('src/lib/ai/engine/persistArtifacts.ts', [
  { from: "'../../../lib/knowledge/EmbeddingQueue'", to: "'@/context/embeddings/EmbeddingQueue'" },
  { from: '"../../../lib/knowledge/EmbeddingQueue"', to: '"@/context/embeddings/EmbeddingQueue"' }
]);
