/**
 * @file UI module for the Hospital Booking System.
 *
 * This module handles all DOM manipulation, including rendering
 * doctor lists, populating filters, and managing the details drawer.
 */

// DOM Element Selectors
const doctorListContainer = document.getElementById('doctor-list');
const specialtyFilter = document.getElementById('filter-specialty');
const hospitalFilter = document.getElementById('filter-hospital');
const drawer = document.getElementById('doctor-drawer');
const drawerContent = document.getElementById('drawer-content');
const drawerTitle = document.getElementById('drawer-title');
const closeDrawerBtn = document.getElementById('close-drawer-btn');
let lastActiveElement; // For accessibility

/**
 * Creates the HTML string for a single doctor card.
 * @param {import('./models.js').Doctor} doctor The doctor object.
 * @returns {string} The HTML string for the doctor card.
 */
function createDoctorCardHTML(doctor) {
    const roundedRating = Math.round(doctor.rating);
    const stars = '★'.repeat(roundedRating) + '☆'.repeat(5 - roundedRating);
    return `
        <div class="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col">
            <div class="p-6 flex-grow">
                <img class="w-24 h-24 rounded-full mx-auto mb-4 object-cover" src="${doctor.profile_img}" alt="Profile image of ${doctor.name}">
                <h3 class="text-lg font-bold text-gray-900 text-center">${doctor.name}</h3>
                <p class="text-sm text-primary text-center">${doctor.specialty}</p>
                <p class="text-sm text-gray-600 text-center mt-1">${doctor.hospital}</p>
                <div class="mt-4 flex justify-center items-center" aria-label="Rating: ${doctor.rating} out of 5 stars">
                    <span class="text-yellow-500">${stars}</span>
                    <span class="text-sm text-gray-600 ml-2">(${doctor.rating})</span>
                </div>
            </div>
            <div class="p-4 bg-gray-50 text-center">
                <button data-doctor-id="${doctor.id}" class="view-profile-btn w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    View Profile & Book
                </button>
            </div>
        </div>
    `;
}

/**
 * Renders the list of doctors in the main view.
 * @param {import('./models.js').Doctor[]} doctors Array of doctor objects.
 */
export function renderDoctorList(doctors) {
    if (!doctorListContainer) return;

    if (doctors.length === 0) {
        doctorListContainer.innerHTML = `<p class="text-gray-500 col-span-full text-center py-10">No doctors found matching your criteria.</p>`;
        return;
    }

    doctorListContainer.innerHTML = doctors.map(createDoctorCardHTML).join('');
}

/**
 * Populates the filter dropdowns with unique values.
 * @param {import('./models.js').Doctor[]} doctors Array of all doctor objects.
 */
export function populateFilters(doctors) {
    if (!specialtyFilter || !hospitalFilter) return;

    const specialties = [...new Set(doctors.map(doc => doc.specialty))].sort();
    const hospitals = [...new Set(doctors.map(doc => doc.hospital))].sort();

    specialtyFilter.innerHTML = '<option value="">All Specialties</option>'; // Reset
    hospitalFilter.innerHTML = '<option value="">All Hospitals</option>'; // Reset

    specialties.forEach(specialty => {
        const option = new Option(specialty, specialty);
        specialtyFilter.add(option);
    });

    hospitals.forEach(hospital => {
        const option = new Option(hospital, hospital);
        hospitalFilter.add(option);
    });
}

/**
 * Renders the content for the doctor details drawer.
 * @param {import('./models.js').Doctor} doctor The selected doctor.
 */
export function renderDrawerContent(doctor) {
    if (!drawerContent || !drawerTitle) return;

    drawerTitle.textContent = `Dr. ${doctor.name}`;
    // Placeholder for the calendar. The calendar module will render into this div.
    const calendarContainer = `<div id="calendar-container" class="mt-4 bg-gray-50 p-4 rounded-md"><div class="spinner mx-auto"></div><p class="text-center text-sm mt-2">Loading availability...</p></div>`;

    drawerContent.innerHTML = `
        <div class="flex items-center mb-6">
            <img class="w-20 h-20 rounded-full mr-4 object-cover" src="${doctor.profile_img}" alt="">
            <div>
                <h2 class="text-2xl font-bold text-gray-900 sr-only">${doctor.name}</h2>
                <p class="text-md text-primary">${doctor.specialty}</p>
                <p class="text-sm text-gray-600">${doctor.hospital}</p>
            </div>
        </div>
        <div class="mb-6">
             <h3 class="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Biography</h3>
             <p class="text-gray-700 leading-relaxed">${doctor.bio}</p>
        </div>
        <div class="mb-6">
             <h3 class="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Details</h3>
             <dl class="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div class="sm:col-span-1">
                    <dt class="text-sm font-medium text-gray-500">Languages</dt>
                    <dd class="mt-1 text-sm text-gray-900">${doctor.getLanguages()}</dd>
                </div>
                <div class="sm:col-span-1">
                    <dt class="text-sm font-medium text-gray-500">Rating</dt>
                    <dd class="mt-1 text-sm text-gray-900">${doctor.rating} / 5.0</dd>
                </div>
             </dl>
        </div>
        <div>
            <h3 class="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Book an Appointment</h3>
            ${calendarContainer}
        </div>
    `;
}

/**
 * Opens the doctor details drawer and handles focus.
 */
export function openDrawer() {
    if (!drawer) return;
    lastActiveElement = document.activeElement;
    drawer.classList.remove('hidden');
    drawer.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus();
}

/**
 * Closes the doctor details drawer and restores focus.
 */
export function closeDrawer() {
    if (!drawer) return;
    drawer.classList.add('hidden');
    lastActiveElement?.focus();
}

// --- Event Listeners ---
closeDrawerBtn?.addEventListener('click', closeDrawer);

drawer?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDrawer();
    }
    // Add focus trap here later if needed
});

// Close drawer if clicking outside the content area
drawer?.addEventListener('click', (e) => {
    if (e.target === drawer) {
        closeDrawer();
    }
});
