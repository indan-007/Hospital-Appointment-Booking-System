# MediBook: A Static Hospital Booking System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<div>
  <img src="https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E" alt="JavaScript" />
  <img src="https://img.shields.io/badge/pwa-%235A0FC8.svg?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
</div>

MediBook is a modern, fully static, and accessible hospital booking system built with vanilla JavaScript, Tailwind CSS, and IndexedDB. It functions as a Progressive Web App (PWA) and is designed to be fast, reliable, and installable on user devices, even working offline for core functionalities.

This project demonstrates how to build a feature-rich, client-side application without a backend server, using modern web technologies.

## Features

-   **Doctor Discovery**: Browse a list of doctors, with real-time search by name or specialty.
-   **Advanced Filtering**: Filter doctors by specialty and hospital.
-   **Doctor Profiles**: View detailed doctor profiles in a slide-in drawer, including biography, languages spoken, and ratings.
-   **Timezone-Aware Calendar**: An accessible calendar displays each doctor's availability, correctly adjusted to the user's local timezone.
-   **Multi-Step Booking Flow**: A seamless process to select a time, enter patient details, and receive an instant booking confirmation.
-   **Conflict Prevention**: The system checks for slot availability in real-time before confirming a booking to prevent double-booking.
-   **Unique Booking Reference**: Each confirmed booking gets a unique, easy-to-reference ID (e.g., `MB-XXXX-XXXX`).
-   **PWA & Offline Ready**: Installable as a PWA. The core application shell is cached by a service worker, allowing it to load and be browsed offline.
-   **Passphrase-Protected Admin Panel**: A secure area for managing the application's data.
-   **Data Management**: Admins can export all application data (doctors, slots, and bookings) to a single JSON file for backup, and import a JSON file to restore or overwrite the application's state.

## Tech Stack & Architecture

-   **Frontend**: HTML, CSS, Vanilla JavaScript (ES Modules)
-   **Styling**: Tailwind CSS (via the Play CDN for JIT compilation)
-   **Database**: IndexedDB for all client-side storage.
-   **PWA**: Service Worker for caching and a Web Manifest for installability.
-   **Security**: Content Security Policy (CSP) to mitigate XSS attacks.

### Project Structure

```
/
├── index.html            # Main application HTML
├── styles.css            # Custom CSS styles
├── sw.js                 # Service Worker for PWA functionality
├── manifest.webmanifest  # PWA manifest file
├── LICENSE               # MIT License
├── README.md             # This file
├── data/
│   ├── doctors.json      # Initial seed data for doctors
│   └── slots.json        # Initial seed data for slots
└── js/
    ├── main.js           # Main application controller, event listeners
    ├── db.js             # IndexedDB service wrapper
    ├── ui.js             # UI rendering and DOM manipulation
    ├── models.js         # Data models (Doctor, Slot, Booking)
    ├── calendar.js       # Availability calendar logic
    ├── booking.js        # Multi-step booking flow management
    └── admin.js          # Admin panel logic
```

## Getting Started

To run this project locally, you need a local web server. Because the application uses ES Modules, you cannot simply open `index.html` from the file system (`file:///...`).

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/medibook.git
    cd medibook
    ```

2.  **Serve the directory:**
    If you have Python 3, you can run:
    ```bash
    python -m http.server
    ```
    Or, if you have Node.js and `npx`:
    ```bash
    npx serve
    ```
    Or use any other local web server or IDE extension like VS Code's Live Server.

3.  **Open in your browser:**
    Navigate to `http://localhost:8000` (or the address provided by your server).

## Admin Panel Guide

The admin panel allows for complete management of the application's data through import and export.

### Accessing the Admin Panel

1.  Click the "Admin" button in the top-right corner of the header.
2.  A modal will appear asking for a passphrase.
3.  Enter the passphrase: `admin123` and click "Submit".

### Exporting Data

-   In the admin panel, click the **"Export All Data"** button.
-   A JSON file named `medibook-export-YYYY-MM-DD.json` will be generated and downloaded by your browser.
-   This file contains all current doctors, slots, and bookings, and can be used as a backup.

### Importing Data

This feature allows you to completely overwrite the application's database with data from a JSON file. **This is a destructive action.**

1.  Click the "Choose File" button and select a valid JSON backup file. The file must have the same structure as the exported file.
2.  Click the **"Import & Overwrite Data"** button.
3.  A confirmation dialog will appear. Confirm the action to proceed.
4.  The database will be wiped and repopulated with the data from the file. The admin panel will then refresh.

## Data Schema

### Doctors (`doctors.json`)

```json
{
  "id": 1,
  "name": "Dr. Evelyn Reed",
  "specialty": "Cardiology",
  "hospital": "City General Hospital",
  "rating": 4.8,
  "languages": ["English", "Spanish"],
  "profile_img": "https://i.pravatar.cc/150?img=1",
  "bio": "..."
}
```

### Slots (`slots.json`)

```json
{
  "slot_id": 101,
  "doctor_id": 1,
  "start_time": "2025-09-20T09:00:00Z",
  "end_time": "2025-09-20T09:30:00Z",
  "is_booked": false
}
```

### Bookings (in IndexedDB)

```json
{
  "id": 1, // Auto-incrementing primary key
  "slot_id": 103,
  "doctor_id": 1,
  "patient_name": "John Doe",
  "patient_email": "john.doe@example.com",
  "patient_phone": "123-456-7890",
  "booking_ref": "MB-ABCD-1234" // Generated automatically
}
```

## Security Considerations

-   **Content Security Policy (CSP)**: The application uses a `meta` tag to enforce a strict CSP, which helps prevent XSS attacks.
-   **Subresource Integrity (SRI)**: SRI is not implemented for the Tailwind CSS CDN script. The Play CDN is intended for development purposes and does not have a stable SRI hash. For a production deployment, it is highly recommended to use a build process (like PostCSS) to generate a static CSS file that can be secured with an SRI hash.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
