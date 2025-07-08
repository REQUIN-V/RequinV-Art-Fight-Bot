import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Determine __dirname in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a persistent directory for data if it doesn't exist
const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Define path to persistent db.json file
const dbFile = path.join(dataDir, 'db.json');

// Setup JSON adapter and database
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

// Ensure DB is loaded and initialized
await db.read();
db.data ||= { servers: {} };
await db.write();

/**
 * Get full DB instance (lowdb)
 */
export const getDB = () => db;

/**
 * Get or initialize scoped server data
 * @param {string} guildId - Discord server ID
 * @returns {Promise<Object>} Server-specific data object
 */
export const getServerData = async (guildId) => {
  await db.read();

  db.data.servers ||= {};
  db.data.servers[guildId] ||= {
    users: [],
    attacks: [],
    defends: [],
    settings: {},
    teams: {}
  };

  await db.write();
  return db.data.servers[guildId];
};
