const Anthropic = require('@anthropic-ai/sdk');

const DIMS = 256; // embedding dimensions for semantic search

/**
 * Generate a simple bag-of-words L2-normalised vector for cosine similarity.
 * Not as powerful as voyage embeddings but works without an extra API key.
 * @param {string} text
 * @returns {number[]}
 */
function generateEmbedding(text) {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const vec = new Array(DIMS).fill(0);
  for (const word of words) {
    let h = 5381;
    for (let i = 0; i < word.length; i++) h = ((h << 5) + h + word.charCodeAt(i)) >>> 0;
    vec[h % DIMS] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return norm > 0 ? vec.map(v => v / norm) : vec;
}

/**
 * Cosine similarity between two L2-normalised vectors.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} value in [-1, 1]
 */
function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // already L2-normalised, so dot product = cosine similarity
}

/**
 * Ask Claude to analyse a source file and return structured JSON.
 * @param {string} fileContent  raw file text (will be capped at 8 KB)
 * @param {string} filePath     repo-relative path shown to Claude
 * @param {string} repoName     "owner/repo" label
 * @param {string} apiKey       user's own Anthropic API key
 * @returns {Promise<{ summary: object, tokensUsed: number, embeddingVector: number[] }>}
 */
async function explainFile(fileContent, filePath, repoName, apiKey) {
  const client = new Anthropic({ apiKey });
  const cap = fileContent.slice(0, 8000);

  const prompt = `You are a senior software architect reviewing a codebase. Analyse the file below and return ONLY a raw JSON object — no markdown, no code fences, nothing else.

File: ${filePath}
Repository: ${repoName || 'unknown'}

\`\`\`
${cap}
\`\`\`

Return exactly this JSON structure (all fields required):
{
  "purpose": "one clear sentence describing what this file does",
  "architectureRole": "how this file fits into the overall system architecture",
  "keyResponsibilities": ["responsibility 1", "responsibility 2", "responsibility 3"],
  "dependencies": ["dep1", "dep2"],
  "potentialIssues": ["issue 1"],
  "optimizationTips": ["tip 1"],
  "complexity": "low"
}

For the complexity field use exactly one of: low, medium, high, critical`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  let raw = message.content[0].text.trim();
  // Strip any accidental markdown fences
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const summary = JSON.parse(raw);

  const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

  // Build embedding from the explanation text so it can be searched later
  const embeddingText = [
    summary.purpose,
    summary.architectureRole,
    ...(summary.keyResponsibilities || []),
  ].join(' ');
  const embeddingVector = generateEmbedding(embeddingText);

  return { summary, tokensUsed, embeddingVector };
}

module.exports = { explainFile, generateEmbedding, cosineSimilarity };
