/* =========================================
   SERVER.JS - Backend for Elite Transform
   ========================================= */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const sgMail = require('@sendgrid/mail');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Health Check (Top Level)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve Static Files (Frontend)
app.use(express.static(__dirname)); // Serves index.html, admin.html etc. from root
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Data Directory Setup
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Uploads Directory Setup
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Multer Storage Engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/* =========================================
   DATA HELPERS
   ========================================= */
const getFile = (file) => path.join(DATA_DIR, file);

const readJSON = (file) => {
    try {
        const filePath = getFile(file);
        if (!fs.existsSync(filePath)) return [];
        const content = fs.readFileSync(filePath, 'utf8');
        // console.log(`[DEBUG] Reading ${file} from ${filePath}`); // Too verbose?
        return JSON.parse(content);
    } catch (err) {
        console.error(`Error reading ${file}:`, err);
        return [];
    }
};

const writeJSON = (file, data) => {
    try {
        if (!data) {
            console.error(`Error: Attempted to write null/undefined data to ${file}`);
            return false;
        }
        const str = JSON.stringify(data, null, 2);
        fs.writeFileSync(getFile(file), str);
        return true;
    } catch (err) {
        console.error(`Error writing ${file}:`, err);
        return false;
    }
};

// Generic Helper (Moved to top to avoid ReferenceError)
const handleCrud = (key, route) => {
    app.get(`/api/${route}`, (req, res) => {
        try {
            res.json(readJSON(`${key}.json`));
        } catch (err) {
            res.status(500).json({ error: 'Read error' });
        }
    });

    app.post(`/api/${route}`, (req, res) => {
        try {
            const items = readJSON(`${key}.json`);
            const newItem = req.body;
            console.log(`[POST /api/${route}] Receiving:`, newItem);

            // Basic validation/ID
            if (!newItem.id) newItem.id = Date.now().toString();
            items.unshift(newItem); // Add to top

            const success = writeJSON(`${key}.json`, items);
            if (success) {
                res.json({ success: true, item: newItem });
            } else {
                res.status(500).json({ success: false, message: 'Write failed' });
            }
        } catch (err) {
            console.error(`[POST /api/${route}] Internal Error:`, err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    });

    app.delete(`/api/${route}/:id`, (req, res) => {
        try {
            const { id } = req.params;
            let items = readJSON(`${key}.json`);
            items = items.filter(x => x.id !== id);
            writeJSON(`${key}.json`, items);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Delete error' });
        }
    });
};

// Initialize Data Files if missing
['gallery.json', 'achievements.json', 'members.json', 'admins.json', 'clients.json'].forEach(f => {
    if (!fs.existsSync(getFile(f))) {
        if (f === 'admins.json') {
            // Default Admin: admin@elitetransform.com / Admin@2024
            writeJSON(f, [{
                id: '1',
                name: 'Super Admin',
                email: 'admin@elitetransform.com',
                password: 'Admin@2024',
                role: 'owner'
            }]);
        } else {
            writeJSON(f, []);
        }
    }
});

/* =========================================
   ROUTES
   ========================================= */

// --- CONTENT CRUD (Gallery, etc) ---
handleCrud('gallery', 'gallery');
handleCrud('achievements', 'achievements');
handleCrud('members', 'members');
handleCrud('clients', 'clients'); // NEW clients endpoint

// --- AUTHENTICATION ---
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const admins = readJSON('admins.json');
    const user = admins.find(a => a.email === email && a.password === password);

    if (user) {
        // Simple token (In prod use JWT)
        const token = 'session_' + user.id + '_' + Date.now();
        res.json({ success: true, token, user: { name: user.name, email: user.email, role: user.role } });
    } else {
        res.json({ success: false, message: 'Invalid credentials' });
    }
});

// --- ADMIN MANAGEMENT ---
app.get('/api/admins', (req, res) => {
    const admins = readJSON('admins.json');
    console.log(`[GET /api/admins] Sending ${admins.length} admins. Sample ID: ${admins[0]?.id}, Pass: ${admins[0]?.password}`);
    res.json(admins);
});

app.post('/api/admins', (req, res) => {
    const { name, email, password, role } = req.body;
    console.log(`[POST /api/admins] Received:`, { name, email, password, role }); // DEBUG

    if (!name || !email || !password) {
        console.error("[POST /api/admins] Missing fields!");
        return res.status(400).json({ error: 'Missing fields' });
    }

    const admins = readJSON('admins.json');
    if (admins.find(a => a.email === email)) {
        console.warn(`[POST /api/admins] Email ${email} already exists.`);
        return res.json({ success: false, message: 'Email exists' });
    }

    const newAdmin = {
        id: Date.now().toString(),
        name, email, password,
        role: role || 'admin'
    };
    admins.push(newAdmin);
    writeJSON('admins.json', admins);
    console.log(`[POST /api/admins] Added admin: ${newAdmin.id}`);
    res.json({ success: true, admin: newAdmin });
});

