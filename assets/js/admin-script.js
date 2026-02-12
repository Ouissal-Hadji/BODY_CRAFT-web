/* =========================================
   ADMIN DASHBOARD LOGIC (v2.1 - Master Admin Security)
   ========================================= */

// Configuration
const CONFIG = {
    authKey: 'admin_session_token',
    userKey: 'admin_user_info',
    api: window.location.protocol === 'file:' ? 'http://127.0.0.1:3000/api' : '/api'
};

// Temp File Storage
let tempBeforeFile = null;
let tempAfterFile = null;

// Security State
let isSettingsUnlocked = false;

/* =========================================
   GLOBAL FUNCTIONS 
   ========================================= */

window.navToSection = function (sectionId) {
    try {
        // SECURITY CHECK for 'admins' section
        if (sectionId === 'admins' && !isSettingsUnlocked) {
            window.openModal('pin-modal');
            return; // Stop navigation until unlocked
        }

        // Navigation Logic
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));

        const link = document.querySelector(`.menu-item[data-target="${sectionId}"]`);
        if (link) link.classList.add('active');

        const sec = document.getElementById(sectionId);
        if (sec) sec.classList.add('active');

        const title = document.getElementById('current-page-title');
        if (title) title.textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);

        if (sectionId === 'overview') {
            setTimeout(updateStats, 100);
        }
        if (sectionId === 'admins') renderAdmins();
        if (sectionId === 'clients') renderClients(); // New
    } catch (e) { console.error("Nav Error:", e); }
};

// ... (Toggle Theme, Open/Close Modal omitted, same as before) ...

window.deleteClient = async function (id) {
    if (confirm('Delete this client record?')) {
        await fetch(`${CONFIG.api}/clients/${id}`, { method: 'DELETE' });
        renderClients();
    }
};

/* =========================================
   INITIALIZATION
   ========================================= */
// ...

// 6. Add Client Form (New)
window.toggleCustomEnd = function (select) {
    const d = document.getElementById('client-end-date');
    if (select.value === 'custom') d.style.display = 'block';
    else d.style.display = 'none';
};

// (Moved to initDashboard)

// ... 

