/**
 * @file Manages the admin mode, including passphrase gate, data import/export, and other admin functions.
 */

import db from './db.js';

const ADMIN_PASSPHRASE = 'admin123'; // Hardcoded passphrase for this static application.

// --- DOM Element References ---
const adminBtn = document.getElementById('admin-mode-btn');
const passphraseModal = document.getElementById('admin-passphrase-modal');
const passphraseInput = document.getElementById('admin-passphrase-input');
const passphraseSubmitBtn = document.getElementById('admin-passphrase-submit');
const passphraseCancelBtn = document.getElementById('admin-passphrase-cancel');
const mainContent = document.querySelector('main');
let originalMainContentHTML; // To store the user view

// --- Functions ---

/** Shows the passphrase modal dialog. */
function showPassphraseModal() {
    passphraseModal.classList.remove('hidden');
    passphraseInput.focus();
}

/** Hides the passphrase modal dialog. */
function hidePassphraseModal() {
    passphraseModal.classList.add('hidden');
    passphraseInput.value = '';
}

/** Switches the view to the admin panel. */
function enterAdminMode() {
    hidePassphraseModal();
    originalMainContentHTML = mainContent.innerHTML; // Save the current user view
    mainContent.innerHTML = createAdminViewHTML();
    attachAdminEventListeners();
}

/** Exits admin mode and restores the user view. */
function exitAdminMode() {
    mainContent.innerHTML = originalMainContentHTML;
    // Dispatch an event to signal that the main UI should be re-initialized
    window.dispatchEvent(new CustomEvent('exitAdmin'));
}

/** Handles the submission of the passphrase. */
function handlePassphraseSubmit() {
    if (passphraseInput.value === ADMIN_PASSPHRASE) {
        enterAdminMode();
    } else {
        alert('Incorrect passphrase.');
        passphraseInput.select();
    }
}

/**
 * Exports all data from IndexedDB to a JSON file.
 */
async function exportData() {
    try {
        const doctors = await db.getAll('doctors');
        const slots = await db.getAll('slots');
        const bookings = await db.getAll('bookings');

        const data = {
            doctors,
            slots,
            bookings,
            export_date: new Date().toISOString()
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `medibook-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Data exported successfully!');
    } catch (error) {
        console.error('Failed to export data:', error);
        alert(`Data export failed: ${error.message}`);
    }
}

/**
 * Imports data from a user-selected JSON file, overwriting existing data.
 */
async function importData() {
    const fileInput = document.getElementById('import-file-input');
    if (fileInput.files.length === 0) {
        alert('Please select a file to import.');
        return;
    }

    const file = fileInput.files[0];
    if (file.type !== 'application/json') {
        alert('Please select a valid .json file.');
        return;
    }

    const confirmed = confirm('Are you sure you want to import this data? This will ERASE all current doctors, slots, and bookings.');
    if (!confirmed) return;

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.doctors || !data.slots || !data.bookings) {
            throw new Error('Invalid file format. The file must contain "doctors", "slots", and "bookings" arrays.');
        }

        // Clear existing data first
        await db.clear('bookings');
        await db.clear('slots');
        await db.clear('doctors');

        // Use transactions for bulk import
        await db.performMultiStoreTransaction(['doctors', 'slots', 'bookings'], 'readwrite', (stores) => {
            data.doctors.forEach(item => stores.doctors.add(item));
            data.slots.forEach(item => stores.slots.add(item));
            data.bookings.forEach(item => stores.bookings.add(item));
        });

        alert('Data imported successfully! The admin panel will now refresh.');
        enterAdminMode(); // Refresh the admin view

    } catch (error) {
        console.error('Failed to import data:', error);
        alert(`Data import failed: ${error.message}`);
        // Consider restoring from a backup if the import fails mid-way, though that's complex for this scope.
    }
}

/**
 * Attaches event listeners for the dynamically created admin panel.
 */
function attachAdminEventListeners() {
    document.getElementById('exit-admin-btn')?.addEventListener('click', exitAdminMode);
    document.getElementById('export-data-btn')?.addEventListener('click', exportData);
    document.getElementById('import-data-btn')?.addEventListener('click', importData);
}

/**
 * Generates the HTML for the main admin view.
 * @returns {string}
 */
function createAdminViewHTML() {
    return `
        <section class="p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-lg">
            <div class="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h1 class="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <button id="exit-admin-btn" class="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Exit Admin Mode</button>
            </div>

            <div class="space-y-8">
                <!-- Data Management -->
                <div class="border p-4 rounded-md">
                    <h2 class="text-xl font-semibold mb-4 border-b pb-2">Data Management</h2>
                    <div class="flex flex-wrap gap-6 items-start">
                        <button id="export-data-btn" class="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Export All Data</button>
                        <div class="flex-grow">
                            <label for="import-file-input" class="block text-sm font-medium text-gray-700">Import from JSON Backup</label>
                            <input type="file" id="import-file-input" accept=".json" class="mt-1 text-sm">
                            <button id="import-data-btn" class="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 mt-2 text-sm">Import & Overwrite Data</button>
                            <p class="text-xs text-gray-600 mt-2"><strong>Warning:</strong> Importing data will overwrite all existing records.</p>
                        </div>
                    </div>
                </div>

                <!-- Doctor Management Placeholder -->
                <div class="border p-4 rounded-md">
                    <h2 class="text-xl font-semibold mb-4 border-b pb-2">Doctor Management</h2>
                    <p class="text-gray-500">Full doctor management (Add, Edit, Delete) is a future feature.</p>
                </div>

                <!-- Slot Management Placeholder -->
                <div class="border p-4 rounded-md">
                    <h2 class="text-xl font-semibold mb-4 border-b pb-2">Slot Management</h2>
                    <p class="text-gray-500">Full slot management is a future feature.</p>
                </div>
            </div>
        </section>
    `;
}

// --- Initial Event Listeners ---
adminBtn?.addEventListener('click', showPassphraseModal);
passphraseSubmitBtn?.addEventListener('click', handlePassphraseSubmit);
passphraseCancelBtn?.addEventListener('click', hidePassphraseModal);
passphraseInput?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        handlePassphraseSubmit();
    }
});