// NEW: Update Admin (Edit)
app.put('/api/admins/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role } = req.body;

        console.log(`[PUT /api/admins/${id}] Request Body:`, req.body); // DEBUG

        let admins = readJSON('admins.json');
        const index = admins.findIndex(a => a.id === id);

        if (index === -1) {
            console.error(`[PUT /api/admins/${id}] Admin not found.`);
            return res.json({ success: false, message: 'Admin not found' });
        }

        // Update fields
        admins[index].name = name;
        admins[index].email = email;
        admins[index].role = role;

        // Only update password if provided and not empty
        if (password && password.trim() !== '') {
            console.log(`[PUT /api/admins/${id}] Updating Password.`);
            admins[index].password = password;
        } else {
            console.log(`[PUT /api/admins/${id}] Password not updated (empty/null).`);
        }

        const success = writeJSON('admins.json', admins);
        if (success) {
            console.log(`[PUT /api/admins/${id}] Successfully updated.`);
            res.json({ success: true });
        } else {
            console.status(500).json({ success: false, message: 'Write failed' });
        }
    } catch (err) {
        console.error(`[PUT /api/admins/:id] CRITICAL ERROR:`, err);
        res.status(500).json({ success: false, message: 'Server Internal Error' });
    }
});

app.delete('/api/admins/:id', (req, res) => {
    const { id } = req.params;
    let admins = readJSON('admins.json');
    const toDelete = admins.find(a => a.id === id);

    if (toDelete && toDelete.role === 'owner') {
        return res.json({ success: false, message: 'Cannot delete Owner' });
    }

    admins = admins.filter(a => a.id !== id);
    writeJSON('admins.json', admins);
    res.json({ success: true });
});

// --- CONTACT / EMAIL ---
// Configure SendGrid (More reliable for Render Free Tier)
sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'SG.placeholder');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
        user: 'ouissal.hadji123@gmail.com',
        pass: process.env.GMAIL_PASS || 'uwskmnpgfnabhfml'
    },
    tls: {
        rejectUnauthorized: false
    }
});

app.post('/api/contact', async (req, res) => {
    const { user_name, user_email, message } = req.body;
    console.log(`[CONTACT] Received message from ${user_name} (${user_email})`);

    const msg = {
        to: 'ouissal.hadji123@gmail.com',
        from: 'ouissal.hadji123@gmail.com', // MUST be a verified sender in SendGrid
        replyTo: user_email,
        subject: `New Contact Message from ${user_name}`,
        text: `Name: ${user_name}\nEmail: ${user_email}\n\nMessage:\n${message}`,
        html: `<p><strong>Name:</strong> ${user_name}</p><p><strong>Email:</strong> ${user_email}</p><p><strong>Message:</strong></p><p>${message}</p>`
    };

    try {
        console.log(`[ATTEMPT] Sending email via SendGrid API...`);
        await sgMail.send(msg);
        console.log(`[SUCCESS] Email sent via SendGrid`);
        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('[CRITICAL] SendGrid Error:', error.response ? error.response.body : error);

        // Fallback to Nodemailer for local development
        if (process.env.NODE_ENV !== 'production') {
            try {
                console.log("[FALLBACK] Attempting SMTP Fallback...");
                await transporter.sendMail({
                    from: 'ouissal.hadji123@gmail.com',
                    to: 'ouissal.hadji123@gmail.com',
                    subject: `[LOCAL] Contact from ${user_name}`,
                    text: message
                });
                return res.json({ success: true, message: 'Sent via SMTP Fallback' });
            } catch (smtpErr) {
                console.error("[SMTP FAIL] Fallback also failed.");
            }
        }

        res.status(500).json({
            success: false,
            message: 'Email service currently unavailable. Please check SendGrid API Key.',
            technical: error.code || 'API_ERROR'
        });
    }
});

// --- UPLOADS ---
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // Return the path that frontend can use
    res.json({ url: `uploads/${req.file.filename}` });
});


// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📂 Serving static files from: ${__dirname}`);
    console.log(`📂 Data Directory: ${DATA_DIR}`);
    console.log(`👥 Admins loaded: ${readJSON('admins.json').length}`);
});