async function renderClients() {
    try {
        const data = await fetchStore('clients');
        const tbody = document.getElementById('clients-table-body');
        const empty = document.getElementById('clients-empty');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (data.length === 0) {
            if (empty) empty.style.display = 'block';
        } else {
            if (empty) empty.style.display = 'none';
            data.forEach(item => {
                const row = document.createElement('tr');

                // Status Badge
                const isSubscribing = item.endDate === 'Still Subscribing';
                const statusHtml = isSubscribing
                    ? `<span style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:4px; font-size:0.8rem; font-weight:600;">Active</span>`
                    : `<span style="background:#f3f4f6; color:#4b5563; padding:2px 8px; border-radius:4px; font-size:0.8rem;">Ended: ${item.endDate}</span>`;

                row.innerHTML = `
                    <td>
                        <div style="font-weight:600;">${item.name}</div>
                        <div style="font-size:0.85rem; opacity:0.7;">${item.email}</div>
                    </td>
                    <td>
                        <div>${item.weight} kg</div>
                        <div style="font-size:0.85rem; opacity:0.7;">${item.height} cm</div>
                    </td>
                    <td>
                        <div style="font-weight:600; color:var(--color-primary);">$${item.price}</div>
                    </td>
                    <td>
                        <div style="font-size:0.85rem;">Start: ${item.startDate}</div>
                        <div style="margin-top:2px;">${statusHtml}</div>
                    </td>
                    <td>
                        <strong>${item.progress || '-'}</strong>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="window.deleteClient('${item.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (e) { console.error("Render Clients Error:", e); }
}

window.toggleTheme = function () {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('admin_theme_pref', next);
    const btn = document.getElementById('admin-theme-toggle');
    if (btn) btn.innerHTML = next === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
};

window.openModal = function (id) {
    try {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
            modal.style.display = 'flex';
        }

        // Modal Specific Resets
        if (id === 'upload-modal') {
            const f = document.getElementById('upload-form');
            if (f) f.reset();
            tempBeforeFile = null;
            tempAfterFile = null;
            resetPreview('before');
            resetPreview('after');
        }
        if (id === 'add-admin-modal') {
            const f = document.getElementById('add-admin-form');
            if (f) f.reset();
        }
        if (id === 'pin-modal') {
            const f = document.getElementById('pin-form');
            if (f) f.reset();
        }
    } catch (e) { console.error("Open Modal Error:", e); }
};

window.closeModal = function (id) {
    try {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = '';
        }
    } catch (e) { console.error("Close Modal Error:", e); }
};

window.logout = function () {
    localStorage.removeItem(CONFIG.authKey);
    localStorage.removeItem(CONFIG.userKey);
    window.location.href = 'admin-login.html';
};

window.deleteGalleryItem = async function (id) {
    if (confirm('Delete this image?')) {
        await fetch(`${CONFIG.api}/gallery/${id}`, { method: 'DELETE' });
        renderGallery();
        updateStats();
    }
};

window.deleteAchievement = async function (id) {
    if (confirm('Delete achievement?')) {
        await fetch(`${CONFIG.api}/achievements/${id}`, { method: 'DELETE' });
        renderAchievements();
        updateStats();
    }
};

window.deleteMember = async function (id) {
    if (confirm('Delete member?')) {
        await fetch(`${CONFIG.api}/members/${id}`, { method: 'DELETE' });
        renderMembers();
        updateStats();
    }
};

window.deleteAdmin = async function (id) {
    if (confirm('Delete this admin user?')) {
        const res = await fetch(`${CONFIG.api}/admins/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
            renderAdmins();
        } else {
            alert(json.message || 'Error deleting admin');
        }
    }
};


/* =========================================
   INITIALIZATION
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Theme
        const savedTheme = localStorage.getItem('admin_theme_pref') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const tBtn = document.getElementById('admin-theme-toggle');
        if (tBtn) tBtn.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

        // Check Auth using Token
        const token = localStorage.getItem(CONFIG.authKey);

        // If login page
        if (document.getElementById('login-form')) {
            if (token) window.location.href = 'admin-dashboard.html';
            initLogin();
            return;
        }

        // If dashboard page
        if (!token) {
            window.location.href = 'admin-login.html';
            return;
        }

        initDashboard();

    } catch (e) { console.error("Init Error:", e); }
});


function initLogin() {
    const loginForm = document.getElementById('login-form');
    loginForm.onsubmit = async (e) => {
        try {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('login-btn');
            const errorBanner = document.getElementById('general-error');

            if (btn) {
                btn.querySelector('.btn-text').style.display = 'none';
                btn.querySelector('.btn-loader').style.display = 'block';
            }
            if (errorBanner) errorBanner.style.display = 'none';

            // API LOGIN
            const res = await fetch(`${CONFIG.api}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem(CONFIG.authKey, data.token);
                localStorage.setItem(CONFIG.userKey, JSON.stringify(data.user));
                window.location.href = 'admin-dashboard.html';
            } else {
                if (errorBanner) {
                    errorBanner.textContent = data.message || 'Invalid credentials.';
                    errorBanner.style.display = 'block';
                }
                if (btn) {
                    btn.querySelector('.btn-text').style.display = 'block';
                    btn.querySelector('.btn-loader').style.display = 'none';
                }
            }
        } catch (e) { console.error("Login Error:", e); }
    };

    // Toggle Password
    const toggle = document.getElementById('toggle-password');
    if (toggle) {
        toggle.onclick = function () {
            const input = document.getElementById('password');
            if (input) input.type = input.type === 'password' ? 'text' : 'password';
        };
    }
}

function initDashboard() {
    try {
        console.log("Initializing Dashboard UI");

        // Set User Info
        const user = JSON.parse(localStorage.getItem(CONFIG.userKey) || '{}');
        if (user.name) {
            document.getElementById('current-user-name').textContent = user.name;
            const welcomeMsg = document.getElementById('welcome-message');
            if (welcomeMsg) welcomeMsg.textContent = `Welcome Back, ${user.name}!`;
        }
        if (user.role) {
            document.getElementById('current-user-role').textContent = user.role.toUpperCase();

            // NEW: Restrict Add Admin Button (Allow any Owner or the Super Admin email)
            const isMaster = (user.role === 'owner' || user.email === 'admin@elitetransform.com');
            const addBtnContainer = document.getElementById('add-admin-btn-container');

            if (addBtnContainer) {
                if (!isMaster) {
                    // Hide button and show requested message
                    addBtnContainer.innerHTML = `<p style="color: var(--text-secondary); font-style: italic; font-size: 0.9rem; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 4px;">
                        <i class="fas fa-lock"></i> just the mester admins can add new admins
                    </p>`;
                } else {
                    // Ensure button is visible if logic previously hid it
                    addBtnContainer.style.display = 'block';
                }
            }
        }

        // Server Status Check
        async function checkServer() {
            const dot = document.getElementById('status-dot');
            const text = document.getElementById('status-text');
            if (!dot || !text) return;

            const healthUrl = `${CONFIG.api}/health?t=${Date.now()}`;
            console.log(`[Status] Checking: ${healthUrl}`);

            try {
                const res = await fetch(healthUrl, { cache: 'no-cache' });
                if (res.ok) {
                    const data = await res.json();
                    console.log("[Status] Server OK:", data);
                    dot.style.background = '#0D9488'; // Teal
                    text.textContent = 'Server Connected';
                    text.style.color = '#0D9488';
                } else {
                    console.warn(`[Status] Server Error: HTTP ${res.status}`);
                    dot.style.background = '#f59e0b'; // Amber
                    text.textContent = `Server Error (${res.status})`;
                    text.style.color = '#f59e0b';
                }
            } catch (e) {
                console.error("[Status] Server Offline:", e.message);
                dot.style.background = '#ef4444'; // Red
                text.textContent = 'Server Offline (Check Terminal)';
                text.style.color = '#ef4444';
            }
        }
        checkServer();
        setInterval(checkServer, 10000); // Check every 10s

        // Initialize Data
        renderGallery();
        renderAchievements();
        renderMembers();
        updateStats();

        // Mobile Menu
        const toggle = document.getElementById('menu-toggle');
        if (toggle) {
            toggle.onclick = () => {
                const sb = document.getElementById('sidebar');
                if (sb) sb.classList.toggle('active');
            };
        }

        // --- FORMS ---

        // 1. PIN Form (Security Gate)
        const pinForm = document.getElementById('pin-form');
        if (pinForm) {
            pinForm.onsubmit = (e) => {
                e.preventDefault();
                const pin = document.getElementById('security-pin').value;
                if (pin === 'W1234') {
                    isSettingsUnlocked = true;
                    window.closeModal('pin-modal');
                    window.navToSection('admins'); // Proceed to secure section
                } else {
                    alert('Incorrect PIN!');
                }
            };
        }

        // 2. Upload Form
        const upForm = document.getElementById('upload-form');
        if (upForm) {
            upForm.onsubmit = async (e) => {
                e.preventDefault();
                if (!tempBeforeFile || !tempAfterFile) {
                    alert("Please select both 'Before' and 'After' images.");
                    return;
                }

                // Helper to upload single file
                const uploadFile = async (file) => {
                    const fd = new FormData();
                    fd.append('image', file);
                    const res = await fetch(`${CONFIG.api}/upload`, { method: 'POST', body: fd });
                    const j = await res.json();
                    return j.url;
                }

                try {
                    const beforeUrl = await uploadFile(tempBeforeFile);
                    const afterUrl = await uploadFile(tempAfterFile);

                    const title = document.getElementById('img-title').value;
                    const desc = document.getElementById('img-desc').value;

                    await fetch(`${CONFIG.api}/gallery`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ beforeSrc: beforeUrl, afterSrc: afterUrl, title, desc })
                    });

                    window.closeModal('upload-modal');
                    renderGallery();
                    updateStats();
                } catch (err) {
                    alert("Upload Failed: " + err.message);
                }
            };

            setupSimpleFile('drop-zone-before', 'file-input-before', 'preview-before', (f) => tempBeforeFile = f);
            setupSimpleFile('drop-zone-after', 'file-input-after', 'preview-after', (f) => tempAfterFile = f);
        }

        // 3. Achievement Form
        const achForm = document.getElementById('achievement-form');
        if (achForm) {
            achForm.onsubmit = async (e) => {
                e.preventDefault();
                const data = {
                    year: document.getElementById('ach-year').value,
                    title: document.getElementById('ach-title').value,
                    desc: document.getElementById('ach-desc').value
                };
                await fetch(`${CONFIG.api}/achievements`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                window.closeModal('achievement-modal');
                renderAchievements();
                updateStats();
            };
        }

        // 4. Member Form
        const memForm = document.getElementById('member-form');
        if (memForm) {
            memForm.onsubmit = async (e) => {
                e.preventDefault();
                const name = document.getElementById('mem-name').value;
                const data = {
                    name,
                    role: document.getElementById('mem-role').value,
                    quote: document.getElementById('mem-quote').value,
                    weight: document.getElementById('mem-weight').value,
                    initial: name ? name.charAt(0).toUpperCase() : 'U'
                };
                await fetch(`${CONFIG.api}/members`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                window.closeModal('member-modal');
                renderMembers();
                updateStats();
            };
        }

        // 5. Add Admin Form (Fixed)
        const adminForm = document.getElementById('add-admin-form'); // Ensure ID matches HTML
        if (adminForm) {
            adminForm.onsubmit = async (e) => {
                e.preventDefault(); // Stop reload

                // Extra Security Check (Allow any Owner)
                const user = JSON.parse(localStorage.getItem(CONFIG.userKey) || '{}');
                const isMaster = (user.role === 'owner' || user.email === 'admin@elitetransform.com');

                if (!isMaster) {
                    alert("Unauthorized: just the mester admins can add new admins");
                    return;
                }

                console.log("Submitting New Admin...");

                const data = {
                    name: document.getElementById('new-admin-name').value,
                    email: document.getElementById('new-admin-email').value,
                    password: document.getElementById('new-admin-password').value,
                    role: document.getElementById('new-admin-role').value
                };

                try {
                    const res = await fetch(`${CONFIG.api}/admins`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        cache: 'no-cache',
                        body: JSON.stringify(data)
                    });
                    const json = await res.json();

                    if (json.success) {
                        window.closeModal('add-admin-modal');
                        renderAdmins(); // Refresh table
                        alert('Admin added successfully!');
                    } else {
                        alert(json.message);
                    }
                } catch (err) {
                    console.error("Add Admin Error:", err);
                }
            };
        } else {
            console.error("DEBUG: add-admin-form not found!");
        }

        // 6. Add Client Form (Moved here for reliability)
        const clientForm = document.getElementById('add-client-form');
        if (clientForm) {
            console.log("Client Form listener attached.");
            clientForm.onsubmit = async (e) => {
                e.preventDefault();
                console.log("Submitting Client...");

                const statusVal = document.getElementById('client-status-select').value;
                let endDateDisplay = 'Active';

                if (statusVal === 'active') endDateDisplay = 'Still Subscribing';
                else if (statusVal === 'custom') endDateDisplay = document.getElementById('client-end-date').value || 'Unknown';
                else endDateDisplay = statusVal.replace('_', ' ').toUpperCase();

                const data = {
                    name: document.getElementById('client-name').value,
                    email: document.getElementById('client-email').value,
                    weight: document.getElementById('client-weight').value,
                    height: document.getElementById('client-height').value,
                    price: document.getElementById('client-price').value,
                    startDate: document.getElementById('client-start-date').value,
                    endDate: endDateDisplay,
                    progress: document.getElementById('client-progress').value
                };

                try {
                    const res = await fetch(`${CONFIG.api}/clients`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        cache: 'no-cache',
                        body: JSON.stringify(data)
                    });
                    const json = await res.json();

                    if (json.success) {
                        window.closeModal('add-client-modal');
                        await renderClients();
                        alert('Client Added Successfully!');
                    } else {
                        alert('Error adding client.');
                    }
                } catch (err) {
                    console.error("Client Add Error:", err);
                    alert("Connection failed. Check if Server is running in the black terminal window.");
                }
            };
        } else {
            console.error("DEBUG: add-client-form not found in DOM!");
        }

        // (Removed Edit Admin Form)

    } catch (e) { console.error("Dashboard Init Error:", e); }
}


/* =========================================
   Data & Rendering Helpers
   ========================================= */

async function fetchStore(route) {
    try {
        const url = `${CONFIG.api}/${route}?t=${Date.now()}`;
        const res = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-cache'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error(`FetchStore Error (${route}):`, e);
        return [];
    }
}

async function renderGallery() {
    try {
        const data = await fetchStore('gallery');
        const container = document.getElementById('gallery-container');
        const empty = document.getElementById('gallery-empty');
        if (!container) return;

        container.innerHTML = '';
        if (data.length === 0) {
            if (empty) empty.style.display = 'block';
        } else {
            if (empty) empty.style.display = 'none';
            data.forEach(item => {
                const div = document.createElement('div');
                div.className = 'gallery-item';
                div.innerHTML = `
                    <img src="${item.afterSrc}" class="gallery-img">
                    <div style="position:absolute; bottom:0; left:0; width:100%; padding:10px; background:rgba(0,0,0,0.7); color:white;">
                        <strong style="font-size:0.9rem;">${item.title}</strong>
                    </div>
                    <div class="gallery-actions">
                        <button class="btn btn-sm btn-danger" onclick="window.deleteGalleryItem('${item.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                container.appendChild(div);
            });
        }
    } catch (e) { console.error("Render Gallery Error:", e); }
}

async function renderAchievements() {
    try {
        const data = await fetchStore('achievements');
        const tbody = document.getElementById('achievements-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.year}</td>
                <td><strong>${item.title}</strong><br><small>${item.desc}</small></td>
                <td>Experience</td>
                <td><button class="btn btn-sm btn-danger" onclick="window.deleteAchievement('${item.id}')"><i class="fas fa-trash"></i></button></td>
            `;
            tbody.appendChild(row);
        });
    } catch (e) { }
}

async function renderMembers() {
    try {
        const data = await fetchStore('members');
        const grid = document.getElementById('members-grid');
        if (!grid) return;
        grid.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'flex-start';
            const wBadge = item.weight ? `<span style="background:var(--color-primary); color:white; padding:2px 8px; font-size:0.75rem; border-radius:4px;">${item.weight}</span>` : '';

            card.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; width:100%;">
                    <div class="user-avatar" style="width:50px; height:50px;">${item.initial}</div>
                    <div>
                        <h4 style="margin:0;">${item.name}</h4>
                        <span style="font-size:0.8rem; opacity:0.7;">${item.role}</span>
                        ${wBadge}
                    </div>
                </div>
                <p style="font-style:italic; font-size:0.9rem; margin-top:10px;">"${item.quote}"</p>
                <button class="btn btn-sm btn-danger" style="margin-top:auto;" onclick="window.deleteMember('${item.id}')">Remove</button>
            `;
            grid.appendChild(card);
        });
    } catch (e) { }
}

async function renderAdmins() {
    try {
        const data = await fetchStore('admins');
        const tbody = document.getElementById('admins-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        // DEBUG: Check who is logged in
        const currentUser = JSON.parse(localStorage.getItem(CONFIG.userKey) || '{}');
        // Check for 'owner' (Master Admin) role OR specific Super Admin email
        const isOwner = (currentUser.role === 'owner' || currentUser.email === 'admin@elitetransform.com');

        console.log("Current User Role:", currentUser.role, "| Is Owner?", isOwner);
        console.log("Admins Data from Server:", data); // <--- DEBUG Log

        // Security: If no role/email found, force logout to refresh data
        if (!currentUser.role || !currentUser.email) {
            console.warn("No role or email found in local storage. Forcing logout to refresh credentials.");
            window.logout();
            return;
        }

        if (data.length > 0) {
            // DEBUG: Alert to show exactly what keys we have
            // alert('Debug Data Keys: ' + Object.keys(data[0]).join(', ') + '\nPass: ' + data[0].password);
            console.log('Admin Data Sample:', data[0]);
        }

        // --- DEBUG SECTION REMOVED ---

        data.forEach(admin => {
            const row = document.createElement('tr');

            // Delete Action only
            let actionButtons = ``;
            if (isOwner) {
                actionButtons += `<button class="btn btn-sm btn-danger" onclick="window.deleteAdmin('${admin.id}')"><i class="fas fa-trash"></i></button>`;
            } else {
                actionButtons = `<span style="opacity:0.5;">Restricted</span>`;
            }

            // Password Column (Owner Only - No Toggle)
            let passwordDisplay = '****';
            if (isOwner) {
                passwordDisplay = `<span style="font-family:monospace;">••••••••</span>`;
            }

            row.innerHTML = `
                <td><strong>${admin.name}</strong></td>
                <td>${admin.email}</td>
                <td>${passwordDisplay}</td>
                <td><span style="background: #eef2ff; color: #4f46e5; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${admin.role}</span></td>
                <td>${actionButtons}</td>
             `;
            tbody.appendChild(row);
        });
    } catch (e) { console.error("Render Admins Error:", e); }
}

// Global Toggle Function (Refactored for Span)
// (Removed toggleRowPass)

// --- EDIT ADMIN FEATURES ---
let adminCache = []; // Store fetched admins to populate edit modal easily

// --- EDIT ADMIN FEATURES REMOVED ---

// Attach Edit Form Submit Listener
// (Moved to initDashboard)

function animateValue(obj, start, end, duration) {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

async function updateStats() {
    try {
        const g = await fetchStore('gallery');
        const a = await fetchStore('achievements');
        const m = await fetchStore('members');

        const s1 = document.getElementById('stat-gallery-count');
        const s2 = document.getElementById('stat-achievements-count');
        const s3 = document.getElementById('stat-members-count');

        if (s1) animateValue(s1, 0, g.length || 0, 1000);
        if (s2) animateValue(s2, 0, a.length || 0, 1000);
        if (s3) animateValue(s3, 0, m.length || 0, 1000);
    } catch (e) { }
}

// Simple File Logic
function resetPreview(type) {
    try {
        const p = document.getElementById(`preview-${type}`);
        const z = document.getElementById(`drop-zone-${type}`);
        const i = document.getElementById(`file-input-${type}`);
        if (p) { p.style.display = 'none'; p.style.backgroundImage = ''; }
        if (z) { z.innerHTML = `<i class="fas fa-camera"></i> Select ${type.charAt(0).toUpperCase() + type.slice(1)}`; z.style.display = 'block'; }
        if (i) i.value = '';
    } catch (e) { }
}

function setupSimpleFile(zoneId, inputId, previewId, callback) {
    try {
        const zone = document.getElementById(zoneId);
        const input = document.getElementById(inputId);

        if (zone && input) {
            zone.onclick = () => { input.click(); };

            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const p = document.getElementById(previewId);
                    if (p) {
                        p.style.display = 'block';
                        p.style.backgroundImage = `url(${ev.target.result})`;
                    }
                    zone.innerHTML = '<i class="fas fa-check"></i> Selected';
                };
                reader.readAsDataURL(file);
                callback(file);
            };
        }
    } catch (e) { }
}
