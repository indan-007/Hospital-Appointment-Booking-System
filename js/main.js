/**
 * @file Main entry point for the Hospital Booking System application.
 *
 * This file initializes the application, wires up event listeners,
 * and coordinates the different modules (DB, UI, etc.).
 */

import db from './db.js';
import { Doctor, Slot } from './models.js';
import { renderDoctorList, populateFilters, renderDrawerContent, openDrawer } from './ui.js';
import { renderCalendar } from './calendar.js';
import { startBookingFlow } from './booking.js';
import './admin.js'; // Import to initialize admin event listeners

// --- Application State ---
let allDoctors = [];
let allSlots = [];

// --- DOM Element References ---
const searchInput = document.getElementById('search-doctor');
const specialtyFilter = document.getElementById('filter-specialty');
const hospitalFilter = document.getElementById('filter-hospital');
const doctorListContainer = document.getElementById('doctor-list');

// --- Functions ---

/**
 * Fetches all necessary data from the database and stores it in local state.
 */
async function loadData() {
    const [doctorsData, slotsData] = await Promise.all([
        db.getAll('doctors'),
        db.getAll('slots')
    ]);
    allDoctors = doctorsData.map(d => new Doctor(d));
    allSlots = slotsData.map(s => new Slot(s));
}

/**
 * Applies filters based on the current values of the input controls.
 */
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedSpecialty = specialtyFilter.value;
    const selectedHospital = hospitalFilter.value;

    const filteredDoctors = allDoctors.filter(doctor => {
        const nameMatch = doctor.name.toLowerCase().includes(searchTerm);
        const specialtyMatch = doctor.specialty.toLowerCase().includes(searchTerm);
        const specialtyFilterMatch = !selectedSpecialty || doctor.specialty === selectedSpecialty;
        const hospitalFilterMatch = !selectedHospital || doctor.hospital === selectedHospital;

        return (nameMatch || specialtyMatch) && specialtyFilterMatch && hospitalFilterMatch;
    });

    renderDoctorList(filteredDoctors);
}

/**
 * Handles clicks on the "View Profile" buttons on doctor cards.
 * @param {Event} e The click event.
 */
async function handleViewProfileClick(e) {
    const button = e.target.closest('.view-profile-btn');
    if (!button) return;

    const doctorId = Number(button.dataset.doctorId);
    const doctor = allDoctors.find(d => d.id === doctorId);
    if (!doctor) return;

    // 1. Render the static part of the drawer
    renderDrawerContent(doctor);
    openDrawer();

    // 2. Fetch slots for this doctor and render the calendar
    const doctorSlots = allSlots.filter(s => s.doctor_id === doctorId);
    const calendarContainer = document.getElementById('calendar-container');
    if (calendarContainer) {
        renderCalendar(calendarContainer, doctorSlots, (slotId) => {
            // This is the callback that starts the booking flow
            startBookingFlow(slotId);
        });
    }
}

/**
 * Refreshes the calendar in the drawer after a booking is completed.
 */
async function refreshDrawer() {
    const drawer = document.getElementById('doctor-drawer');
    if (drawer.classList.contains('hidden')) return;

    const doctorId = Number(doctorListContainer.querySelector('.view-profile-btn')?.dataset.doctorId);
    if (!doctorId) return;

    // We need to re-fetch data as it might have changed
    await loadData();

    const doctor = allDoctors.find(d => d.id === doctorId);
    const doctorSlots = allSlots.filter(s => s.doctor_id === doctorId);
    const calendarContainer = document.getElementById('calendar-container');
    if (calendarContainer) {
        renderCalendar(calendarContainer, doctorSlots, startBookingFlow);
    }
}

/**
 * Initializes the application.
 */
async function init() {
    // 1. Ensure database is populated with initial data
    await db.populateInitialData();

    // 2. Load all data from DB into state
    await loadData();

    // 3. Render initial UI
    populateFilters(allDoctors);
    applyFilters(); // Renders the initial full list

    // 4. Attach event listeners
    searchInput.addEventListener('input', applyFilters);
    specialtyFilter.addEventListener('change', applyFilters);
    hospitalFilter.addEventListener('change', applyFilters);
    doctorListContainer.addEventListener('click', handleViewProfileClick);

    // 5. Listen for custom events
    window.addEventListener('bookingComplete', refreshDrawer);
    window.addEventListener('exitAdmin', init); // Re-initialize app on exiting admin mode
}

/**
 * Registers the service worker for PWA functionality.
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }
}

// --- Entry Point ---
document.addEventListener('DOMContentLoaded', () => {
    init();
    registerServiceWorker();
});
