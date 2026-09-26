import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import {
  findGuestByName,
  getPartyWithGuests,
  getPartyByToken,
  updatePartyRsvp,
  getAllPartiesStats,
  resetDemoDatabase
} from './server/db.ts';

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// API: Get current custom hero image status
app.get('/api/hero-image', (_req, res) => {
  const publicPath = path.resolve(process.cwd(), 'public', 'image.png');
  const exists = fs.existsSync(publicPath);
  res.json({ success: true, hasCustomImage: exists, url: exists ? '/image.png' : null });
});

// API: Upload custom hero photo
app.post('/api/hero-image', (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid or missing image data' });
      return;
    }
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Save to public/image.png
    const publicDir = path.resolve(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const publicPath = path.resolve(publicDir, 'image.png');
    fs.writeFileSync(publicPath, buffer);

    // Also mirror to dist/image.png if dist exists
    const distDir = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.resolve(distDir, 'image.png'), buffer);
    }

    res.json({ success: true, url: '/image.png?t=' + Date.now() });
  } catch (error) {
    console.error('Error in /api/hero-image:', error);
    res.status(500).json({ success: false, message: 'Failed to save image' });
  }
});

// API: Validate Guest by Full Name
app.post('/api/auth/validate-guest', (req, res) => {
  try {
    const { fullName } = req.body;
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      res.status(400).json({ success: false, message: 'Please provide your full name as written on your invitation.' });
      return;
    }

    const result = findGuestByName(fullName);
    if (!result) {
      res.status(404).json({
        success: false,
        message: `We couldn't find an invitation matching "${fullName.trim()}". Please verify the spelling or try searching for another member of your party.`
      });
      return;
    }

    res.json({
      success: true,
      matchedGuest: result.guest,
      party: result.party
    });
  } catch (error) {
    console.error('Error in /api/auth/validate-guest:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred while verifying the guest.' });
  }
});

// API: Get Party by ID
app.get('/api/party/:partyId', (req, res) => {
  try {
    const { partyId } = req.params;
    const party = getPartyWithGuests(partyId);
    if (!party) {
      res.status(404).json({ success: false, message: 'Party not found.' });
      return;
    }
    res.json({ success: true, party });
  } catch (error) {
    console.error('Error in /api/party/:partyId:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve party details.' });
  }
});

// API: Get Party by Access Token
app.get('/api/party/token/:token', (req, res) => {
  try {
    const { token } = req.params;
    const party = getPartyByToken(token);
    if (!party) {
      res.status(404).json({ success: false, message: 'Invalid invitation token.' });
      return;
    }
    res.json({ success: true, party });
  } catch (error) {
    console.error('Error in /api/party/token/:token:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve party details.' });
  }
});

// API: Submit RSVP decisions for the whole party
app.post('/api/rsvp/submit', (req, res) => {
  try {
    const { partyId, guestResponses, notes } = req.body;

    if (!partyId || !Array.isArray(guestResponses) || guestResponses.length === 0) {
      res.status(400).json({ success: false, message: 'Invalid payload. partyId and guestResponses are required.' });
      return;
    }

    // Verify valid statuses
    for (const r of guestResponses) {
      if (!r.guestId || !['accepted', 'declined'].includes(r.rsvp_status)) {
        res.status(400).json({ success: false, message: `Invalid response status for guest ${r.guestId}` });
        return;
      }
    }

    const updatedParty = updatePartyRsvp(partyId, guestResponses, notes);
    if (!updatedParty) {
      res.status(404).json({ success: false, message: 'Party not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'RSVP successfully received and logged to the database!',
      party: updatedParty
    });
  } catch (error) {
    console.error('Error in /api/rsvp/submit:', error);
    res.status(500).json({ success: false, message: 'Failed to submit RSVP.' });
  }
});

// API: Get all parties stats for the host / admin modal
app.get('/api/admin/parties', (_req, res) => {
  try {
    const stats = getAllPartiesStats();
    res.json({ success: true, ...stats });
  } catch (error) {
    console.error('Error in /api/admin/parties:', error);
    res.status(500).json({ success: false, message: 'Failed to load guest list overview.' });
  }
});

// API: Reset database to initial demo state
app.post('/api/admin/reset', (_req, res) => {
  try {
    const stats = resetDemoDatabase();
    res.json({ success: true, message: 'Database reset to default demo guests.', ...stats });
  } catch (error) {
    console.error('Error in /api/admin/reset:', error);
    res.status(500).json({ success: false, message: 'Failed to reset database.' });
  }
});

// API: Cloudflare D1 Schema Export
app.get('/api/d1/export-sql', (_req, res) => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      res.type('text/plain').send(sql);
    } else {
      res.status(404).send('schema.sql not found');
    }
  } catch (error) {
    res.status(500).send('Error reading schema.sql');
  }
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
