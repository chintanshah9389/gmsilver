/**
 * One-time helper to obtain a Google OAuth refresh token for Contacts sync.
 *
 * Prerequisites:
 * 1. Google Cloud Console → create OAuth 2.0 Client ID (Desktop app)
 * 2. Enable "People API"
 * 3. Add GOOGLE_CONTACTS_CLIENT_ID and GOOGLE_CONTACTS_CLIENT_SECRET to .env
 *
 * Usage (from backend/):
 *   node scripts/google-contacts-oauth.js
 *
 * Then paste the printed refresh token into .env as GOOGLE_CONTACTS_REFRESH_TOKEN
 * and set GOOGLE_CONTACTS_ENABLED=true
 *
 * Sign in with: gmsilverllp@gmail.com (contacts are created in that account)
 */

const http = require('http');
const { URL } = require('url');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const CLIENT_ID = process.env.GOOGLE_CONTACTS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CONTACTS_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3456/oauth2callback';
const SCOPES = ['https://www.googleapis.com/auth/contacts'];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    'Missing GOOGLE_CONTACTS_CLIENT_ID or GOOGLE_CONTACTS_CLIENT_SECRET in .env',
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
});

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, REDIRECT_URI);
    if (url.pathname !== '/oauth2callback') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const code = url.searchParams.get('code');
    if (!code) {
      res.writeHead(400);
      res.end('Missing code');
      return;
    }

    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(
      '<h1>Success</h1><p>You can close this tab and return to the terminal.</p>',
    );

    console.log('\n✅ Authorization complete.\n');
    if (tokens.refresh_token) {
      console.log('Add this to backend/.env:\n');
      console.log(`GOOGLE_CONTACTS_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('GOOGLE_CONTACTS_ENABLED=true\n');
    } else {
      console.log(
        'No refresh_token returned. Revoke app access at https://myaccount.google.com/permissions and run again with prompt=consent.',
      );
      console.log('Tokens:', tokens);
    }

    server.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end('OAuth failed — see terminal');
    server.close();
    process.exit(1);
  }
});

server.listen(3456, () => {
  console.log(
    '\nOpen this URL in your browser and sign in with gmsilverllp@gmail.com:\n',
  );
  console.log(authUrl);
  console.log('\nWaiting for OAuth callback on http://localhost:3456 ...\n');
});
