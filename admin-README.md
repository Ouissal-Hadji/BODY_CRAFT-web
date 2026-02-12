# Admin Dashboard Guide | Elite Transform

This is a secure-style Admin Dashboard for managing your content.

## 🚀 Quick Start

1.  **Access the Login Page**: Open `admin-login.html` in your browser.
2.  **Login Credentials**:
    -   **Email**: `admin@elitetransform.com`
    -   **Password**: `Admin@2024`

## 🛠 Features

### 1. Dashboard Overview
See an at-a-glance view of your total images, achievements, and community members.

### 2. Gallery Manager
*   **Upload**: Drag & drop images or click to select.
*   **View**: See a grid of all uploaded images.
*   **Delete**: Remove old images.

### 3. Achievements
*   **Add**: Enter a year, title, and description for new milestones.
*   **Timeline**: View all achievements in a list format.

### 4. Community Members
*   **Manage**: Add user success stories with quotes and roles.

### 5. Data Persistence & Export
*   **Storage**: All data is saved in your **browser's storage** (LocalStorage). It will persist even if you refresh the page.
*   **Export**: Go to the **Settings** tab and click "Export Data JSON" to download a backup of your content.

## ⚠️ Important Note for Production
This dashboard uses **client-side storage** for demonstration purposes. This means:
1.  If you clear your browser cache, the data will be lost.
2.  The data is only visible on *your* specific computer/browser.
3.  To make this live for the public website, a backend developer would need to connect these forms to a real database (MySQL/MongoDB).

## Main Site Integration
Currently, the `index.html` (Landing Page) reads static HTML. To make it dynamic:
-   **Method A (Manual)**: Use the dashboard to organize content, then manually update `index.html` with the text/images.
-   **Method B (Dynamic)**: Update `assets/js/script.js` on the main site to read from the same `localStorage` keys used by this admin panel (`admin_gallery_data`, etc.).
