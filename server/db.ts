import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.resolve(process.cwd(), 'wedding.sqlite');
const db = new DatabaseSync(DB_PATH);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS parties (
    id TEXT PRIMARY KEY,
    party_name VARCHAR(100) NOT NULL,
    access_token VARCHAR(32) NOT NULL UNIQUE,
    max_reserved_seats INT NOT NULL DEFAULT 1,
    is_submitted BOOLEAN NOT NULL DEFAULT 0,
    submitted_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS guests (
    id TEXT PRIMARY KEY,
    party_id TEXT NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    is_primary_contact BOOLEAN NOT NULL DEFAULT 0,
    rsvp_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (rsvp_status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_parties_access_token ON parties(access_token);
  CREATE INDEX IF NOT EXISTS idx_guests_party_id ON guests(party_id);
`);

// Seed initial parties and guests if empty
const countPartiesStmt = db.prepare('SELECT COUNT(*) as count FROM parties');
const partyCount = (countPartiesStmt.get() as { count: number }).count;

if (partyCount === 0) {
  const insertParty = db.prepare(`
    INSERT INTO parties (id, party_name, access_token, max_reserved_seats, is_submitted, submitted_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertGuest = db.prepare(`
    INSERT INTO guests (id, party_id, first_name, last_name, is_primary_contact, rsvp_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // 1. The Sekiro Family (matching the prompt's explicit requirement: "john doe's family has been provided 4 invitations, it would display a list of the family's names where he can accept/decline on their behalf")
  insertParty.run('party-sekiro', 'The Sekiro Family', 'sekiro-2027', 4, 0, null, null);
  insertGuest.run('guest-sekiro-1', 'party-sekiro', 'John', 'Sekiro', 1, 'pending');
  insertGuest.run('guest-sekiro-2', 'party-sekiro', 'Elena', 'Sekiro', 0, 'pending');
  insertGuest.run('guest-sekiro-3', 'party-sekiro', 'Lucas', 'Sekiro', 0, 'pending');
  insertGuest.run('guest-sekiro-4', 'party-sekiro', 'Maya', 'Sekiro', 0, 'pending');

  // 2. Maria Gonzalez & Family (2 seats)
  insertParty.run('party-gonzalez', 'Maria Gonzalez & Family', 'gonzalez-2027', 2, 0, null, null);
  insertGuest.run('guest-gonzalez-1', 'party-gonzalez', 'Maria', 'Gonzalez', 1, 'pending');
  insertGuest.run('guest-gonzalez-2', 'party-gonzalez', 'Carlos', 'Gonzalez', 0, 'pending');

  // 3. The Chen Family (3 seats)
  insertParty.run('party-chen', 'The Chen Family', 'chen-2027', 3, 1, '2026-09-18 14:20:00', 'So overjoyed for you both! Looking forward to the Madrid & Cebu moments.');
  insertGuest.run('guest-chen-1', 'party-chen', 'David', 'Chen', 1, 'accepted');
  insertGuest.run('guest-chen-2', 'party-chen', 'Sarah', 'Chen', 0, 'accepted');
  insertGuest.run('guest-chen-3', 'party-chen', 'Chloe', 'Chen', 0, 'accepted');

  // 4. Marcus Vance (1 seat)
  insertParty.run('party-vance', 'Marcus Vance', 'vance-2027', 1, 0, null, null);
  insertGuest.run('guest-vance-1', 'party-vance', 'Marcus', 'Vance', 1, 'pending');
}

export interface GuestRecord {
  id: string;
  party_id: string;
  first_name: string;
  last_name: string;
  is_primary_contact: number | boolean;
  rsvp_status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface PartyRecord {
  id: string;
  party_name: string;
  access_token: string;
  max_reserved_seats: number;
  is_submitted: number | boolean;
  submitted_at: string | null;
  notes: string | null;
  created_at: string;
  guests?: GuestRecord[];
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function findGuestByName(rawName: string): { guest: GuestRecord; party: PartyRecord & { guests: GuestRecord[] } } | null {
  const cleanName = normalizeName(rawName);
  if (!cleanName) return null;

  const parts = cleanName.split(' ');
  const firstNameCandidate = parts[0];
  const lastNameCandidate = parts.slice(1).join(' ');

  // Try exact full name matches (first last, or last first)
  const exactMatchStmt = db.prepare(`
    SELECT g.* FROM guests g
    WHERE LOWER(TRIM(g.first_name || ' ' || g.last_name)) = ?
       OR LOWER(TRIM(g.last_name || ' ' || g.first_name)) = ?
       OR (LOWER(TRIM(g.first_name)) = ? AND LOWER(TRIM(g.last_name)) = ?)
    LIMIT 1
  `);

  let matchedGuest = exactMatchStmt.get(
    cleanName,
    cleanName,
    firstNameCandidate,
    lastNameCandidate
  ) as GuestRecord | undefined;

  // Fallback: search by first name or last name match
  if (!matchedGuest && parts.length === 1) {
    const singleNameStmt = db.prepare(`
      SELECT g.* FROM guests g
      WHERE LOWER(g.first_name) = ? OR LOWER(g.last_name) = ?
      LIMIT 1
    `);
    matchedGuest = singleNameStmt.get(cleanName, cleanName) as GuestRecord | undefined;
  }

  // Fallback: check LIKE match if user typed partial or with title
  if (!matchedGuest) {
    const fuzzyStmt = db.prepare(`
      SELECT g.* FROM guests g
      WHERE LOWER(g.first_name || ' ' || g.last_name) LIKE ?
         OR LOWER(g.last_name || ', ' || g.first_name) LIKE ?
      LIMIT 1
    `);
    matchedGuest = fuzzyStmt.get(`%${cleanName}%`, `%${cleanName}%`) as GuestRecord | undefined;
  }

  if (!matchedGuest) return null;

  const party = getPartyWithGuests(matchedGuest.party_id);
  if (!party) return null;

  return { guest: matchedGuest, party };
}

export function getPartyWithGuests(partyId: string): (PartyRecord & { guests: GuestRecord[] }) | null {
  const partyStmt = db.prepare('SELECT * FROM parties WHERE id = ?');
  const party = partyStmt.get(partyId) as PartyRecord | undefined;
  if (!party) return null;

  const guestsStmt = db.prepare(`
    SELECT * FROM guests 
    WHERE party_id = ? 
    ORDER BY is_primary_contact DESC, first_name ASC
  `);
  const guests = guestsStmt.all(partyId) as unknown as GuestRecord[];

  return {
    ...party,
    is_submitted: Boolean(party.is_submitted),
    guests: guests.map(g => ({
      ...g,
      is_primary_contact: Boolean(g.is_primary_contact)
    }))
  };
}

export function getPartyByToken(token: string): (PartyRecord & { guests: GuestRecord[] }) | null {
  const partyStmt = db.prepare('SELECT * FROM parties WHERE access_token = ?');
  const party = partyStmt.get(token) as PartyRecord | undefined;
  if (!party) return null;
  return getPartyWithGuests(party.id);
}

export function updatePartyRsvp(
  partyId: string,
  guestResponses: { guestId: string; rsvp_status: 'accepted' | 'declined' }[],
  notes?: string
): (PartyRecord & { guests: GuestRecord[] }) | null {
  const updateGuestStmt = db.prepare(`
    UPDATE guests 
    SET rsvp_status = ? 
    WHERE id = ? AND party_id = ?
  `);

  for (const resp of guestResponses) {
    updateGuestStmt.run(resp.rsvp_status, resp.guestId, partyId);
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const updatePartyStmt = db.prepare(`
    UPDATE parties 
    SET is_submitted = 1, 
        submitted_at = ?,
        notes = COALESCE(?, notes)
    WHERE id = ?
  `);
  updatePartyStmt.run(now, notes || null, partyId);

  return getPartyWithGuests(partyId);
}

export function getAllPartiesStats() {
  const partiesStmt = db.prepare('SELECT * FROM parties ORDER BY created_at ASC');
  const allParties = partiesStmt.all() as unknown as PartyRecord[];

  const guestsStmt = db.prepare('SELECT * FROM guests');
  const allGuests = guestsStmt.all() as unknown as GuestRecord[];

  const partyList = allParties.map(p => ({
    ...p,
    is_submitted: Boolean(p.is_submitted),
    guests: allGuests
      .filter(g => g.party_id === p.id)
      .map(g => ({ ...g, is_primary_contact: Boolean(g.is_primary_contact) }))
  }));

  const totalGuests = allGuests.length;
  const confirmedGuests = allGuests.filter(g => g.rsvp_status === 'accepted').length;
  const declinedGuests = allGuests.filter(g => g.rsvp_status === 'declined').length;
  const pendingGuests = allGuests.filter(g => g.rsvp_status === 'pending').length;
  const submittedParties = allParties.filter(p => Boolean(p.is_submitted)).length;

  return {
    totalParties: allParties.length,
    totalGuests,
    confirmedGuests,
    declinedGuests,
    pendingGuests,
    submittedParties,
    parties: partyList
  };
}

export function resetDemoDatabase() {
  db.exec('DELETE FROM guests');
  db.exec('DELETE FROM parties');

  const insertParty = db.prepare(`
    INSERT INTO parties (id, party_name, access_token, max_reserved_seats, is_submitted, submitted_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertGuest = db.prepare(`
    INSERT INTO guests (id, party_id, first_name, last_name, is_primary_contact, rsvp_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertParty.run('party-sekiro', 'The Sekiro Family', 'sekiro-2027', 4, 0, null, null);
  insertGuest.run('guest-sekiro-1', 'party-sekiro', 'John', 'Sekiro', 1, 'pending');
  insertGuest.run('guest-sekiro-2', 'party-sekiro', 'Elena', 'Sekiro', 0, 'pending');
  insertGuest.run('guest-sekiro-3', 'party-sekiro', 'Lucas', 'Sekiro', 0, 'pending');
  insertGuest.run('guest-sekiro-4', 'party-sekiro', 'Maya', 'Sekiro', 0, 'pending');

  insertParty.run('party-gonzalez', 'Maria Gonzalez & Family', 'gonzalez-2027', 2, 0, null, null);
  insertGuest.run('guest-gonzalez-1', 'party-gonzalez', 'Maria', 'Gonzalez', 1, 'pending');
  insertGuest.run('guest-gonzalez-2', 'party-gonzalez', 'Carlos', 'Gonzalez', 0, 'pending');

  insertParty.run('party-chen', 'The Chen Family', 'chen-2027', 3, 1, '2026-09-18 14:20:00', 'Looking forward to celebrating with you!');
  insertGuest.run('guest-chen-1', 'party-chen', 'David', 'Chen', 1, 'accepted');
  insertGuest.run('guest-chen-2', 'party-chen', 'Sarah', 'Chen', 0, 'accepted');
  insertGuest.run('guest-chen-3', 'party-chen', 'Chloe', 'Chen', 0, 'accepted');

  insertParty.run('party-vance', 'Marcus Vance', 'vance-2027', 1, 0, null, null);
  insertGuest.run('guest-vance-1', 'party-vance', 'Marcus', 'Vance', 1, 'pending');

  return getAllPartiesStats();
}

export { db };
