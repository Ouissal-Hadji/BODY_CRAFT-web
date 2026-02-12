document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       0. Scroll Effects
       ========================================= */
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    /* =========================================
       1. Theme Toggle Logic
       ========================================= */
    const themeToggle = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;
    const icon = themeToggle ? themeToggle.querySelector('i') : null;

    // Check saved preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlEl.setAttribute('data-theme', savedTheme);
    updateIcon(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlEl.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            htmlEl.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcon(newTheme);
        });
    }

    function updateIcon(theme) {
        if (!icon) return;
        if (theme === 'dark') {
            icon.className = 'fas fa-sun'; // Show sun to switch to light
        } else {
            icon.className = 'fas fa-moon'; // Show moon to switch to dark
        }
    }

    /* =========================================
       2. Mobile Menu
       ========================================= */
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('main-nav');

    if (mobileBtn && nav) {
        mobileBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }

    /* =========================================
       3. Dynamic Admin Content (API Bridge)
       ========================================= */
    const API_BASE = window.location.protocol === 'file:' ? 'http://127.0.0.1:3000/api' : '/api';
    loadDynamicContent();

    async function fetchData(route) {
        try {
            const res = await fetch(`${API_BASE}/${route}?t=${Date.now()}`);
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            console.error(`Fetch error for ${route}:`, e);
            return [];
        }
    }

    async function loadDynamicContent() {
        // --- GALLERY ---
        const galleryContainer = document.getElementById('dynamic-gallery');
        if (galleryContainer) {
            const galleryData = await fetchData('gallery');
            if (galleryData.length > 0) {
                galleryContainer.innerHTML = '';
                galleryData.slice(0, 8).forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'gallery-item reveal-active';

                    if (item.beforeSrc && item.afterSrc) {
                        div.innerHTML = `
                            <div style="position:relative; height:320px; display:flex;">
                                <div style="flex:1; height:100%; border-right:1px solid rgba(255,255,255,0.2); position:relative;">
                                    <img src="${item.beforeSrc}" style="width:100%; height:100%; object-fit:cover;" alt="Before">
                                    <span style="position:absolute; bottom:10px; left:10px; background:rgba(0,0,0,0.6); color:white; padding:4px 8px; font-size:0.75rem; border-radius:4px; font-weight:700;">BEFORE</span>
                                </div>
                                <div style="flex:1; height:100%; position:relative;">
                                    <img src="${item.afterSrc}" style="width:100%; height:100%; object-fit:cover;" alt="After">
                                    <span style="position:absolute; bottom:10px; left:10px; background:var(--primary); color:white; padding:4px 8px; font-size:0.75rem; border-radius:4px; font-weight:700;">AFTER</span>
                                </div>
                            </div>
                            <div style="padding:20px;">
                                <h4 style="margin-bottom:8px; font-size:1.1rem;">${item.title}</h4>
                                <p style="font-size:0.95rem; opacity:0.8; margin:0;">${item.desc || ''}</p>
                            </div>
                        `;
                    } else {
                        div.innerHTML = `<img src="${item.src}" alt="${item.title}" loading="lazy" style="width:100%; height:!00%; object-fit:cover;">`;
                    }
                    galleryContainer.appendChild(div);
                });
            } else {
                galleryContainer.innerHTML = `<p style="opacity:0.6; text-align:center; grid-column:1/-1;">No transformations yet.</p>`;
            }
        }

        // --- ACHIEVEMENTS ---
        const achContainer = document.getElementById('dynamic-achievements');
        if (achContainer) {
            const achData = await fetchData('achievements');
            if (achData.length > 0) {
                achContainer.innerHTML = '';
                achData.forEach((item, index) => {
                    const card = document.createElement('div');
                    card.className = 'feature-card reveal-active';
                    card.style.transitionDelay = `${index * 0.1}s`;
                    card.innerHTML = `
                        <div style="font-weight:800; color:var(--primary); margin-bottom:12px; font-size:1.2rem;">${item.year}</div>
                        <h3 style="font-size:1.4rem; margin-bottom:10px;">${item.title}</h3>
                        <p style="font-size:1rem; opacity:0.8;">${item.desc}</p>
                    `;
                    achContainer.appendChild(card);
                });
            }
        }

        // --- MEMBERS ---
        const memContainer = document.getElementById('dynamic-members');
        if (memContainer) {
            const memData = await fetchData('members');
            if (memData.length > 0) {
                memContainer.innerHTML = '';
                memData.forEach((item, index) => {
                    const card = document.createElement('div');
                    card.className = 'feature-card reveal-active';
                    card.style.transitionDelay = `${index * 0.1}s`;

                    const weightBadge = item.weight ? `<div style="margin-top:12px; display:inline-block; background:var(--primary); color:white; padding:4px 12px; border-radius:var(--radius-sm); font-weight:800; font-size:0.8rem;">${item.weight}</div>` : '';

                    card.innerHTML = `
                        <div style="display:flex; align-items:center; gap:18px; margin-bottom:20px;">
                            <div style="width:56px; height:56px; background:var(--primary-soft); color:var(--primary); border-radius:16px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.2rem;">${item.initial}</div>
                            <div>
                                <h4 style="margin:0; font-size:1.1rem;">${item.name}</h4>
                                <span style="font-size:0.85rem; opacity:0.7;">${item.role}</span>
                            </div>
                        </div>
                        <p style="font-style:italic; font-size:1rem; line-height:1.6;">"${item.quote}"</p>
                        ${weightBadge}
                    `;
                    memContainer.appendChild(card);
                });
            } else {
                memContainer.innerHTML = `<p style="opacity:0.6; text-align:center; grid-column:1/-1;">No stories yet.</p>`;
            }
        }
    }

    /* =========================================
       4. EmailJS Form Submission
       ========================================= */
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const btn = contactForm.querySelector('button[type="submit"]');
            const btnText = btn.querySelector('.btn-text');
            const btnLoader = btn.querySelector('.btn-loader');
            const statusDiv = document.getElementById('form-status');

            // Show Loader
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
            btn.disabled = true;

            // Backend API Call
            const formData = {
                user_name: document.getElementById('user_name').value,
                user_email: document.getElementById('user_email').value,
                message: document.getElementById('message').value
            };

            fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> Message sent to server!';
                        statusDiv.className = 'form-status status-success';
                        statusDiv.style.display = 'block';
                        contactForm.reset();
                    } else {
                        throw new Error(data.message || 'unknown error');
                    }
                })
                .catch(error => {
                    console.error('API Error:', error);

                    let message = 'Failed to connect to server. ';
                    if (error.message.includes('Failed to fetch')) {
                        message += '<br>Is the black window running?<br>Try refreshing the page.';
                    } else {
                        message += error.message;
                    }

                    statusDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
                    statusDiv.className = 'form-status status-error';
                    statusDiv.style.display = 'block';
                })
                .finally(() => {
                    btnText.style.display = 'inline-block';
                    btnLoader.style.display = 'none';
                    btn.disabled = false;
                });
        });
    }
});
