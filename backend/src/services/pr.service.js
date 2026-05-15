const https = require('https');
const Anthropic = require('@anthropic-ai/sdk');

const DIFF_CHAR_LIMIT = 24000;

/**
 * Extract owner, repo, and PR number from a GitHub PR URL.
 * @param {string} url
 * @returns {{ owner: string, repo: string, number: string }}
 */
function parsePRUrl(url) {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i);
  if (!m) throw new Error('Invalid GitHub PR URL');
  return { owner: m[1], repo: m[2], number: m[3] };
}

/**
 * Fetch the raw unified diff for a GitHub PR via the GitHub API.
 * @param {string} owner
 * @param {string} repo
 * @param {string} number
 * @returns {Promise<string>}
 */
function fetchPRDiff(owner, repo, number) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/pulls/${number}`,
      headers: {
        'Accept': 'application/vnd.github.v3.diff',
        'User-Agent': 'CodeAtlas-AI/1.0',
      },
    };

    if (process.env.GITHUB_TOKEN) {
      options.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    https.get(options, (res) => {
      if (res.statusCode === 404) return reject(new Error('PR not found — check the URL or ensure the PR is public'));
      if (res.statusCode >= 400) return reject(new Error(`GitHub API error: ${res.statusCode}`));

      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Parse a unified diff string into per-file stats.
 * @param {string} diffText
 * @returns {{ files: Array<{path,additions,deletions}>, totalAdditions: number, totalDeletions: number }}
 */
function parseDiff(diffText) {
  const fileBlocks = diffText.split(/^diff --git /m).filter(Boolean);
  let totalAdditions = 0;
  let totalDeletions = 0;

  const files = fileBlocks.map(block => {
    const pathMatch = block.match(/^a\/(.+?) b\//m);
    const path = pathMatch ? pathMatch[1] : 'unknown';

    const lines = block.split('\n');
    let additions = 0;
    let deletions = 0;
    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) additions++;
      else if (line.startsWith('-') && !line.startsWith('---')) deletions++;
    }

    totalAdditions += additions;
    totalDeletions += deletions;

    return { path, additions, deletions };
  });

  return { files, totalAdditions, totalDeletions };
}

/**
 * Send the diff to Claude and get a structured PR review.
 * @param {string} diffText
 * @param {{ files: object[], totalAdditions: number, totalDeletions: number }} parsedDiff
 * @param {string} apiKey  user's Anthropic key
 * @returns {Promise<object>}
 */
async function reviewPR(diffText, parsedDiff, apiKey) {
  const client = new Anthropic({ apiKey });

  const truncatedDiff = diffText.length > DIFF_CHAR_LIMIT
    ? diffText.slice(0, DIFF_CHAR_LIMIT) + '\n\n[... diff truncated for length ...]'
    : diffText;

  const filesSummary = parsedDiff.files
    .slice(0, 30)
    .map(f => `  ${f.path} (+${f.additions} -${f.deletions})`)
    .join('\n');

  const prompt = `You are a senior software engineer performing a thorough code review of a GitHub pull request.

Changed files (${parsedDiff.files.length} total, +${parsedDiff.totalAdditions}/-${parsedDiff.totalDeletions} lines):
${filesSummary}

Unified diff:
\`\`\`diff
${truncatedDiff}
\`\`\`

Respond ONLY with a valid JSON object matching this exact schema (no markdown, no commentary):
{
  "summary": "2-3 sentence overview of what this PR does",
  "overallVerdict": "Approved",
  "score": 80,
  "securityIssues": [
    { "severity": "HIGH", "location": "file:line", "description": "explanation" }
  ],
  "bugs": [
    { "location": "file or area", "description": "what the bug is", "fix": "concrete suggestion" }
  ],
  "styleIssues": [
    { "location": "file or area", "description": "style/conventions issue" }
  ],
  "positiveHighlights": ["string"],
  "recommendedChanges": ["string"],
  "testingNotes": "paragraph about testing coverage and gaps"
}

overallVerdict must be exactly one of: "Approved", "Needs Changes", "Request Changes"
score is an integer 0-100.
securityIssues severity must be one of: CRITICAL, HIGH, MEDIUM, LOW.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  let raw = message.content[0].text.trim();
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let review;
  try {
    review = JSON.parse(raw);
  } catch {
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      review = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    } else {
      throw new Error('Claude returned non-JSON output');
    }
  }

  return review;
}

module.exports = { parsePRUrl, fetchPRDiff, parseDiff, reviewPR };
