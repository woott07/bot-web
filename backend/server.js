require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Discord OAuth Config ────────────────────────────────────────────────────
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || `https://musico.up.railway.app/auth/callback`;

// ─── Bot Data Files ───────────────────────────────────────────────────────────
// Local:   reads from my-music-bot/data/ on your PC
// Railway: reads from /data/bot/ (shared persistent volume between both services)
const BOT_DATA_DIR = process.env.BOT_DATA_DIR
    || path.join(__dirname, '..', '..', 'my-music-bot', 'data');
const AUTOMOD_FILE = path.join(BOT_DATA_DIR, 'automod.json');
const AUTOROLE_FILE = path.join(BOT_DATA_DIR, 'autorole.json');
const STATS_FILE = path.join(BOT_DATA_DIR, 'stats.json');

// Helpers to read/write the bot's own JSON files safely
function readJSON(filePath, fallback = {}) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.error(`Error reading ${filePath}:`, e.message);
    }
    return fallback;
}

function writeJSON(filePath, data) {
    try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error(`Error writing ${filePath}:`, e.message);
        return false;
    }
}

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'musico-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// Serve static files from the website folder (parent of backend/)
const publicPath = path.resolve(__dirname, '../');
app.use(express.static(publicPath));

// Also explicitly handle the root route (/) to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// ─── Auth Routes ─────────────────────────────────────────────────────────────

// Redirect user to Discord OAuth2
app.get('/auth/login', (req, res) => {
    const params = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'identify guilds',
        prompt: 'consent'
    });
    res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

// Discord sends user back here with a code
app.get('/auth/callback', async (req, res) => {
    const { code, error } = req.query;
    if (error || !code) return res.redirect('/?auth=error');

    try {
        // Exchange code for access token
        const tokenRes = await axios.post(
            'https://discord.com/api/oauth2/token',
            new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const { access_token, token_type } = tokenRes.data;

        // Fetch user profile + guilds from Discord
        const [userRes, guildsRes] = await Promise.all([
            axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `${token_type} ${access_token}` } }),
            axios.get('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `${token_type} ${access_token}` } }),
        ]);

        req.session.user = userRes.data;
        req.session.guilds = guildsRes.data;

        // CRITICAL: save session to store BEFORE redirecting.
        // Without this, the cookie may not be written before the browser
        // hits /dashboard.html and calls /api/me — causing a redirect loop.
        req.session.save(err => {
            if (err) {
                console.error('Session save error:', err);
                return res.redirect('/?auth=error');
            }
            res.redirect('/dashboard.html');
        });
    } catch (err) {
        console.error('OAuth Error:', err.response?.data || err.message);
        res.redirect('/?auth=error');
    }
});

