/**
 * Cloudflare Worker for James & Amber Wedding RSVP Portal
 * Connects frontend to Cloudflare D1 SQLite Database and serves Vite static assets.
 */

// Cloudflare Workers & D1 Types
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<{ success: boolean; meta: Record<string, unknown> }>;
  all<T = unknown>(): Promise<{ results: T[]; success: boolean; meta: Record<string, unknown> }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<{ results?: T[]; success: boolean }[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

export interface Env {
  // Bound in wrangler.toml under [[d1_databases]] binding = "DB"
  DB: D1Database;
  // Bound automatically when [assets] directory = "./dist" is configured
  ASSETS?: {
    fetch(request: Request | string, init?: RequestInit): Promise<Response>;
  };
}

export interface GuestRecord {
  id: string;
  party_id: string;
  first_name: string;
  last_name: string;
  is_primary_contact: number | boolean;
  rsvp_status: 'pending' | 'accepted' | 'declined';
  created_at?: string;
}

export interface PartyRecord {
  id: string;
  party_name: string;
  access_token: string;
  max_reserved_seats: number;
  is_submitted: number | boolean;
  submitted_at: string | null;
  notes: string | null;
  created_at?: string;
  guests?: GuestRecord[];
}

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...headers
    }
  });
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function getPartyWithGuests(db: D1Database, partyId: string): Promise<(PartyRecord & { guests: GuestRecord[] }) | null> {
  const party = await db.prepare('SELECT * FROM parties WHERE id = ?').bind(partyId).first<PartyRecord>();
  if (!party) return null;

  const guestsResult = await db.prepare(`
    SELECT * FROM guests 
    WHERE party_id = ? 
    ORDER BY is_primary_contact DESC, first_name ASC
  `).bind(partyId).all<GuestRecord>();

  return {
    ...party,
    is_submitted: Boolean(party.is_submitted),
    guests: (guestsResult.results || []).map((g) => ({
      ...g,
      is_primary_contact: Boolean(g.is_primary_contact)
    }))
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight options
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    try {
      // -----------------------------------------------------------
      // 1. POST /api/auth/validate-guest
      // Validates full name entered on login against D1
      // -----------------------------------------------------------
      if (url.pathname === '/api/auth/validate-guest' && request.method === 'POST') {
        const body = await request.json() as { fullName?: string };
        const fullName = body.fullName;

        if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
          return jsonResponse({
            success: false,
            message: 'Please provide your full name as written on your invitation.'
          }, 400);
        }

        const cleanName = normalizeName(fullName);
        const parts = cleanName.split(' ');
        const firstNameCandidate = parts[0];
        const lastNameCandidate = parts.slice(1).join(' ');

        // Try exact match first (first last or last first)
        let matchedGuest = await env.DB.prepare(`
          SELECT * FROM guests
          WHERE LOWER(TRIM(first_name || ' ' || last_name)) = ?
             OR LOWER(TRIM(last_name || ' ' || first_name)) = ?
             OR (LOWER(TRIM(first_name)) = ? AND LOWER(TRIM(last_name)) = ?)
          LIMIT 1
        `).bind(cleanName, cleanName, firstNameCandidate, lastNameCandidate).first<GuestRecord>();

        // Fallback: single name lookup if 1 word entered
        if (!matchedGuest && parts.length === 1) {
          matchedGuest = await env.DB.prepare(`
            SELECT * FROM guests
            WHERE LOWER(first_name) = ? OR LOWER(last_name) = ?
            LIMIT 1
          `).bind(cleanName, cleanName).first<GuestRecord>();
        }

        // Fallback: partial match
        if (!matchedGuest) {
          matchedGuest = await env.DB.prepare(`
            SELECT * FROM guests
            WHERE LOWER(first_name || ' ' || last_name) LIKE ?
               OR LOWER(last_name || ', ' || first_name) LIKE ?
            LIMIT 1
          `).bind(`%${cleanName}%`, `%${cleanName}%`).first<GuestRecord>();
        }

        if (!matchedGuest) {
          return jsonResponse({
            success: false,
            message: `We couldn't find an invitation matching "${fullName.trim()}". Please verify the spelling or try searching for another member of your party.`
          }, 404);
        }

        const party = await getPartyWithGuests(env.DB, matchedGuest.party_id);
        if (!party) {
          return jsonResponse({ success: false, message: 'Party record not found.' }, 404);
        }

        return jsonResponse({
          success: true,
          matchedGuest: {
            ...matchedGuest,
            is_primary_contact: Boolean(matchedGuest.is_primary_contact)
          },
          party
        });
      }

      // -----------------------------------------------------------
      // 2. GET /api/party/:partyId
      // -----------------------------------------------------------
      const partyIdMatch = url.pathname.match(/^\/api\/party\/([^/]+)$/);
      if (partyIdMatch && request.method === 'GET') {
        const partyId = partyIdMatch[1];
        const party = await getPartyWithGuests(env.DB, partyId);
        if (!party) {
          return jsonResponse({ success: false, message: 'Party not found.' }, 404);
        }
        return jsonResponse({ success: true, party });
      }

      // -----------------------------------------------------------
      // 3. GET /api/party/token/:token
      // -----------------------------------------------------------
      const tokenMatch = url.pathname.match(/^\/api\/party\/token\/([^/]+)$/);
      if (tokenMatch && request.method === 'GET') {
        const token = tokenMatch[1];
        const partyRow = await env.DB.prepare('SELECT id FROM parties WHERE access_token = ?')
          .bind(token)
          .first<{ id: string }>();

        if (!partyRow) {
          return jsonResponse({ success: false, message: 'Invalid invitation token.' }, 404);
        }

        const party = await getPartyWithGuests(env.DB, partyRow.id);
        return jsonResponse({ success: true, party });
      }

      // -----------------------------------------------------------
      // 4. POST /api/rsvp/submit
      // Primary or family member submits attendance for the party
      // -----------------------------------------------------------
      if (url.pathname === '/api/rsvp/submit' && request.method === 'POST') {
        const body = await request.json() as {
          partyId?: string;
          guestResponses?: { guestId: string; rsvp_status: 'accepted' | 'declined' }[];
          notes?: string;
        };

        const { partyId, guestResponses, notes } = body;
        if (!partyId || !Array.isArray(guestResponses) || guestResponses.length === 0) {
          return jsonResponse({ success: false, message: 'partyId and guestResponses are required.' }, 400);
        }

        // Update each guest in D1
        const updateStatements: D1PreparedStatement[] = [];
        for (const resp of guestResponses) {
          if (!resp.guestId || !['accepted', 'declined'].includes(resp.rsvp_status)) {
            return jsonResponse({ success: false, message: `Invalid status for guest ${resp.guestId}` }, 400);
          }
          updateStatements.push(
            env.DB.prepare('UPDATE guests SET rsvp_status = ? WHERE id = ? AND party_id = ?')
              .bind(resp.rsvp_status, resp.guestId, partyId)
          );
        }

        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
        updateStatements.push(
          env.DB.prepare('UPDATE parties SET is_submitted = 1, submitted_at = ?, notes = COALESCE(?, notes) WHERE id = ?')
            .bind(now, notes || null, partyId)
        );

        await env.DB.batch(updateStatements);

        const updatedParty = await getPartyWithGuests(env.DB, partyId);
        return jsonResponse({
          success: true,
          message: 'RSVP successfully received and saved to Cloudflare D1!',
          party: updatedParty
        });
      }

      // -----------------------------------------------------------
      // 5. GET /api/admin/parties
      // Stats overview of parties and guest counts
      // -----------------------------------------------------------
      if (url.pathname === '/api/admin/parties' && request.method === 'GET') {
        const partiesResult = await env.DB.prepare('SELECT * FROM parties ORDER BY created_at ASC').all<PartyRecord>();
        const guestsResult = await env.DB.prepare('SELECT * FROM guests').all<GuestRecord>();

        const allParties = partiesResult.results || [];
        const allGuests = guestsResult.results || [];

        const partyList = allParties.map((p) => ({
          ...p,
          is_submitted: Boolean(p.is_submitted),
          guests: allGuests
            .filter((g) => g.party_id === p.id)
            .map((g) => ({ ...g, is_primary_contact: Boolean(g.is_primary_contact) }))
        }));

        const totalGuests = allGuests.length;
        const confirmedGuests = allGuests.filter((g) => g.rsvp_status === 'accepted').length;
        const declinedGuests = allGuests.filter((g) => g.rsvp_status === 'declined').length;
        const pendingGuests = allGuests.filter((g) => g.rsvp_status === 'pending').length;
        const submittedParties = allParties.filter((p) => Boolean(p.is_submitted)).length;

        return jsonResponse({
          success: true,
          totalParties: allParties.length,
          totalGuests,
          confirmedGuests,
          declinedGuests,
          pendingGuests,
          submittedParties,
          parties: partyList
        });
      }

      // -----------------------------------------------------------
      // Static Assets (React SPA) served by Cloudflare Assets
      // -----------------------------------------------------------
      if (env.ASSETS) {
        return await env.ASSETS.fetch(request);
      }

      return new Response('Not found', { status: 404 });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown worker error';
      console.error('Cloudflare Worker Error:', err);
      return jsonResponse({ success: false, message: errorMessage }, 500);
    }
  }
};
