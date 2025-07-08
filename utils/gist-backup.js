import fs from 'fs';
import fetch from 'node-fetch'; // Install with: npm i node-fetch
import path from 'path';
import { GIST_CONFIG } from '../bot.js';

const dbPath = path.resolve(process.cwd(), 'data/db.json');

export async function backupToGist() {
  const { GIST_ID, GITHUB_TOKEN } = GIST_CONFIG;

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
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json'
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