// Logout — destroy session
app.get('/auth/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// ─── API: Who am I? ──────────────────────────────────────────────────────────
app.get('/api/me', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
    const u = req.session.user;
    res.json({
        id: u.id,
        username: u.username,
        globalName: u.global_name,
        avatar: u.avatar
            ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${(u.discriminator || 0) % 5}.png`,
    });
});

// ─── API: Guilds the user manages ────────────────────────────────────────────
app.get('/api/guilds', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });

    const MANAGE = 0x20;
    const ADMIN = 0x8;
    const guilds = (req.session.guilds || [])
        .filter(g => g.owner || (g.permissions & ADMIN) || (g.permissions & MANAGE))
        .map(g => ({
            id: g.id,
            name: g.name,
            icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
            owner: g.owner,
        }));

    res.json(guilds);
});

// ─── API: Get bot config for a guild ─────────────────────────────────────────
// Reads directly from the bot's automod.json and autorole.json files
app.get('/api/config/:guildId', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });

    const gid = req.params.guildId;

    const automod = readJSON(AUTOMOD_FILE, {});
    const autorole = readJSON(AUTOROLE_FILE, {});
    const stats = readJSON(STATS_FILE, {});

    const guildAutomod = automod[gid] || {};
    const guildAutorole = autorole[gid];

    res.json({
        // Auto-mod settings (from automod.json → [guildId])
        automod_enabled: guildAutomod.enabled ?? false,
        spam_threshold: guildAutomod.spam_limit ?? 5,
        banned_words: guildAutomod.words ?? [],
        exempt_roles: guildAutomod.exempt_roles ?? [],

        // Auto-role (from autorole.json → [guildId] = role_id string)
        auto_role_id: guildAutorole ?? null,

        // Dashboard-only toggles (stored in a separate simple file per guild)
        // These don't have bot equivalents yet but are stored for dashboard use
        logging_enabled: guildAutomod.logging_enabled ?? true,
        welcome_enabled: guildAutomod.welcome_enabled ?? false,
        mod_safety_enabled: guildAutomod.mod_safety ?? true,
        default_volume: guildAutomod.volume ?? 100,
        presence_247: guildAutomod.presence_247 ?? false,

        // Stats
        cmd_stats: stats,
    });
});

// ─── API: Save bot config for a guild ────────────────────────────────────────
// SAFE MERGE: Only updates the fields the dashboard manages.
// Any fields the bot has set via Discord commands (like exempt_roles) are preserved.
// main.py is NEVER touched — only the data JSON files are written.
app.post('/api/config/:guildId', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });

    const gid = req.params.guildId;
    const body = req.body;

    // ── Update automod.json (safe merge — keeps existing bot-set fields) ─────
    const automod = readJSON(AUTOMOD_FILE, {});
    const existing = automod[gid] || {};

    // Build update — only touch fields the dashboard explicitly sent
    const update = {};
    if (body.automod_enabled !== undefined) update.enabled = body.automod_enabled;
    if (body.spam_threshold !== undefined) update.spam_limit = body.spam_threshold;
    if (body.banned_words !== undefined) update.words = body.banned_words;
    if (body.logging_enabled !== undefined) update.logging_enabled = body.logging_enabled;
    if (body.welcome_enabled !== undefined) update.welcome_enabled = body.welcome_enabled;
    if (body.mod_safety_enabled !== undefined) update.mod_safety = body.mod_safety_enabled;
    if (body.default_volume !== undefined) update.volume = body.default_volume;
    if (body.presence_247 !== undefined) update.presence_247 = body.presence_247;

    // Merge: existing fields from bot commands are preserved
    // Dashboard fields are overwritten only if the dashboard sent them
    automod[gid] = { ...existing, ...update };

    const automodOk = writeJSON(AUTOMOD_FILE, automod);

    // ── Update autorole.json ─────────────────────────────────────────────────
    const autorole = readJSON(AUTOROLE_FILE, {});
    if (body.auto_role_id && body.auto_role_id !== 'None') {
        autorole[gid] = body.auto_role_id;
    } else if (body.auto_role_id === 'None') {
        delete autorole[gid]; // Only clear if user explicitly chose "None"
    }
    // If auto_role_id was not sent at all, don't touch autorole.json
    const autoroleOk = body.auto_role_id !== undefined
        ? writeJSON(AUTOROLE_FILE, autorole)
        : true;

    if (!automodOk || !autoroleOk) {
        return res.status(500).json({ error: 'Failed to write config files.' });
    }

    console.log(`✅ Config saved for guild ${gid} by ${req.session.user.username}`);
    res.json({ success: true, config: automod[gid] });
});

// ─── API: Stats from the bot's stats.json ────────────────────────────────────
app.get('/api/stats/:guildId', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
    res.json(readJSON(STATS_FILE, {}));
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🎵 Musico Dashboard running at http://localhost:${PORT}`);
    console.log(`   ➜ Bot data dir: ${BOT_DATA_DIR}`);

    // Check if bot data folder is accessible
    if (fs.existsSync(BOT_DATA_DIR)) {
        console.log(`   ✅ Bot data folder found — live config sync enabled!\n`);
    } else {
        console.warn(`   ⚠️  Bot data folder NOT found at: ${BOT_DATA_DIR}`);
        console.warn(`   Dashboard will still work but changes won't reach the bot.\n`);
    }

    if (!DISCORD_CLIENT_SECRET || DISCORD_CLIENT_SECRET === 'PASTE_YOUR_CLIENT_SECRET_HERE') {
        console.warn('   ⚠️  DISCORD_CLIENT_SECRET not set in backend/.env!\n');
    }
});
