document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Scroll Animations using Intersection Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Counter animation trigger
                if (!entry.target.dataset.animated && entry.target.querySelector('.counter')) {
                    animateCounters();
                    entry.target.dataset.animated = "true";
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('.target-reveal').forEach(el => {
        observer.observe(el);
    });

    // Animate Counters
    function animateCounters() {
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.innerText = Math.ceil(current).toLocaleString();
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.innerText = target.toLocaleString() + (counter.dataset.suffix || '');
                }
            };
            updateCounter();
        });
    }

    // Commands Data
    const commandsData = {
        all: [
            { name: '/play', desc: 'Adds a song to the queue and plays it.', usage: '/play <song>' },
            { name: '/queue', desc: 'Displays the upcoming songs in the queue.', usage: '/queue' },
            { name: '/skip', desc: 'Skips the currently playing song.', usage: '/skip' },
            { name: '/loop', desc: 'Toggles playback loop mode.', usage: '/loop [mode]' },
            { name: '/kick', desc: 'Kicks a real user from the server.', usage: '/kick @user [reason]' },
            { name: '/ban', desc: 'Bans a user from the server entirely.', usage: '/ban @user [reason]' },
            { name: '/mute', desc: 'Timeouts a user for a duration.', usage: '/mute @user [duration]' },
            { name: '/clear', desc: 'Purges recent messages.', usage: '/clear [amount]' },
            { name: '/automod', desc: 'Configure automatic moderation engines.', usage: '/automod' },
            { name: '/ask', desc: 'Ask Gemini 2.0 AI a question natively', usage: '/ask <prompt>' },
            { name: '/serverinfo', desc: 'Displays detailed server information.', usage: '/serverinfo' },
            { name: '/poll', desc: 'Creates an interactive reaction poll.', usage: '/poll "Q" "O1" "O2"' }
        ],
        music: [
            { name: '/play', desc: 'Adds a song to the queue and plays it.', usage: '/play <song>' },
            { name: '/queue', desc: 'Displays the upcoming songs in the queue.', usage: '/queue' },
            { name: '/skip', desc: 'Skips the currently playing song.', usage: '/skip' },
            { name: '/pause', desc: 'Pauses the current music playback.', usage: '/pause' },
            { name: '/resume', desc: 'Resumes paused music.', usage: '/resume' },
            { name: '/loop', desc: 'Toggles loop mode (song, queue, off).', usage: '/loop [mode]' },
            { name: '/leave', desc: 'Stops music, clears queue, leaves voice.', usage: '/leave' }
        ],
        moderation: [
            { name: '/kick', desc: 'Kicks a specified user from the server.', usage: '/kick @user [reason]' },
            { name: '/ban', desc: 'Bans a specified user from the server.', usage: '/ban @user [reason]' },
            { name: '/mute', desc: 'Timeouts a user for a specified duration.', usage: '/mute @user [minutes]' },
            { name: '/warn', desc: 'Issues a formal warning to a user.', usage: '/warn @user [reason]' },
            { name: '/warns', desc: 'Check a user\'s warning history.', usage: '/warns @user' },
            { name: '/clear', desc: 'Deletes up to 200 recent messages.', usage: '/clear [amount]' },
            { name: '/lock', desc: 'Locks the current channel.', usage: '/lock' }
        ],
        automod: [
            { name: '/automod status', desc: 'Shows the current Auto-Mod config.', usage: '/automod status' },
            { name: '/automod on', desc: 'Enables the Auto-Mod system.', usage: '/automod on' },
            { name: '/automod addword', desc: 'Adds a word to the blacklist.', usage: '/automod addword <word>' },
            { name: '/automod spam', desc: 'Sets the spam detection limit.', usage: '/automod spam <amount>' },
            { name: '/automod exempt', desc: 'Exempts a role from auto-mod rules.', usage: '/automod exempt @role' }
        ],
        utility: [
            { name: '/ask', desc: 'Ask the Gemini AI a question.', usage: '/ask <question>' },
            { name: '/serverinfo', desc: 'Displays detailed server information.', usage: '/serverinfo' },
            { name: '/userinfo', desc: 'Displays detailed user information.', usage: '/userinfo [@user]' },
            { name: '/poll', desc: 'Creates an interactive reaction poll.', usage: '/poll "Question" "Opt 1" "Opt 2"' },
            { name: '/uptime', desc: 'View bot uptime and latency stats.', usage: '/uptime' }
        ]
    };

    const cmdList = document.getElementById('cmd-list');
    function renderCommands(category, searchQ = "") {
        cmdList.innerHTML = '';
        let cmds = commandsData[category] || [];

        if (searchQ) {
            const q = searchQ.toLowerCase();
            cmds = cmds.filter(c => c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
        }

        if (cmds.length === 0) {
            cmdList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No commands found.</div>';
            return;
        }

        cmds.forEach(cmd => {
            const div = document.createElement('div');
            div.className = 'cmd-row';
            div.innerHTML = `
                <div class="cmd-left">
                    <div class="cmd-title">${cmd.name}</div>
                    <div class="cmd-desc">${cmd.desc}</div>
                </div>
                <div class="cmd-right">
                    <code>${cmd.usage}</code>
                    <button class="btn btn-ghost btn-sm cmd-copy" style="padding: 6px;"><i class="fa-regular fa-copy text-muted"></i></button>
                </div>
            `;
            cmdList.appendChild(div);
        });

        document.querySelectorAll('.cmd-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cmdName = e.currentTarget.parentElement.parentElement.querySelector('.cmd-title').innerText;
                navigator.clipboard.writeText(cmdName).then(() => {
                    const icon = e.currentTarget.querySelector('i');
                    icon.className = 'fa-solid fa-check text-brand';
                    setTimeout(() => { icon.className = 'fa-regular fa-copy text-muted'; }, 2000);
                });
            });
        });
    }

    // Initialize Commands
    renderCommands('all');

    document.querySelectorAll('.cmd-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.cmd-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderCommands(tab.dataset.tab, document.getElementById('cmdSearch').value);
        });
    });

    document.getElementById('cmdSearch').addEventListener('input', (e) => {
        const activeTab = document.querySelector('.cmd-tab.active').dataset.tab;
        renderCommands(activeTab, e.target.value);
    });

    // Dashboard Mockup
    function bindToggles() {
        document.querySelectorAll('.dash-toggle').forEach(toggle => {
            if (toggle.dataset.bound) return;
            toggle.dataset.bound = "true";
            toggle.addEventListener('click', () => { toggle.classList.toggle('off'); });
        });
    }

    const dashboardPages = {
        'dash-general': `
            <div class="dash-view-header">
                <h3>Server Configurations</h3>
                <p>Manage core settings for your community.</p>
            </div>
            <div class="dash-setting-row">
                <div class="dash-setting-info">
                    <h4>Auto-Mod Engine</h4>
                    <p>Filter bad words & prevent spam automatically.</p>
                </div>
                <div class="dash-toggle"></div>
            </div>
            <div class="dash-setting-row">
                <div class="dash-setting-info">
                    <h4>Logging System</h4>
                    <p>Redirect deleted messages and ban events.</p>
                </div>
                <button class="btn btn-sm" onclick="showModal(event, 'Log Routing')">Configure</button>
            </div>
            <div class="dash-setting-row">
                <div class="dash-setting-info">
                    <h4>Auto-Role Selection</h4>
                    <p>Grant members a role instantly upon joining.</p>
                </div>
                <select class="input-field" style="padding: 6px 12px; width: 120px;" onchange="alert('Auto-role updated to ' + this.value + '. Syncing with Discord...')">
                    <option>@Member</option>
                    <option>@Guest</option>
                    <option>None</option>
                </select>
            </div>
        `,
        'dash-music': `
            <div class="dash-view-header">
                <h3>Music Player Configuration</h3>
                <p>Adjust audio quality and playback features.</p>
            </div>
            <div class="dash-setting-row">
                <div class="dash-setting-info">
                    <h4>Default Volume</h4>
                    <p>Set the baseline volume constraint.</p>
                </div>
                <input type="range" min="1" max="100" value="100" style="accent-color: var(--brand);" onchange="alert('Volume updated to: ' + this.value + '. Saved to server config!')">
            </div>
            <div class="dash-setting-row">
                <div class="dash-setting-info">
                    <h4>24/7 Presence</h4>
                    <p>Keep the bot in the voice channel permanently.</p>
                </div>
                <div class="dash-toggle off"></div>
            </div>
        `,
        'dash-mod': `
            <div class="dash-view-header">
                <h3>Moderation & Safety</h3>
                <p>Configure defensive limits and strict blacklists.</p>
            </div>
            <div class="dash-setting-row">
                <div class="dash-setting-info">
                    <h4>Spam Threshold</h4>
                    <p>Messages allowed within 3 seconds.</p>
                </div>
                <input type="number" value="5" min="3" max="10" class="input-field" style="width: 70px; text-align: center;" onchange="alert('Spam threshold set to ' + this.value + ' messages. Configuration saved!')">
            </div>
            <div class="dash-setting-row">
                <div class="dash-setting-info">
                    <h4>Targeted Blacklist</h4>
                    <p>Manage strict regex filters and custom strings.</p>
                </div>
                <button class="btn btn-sm" onclick="showModal(null, 'bannedWordsModal')">View Entries (5)</button>
            </div>
        `,
        'dash-analytics': `
            <div class="dash-view-header">
                <h3>Server Analytics</h3>
                <p>Data visualization for the past 7 days.</p>
            </div>
            <div style="border: 1px solid var(--border-subtle); border-radius: 8px; padding: 2rem; text-align: center; margin-top: 1rem;">
                <i class="fa-solid fa-chart-line text-brand" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
                <h4>Command Execution Telemetry</h4>
                <div style="height: 120px; display:flex; align-items:flex-end; justify-content:space-around; padding-top: 20px; border-bottom: 1px solid var(--border-subtle); margin-top: 1rem;">
                    <div style="width: 24px; background: var(--brand); height: 40%; border-radius: 4px 4px 0 0; opacity: 0.8;"></div>
                    <div style="width: 24px; background: var(--discord); height: 70%; border-radius: 4px 4px 0 0; opacity: 0.8;"></div>
                    <div style="width: 24px; background: var(--brand); height: 50%; border-radius: 4px 4px 0 0; opacity: 0.8;"></div>
                    <div style="width: 24px; background: var(--discord); height: 90%; border-radius: 4px 4px 0 0; opacity: 0.8;"></div>
                    <div style="width: 24px; background: var(--brand); height: 60%; border-radius: 4px 4px 0 0; opacity: 0.8;"></div>
                    <div style="width: 24px; background: var(--discord); height: 100%; border-radius: 4px 4px 0 0; opacity: 0.8;"></div>
                </div>
            </div>
        `
    };

    const dashMenu = document.querySelectorAll('.dash-menu-item');
    const dashContent = document.getElementById('dash-content-area');

    dashMenu.forEach(item => {
        item.addEventListener('click', () => {
            dashMenu.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            if (dashboardPages[item.dataset.target]) {
                dashContent.innerHTML = dashboardPages[item.dataset.target];
                bindToggles();
            }
        });
    });

    // Init dash
    if (dashContent) {
        dashContent.innerHTML = dashboardPages['dash-general'];
        bindToggles();
    }

    // copy upi logic
    const copyUpiBtn = document.getElementById('copy-upi-btn');
    if (copyUpiBtn) {
        copyUpiBtn.addEventListener('click', () => {
            navigator.clipboard.writeText('why.so@ptaxis').then(() => {
                const originalHtml = '<i class="fa-regular fa-copy"></i> Copy UPI ID';
                copyUpiBtn.innerHTML = '<i class="fa-solid fa-check text-brand"></i> Copied!';
                copyUpiBtn.style.color = 'var(--brand)';
                copyUpiBtn.style.borderColor = 'var(--brand)';

                setTimeout(() => {
                    copyUpiBtn.innerHTML = originalHtml;
                    copyUpiBtn.style.color = '';
                    copyUpiBtn.style.borderColor = '';
                }, 2000);
            });
        });
    }
});
// Global Modal Logic
function showModal(event, contentName) {
    if (event) event.preventDefault();
    if (contentName === 'bannedWordsModal') {
        document.getElementById('bannedWordsModal').classList.add('active');
        return;
    }
    const pageObj = document.getElementById('modalPageName');
    if (pageObj) pageObj.innerText = contentName;
    document.getElementById('comingSoonModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Navigate to real dashboard
function goToDashboard() {
    window.location.href = '/dashboard.html';
}
