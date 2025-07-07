import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbFile = path.resolve(process.cwd(), 'data/db.json');  // Global persistent location
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

// Initialize DB structure
await db.read();
db.data ||= { servers: {} }; // Multi-server data scoped by guildId
await db.write();

/**
 * Returns the full database instance.
 */
export const getDB = () => db;

/**
 * Returns and initializes a specific server (guild)'s scoped data object.
 * @param {string} guildId - The ID of the Discord server
 * @returns {object} serverData - The server-specific data object
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

