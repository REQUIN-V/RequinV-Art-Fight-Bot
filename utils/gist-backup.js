import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../data/db.json');

export async function backupToGist() {
  const GIST_ID = process.env.GIST_ID;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!GIST_ID || !GITHUB_TOKEN) {
    console.warn('⚠️ Missing GIST_ID or GITHUB_TOKEN. Skipping Gist backup.');
    return;
  }

  let fileData;
  try {
    fileData = fs.readFileSync(dbPath, 'utf-8');
  } catch (err) {
    console.error('❌ Failed to read db.json:', err);
    return;
  }

  try {
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({
        files: {
          'db.json': {
            content: fileData
          }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GitHub API responded with ${response.status}: ${errText}`);
    }

    console.log('✅ Gist backup successful.');
  } catch (err) {
    console.error('❌ Gist backup failed:', err.message);
  }
}

