# Deployment Guide - Dark Mode Fitness Landing Page

This is a single-page "Landing Page" website with a dark theme and cyan accents.

## Key Features
-   **Dark Mode**: Sleek `#121212` background with `#00E5FF` accents.
-   **Single Page**: All content (Hero, Features, About, Contact) is on one scrollable page.
-   **No Backend Form**: The contact form is configured to open the user's email client directly.

## How to Customize

### 1. Contact Form Email
Currently, the form uses `mailto:ouissal.hadji123@gmail.com`.
-   **To keep this**: No changes needed. When a user clicks "Send", their default email app (Outlook, Mail, etc.) will open with a draft to your address.
-   **For a better experience (Recommended)**:
    1.  Go to [formspree.io](https://formspree.io) and register (it's free).
    2.  Create a new form and copy the endpoint URL (e.g., `https://formspree.io/f/xvqlewk`).
    3.  Open `index.html` and change:
        ```html
        <form action="mailto:ouissal.hadji123@gmail.com" ...>
        ```
        to
        ```html
        <form action="https://formspree.io/f/YOUR_NEW_CODE" method="POST">
        ```
    4.  Remove `enctype="text/plain"`.

### 2. Images
Replace the placeholder images with your own files in `assets/images` and update the `src` tags in `index.html`.

## Deployment

### Netlify (Drag & Drop)
1.  Log in to [Netlify](https://app.netlify.com).
2.  Drag the `C:\Users\hadji\Downloads\First_client` folder onto the dashboard.
3.  Your site is live!

### GitHub Pages
1.  Push your code to a GitHub repository.
2.  Go to Settings > Pages > Source: Main Branch.
