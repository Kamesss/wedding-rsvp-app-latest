-- Cloudflare D1 SQLite Schema & Initial Seed
-- For James & Amber Wedding RSVP Portal

-- 1. Represents the invitation unit sent to a household or group
CREATE TABLE IF NOT EXISTS parties (
    id TEXT PRIMARY KEY,                           -- UUID / string
    party_name VARCHAR(100) NOT NULL,              -- e.g., "The Sekiro Family" or "Jane Doe & Family"
    access_token VARCHAR(32) NOT NULL UNIQUE,      -- Secret slug/token for direct links and admin reference
    max_reserved_seats INT NOT NULL DEFAULT 1,     -- e.g., 4 (locks the party capacity)
    is_submitted BOOLEAN NOT NULL DEFAULT 0,       -- Flips to 1 (TRUE) once the response is submitted
    submitted_at TIMESTAMP,
    notes TEXT,                                    -- General message or wishes from the party
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Represents each individual person within that party
CREATE TABLE IF NOT EXISTS guests (
    id TEXT PRIMARY KEY,                           -- UUID / string
    party_id TEXT NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    is_primary_contact BOOLEAN NOT NULL DEFAULT 0, -- Identifies primary recipient (1 for true, 0 for false)
    rsvp_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (rsvp_status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_parties_access_token ON parties(access_token);
CREATE INDEX IF NOT EXISTS idx_guests_party_id ON guests(party_id);
CREATE INDEX IF NOT EXISTS idx_guests_names ON guests(first_name, last_name);

-- Initial Seed Data
INSERT OR IGNORE INTO parties (id, party_name, access_token, max_reserved_seats, is_submitted, submitted_at, notes)
VALUES 
    ('party-sekiro', 'The Sekiro Family', 'sekiro-2027', 4, 0, NULL, NULL),
    ('party-gonzalez', 'Maria Gonzalez & Family', 'gonzalez-2027', 2, 0, NULL, NULL),
    ('party-chen', 'The Chen Family', 'chen-2027', 3, 1, '2026-09-18 14:20:00', 'Can''t wait to celebrate with you both! So excited for Spain!'),
    ('party-vance', 'Marcus Vance', 'vance-2027', 1, 0, NULL, NULL);

INSERT OR IGNORE INTO guests (id, party_id, first_name, last_name, is_primary_contact, rsvp_status)
VALUES
    -- The Sekiro Family (4 members: John, Elena, Lucas, Maya)
    ('guest-sekiro-1', 'party-sekiro', 'John', 'Sekiro', 1, 'pending'),
    ('guest-sekiro-2', 'party-sekiro', 'Elena', 'Sekiro', 0, 'pending'),
    ('guest-sekiro-3', 'party-sekiro', 'Lucas', 'Sekiro', 0, 'pending'),
    ('guest-sekiro-4', 'party-sekiro', 'Maya', 'Sekiro', 0, 'pending'),
    
    -- Maria Gonzalez & Family (2 members)
    ('guest-gonzalez-1', 'party-gonzalez', 'Maria', 'Gonzalez', 1, 'pending'),
    ('guest-gonzalez-2', 'party-gonzalez', 'Carlos', 'Gonzalez', 0, 'pending'),
    
    -- The Chen Family (3 members)
    ('guest-chen-1', 'party-chen', 'David', 'Chen', 1, 'accepted'),
    ('guest-chen-2', 'party-chen', 'Sarah', 'Chen', 0, 'accepted'),
    ('guest-chen-3', 'party-chen', 'Chloe', 'Chen', 0, 'accepted'),
    
    -- Marcus Vance (1 member)
    ('guest-vance-1', 'party-vance', 'Marcus', 'Vance', 1, 'pending');
