import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbFile = path.resolve(__dirname, '../db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

// Initialize database
await db.read();
db.data ||= { users: [], characters: [], attacks: [], settings: {} };
await db.write();

export const getDB = () => db;
