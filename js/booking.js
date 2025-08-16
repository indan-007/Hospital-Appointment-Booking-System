/**
 * @file Manages the multi-step booking process.
 */

import db from './db.js';
import { Booking, Doctor, Slot } from './models.js';

// --- Module State ---
const modalContainer = document.getElementById('booking-modal');
let currentSlot, currentDoctor;

// --- Private Functions ---

/**
 * Renders content into the modal and displays it.
 * @param {string} contentHTML The HTML content to render inside the modal.
 */
function showModal(contentHTML) {
    if (!modalContainer) return;
    modalContainer.innerHTML = contentHTML;
    modalContainer.classList.remove('hidden');
    // Focus the first focusable element in the modal for accessibility
    modalContainer.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus();
}

/**
 * Hides the modal and dispatches an event to signal completion.
 */
function hideModal() {
    if (!modalContainer) return;
    modalContainer.innerHTML = '';
    modalContainer.classList.add('hidden');
    // Dispatch a custom event so other parts of the app can react, e.g., by refreshing the calendar
    window.dispatchEvent(new CustomEvent('bookingComplete'));
}

/**
 * Generates the HTML for the patient details form.
 * @returns {string} HTML string for the form.
 */
function renderPatientForm() {
    const slot = new Slot(currentSlot);
    return `
      <div class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <div class="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg">
          <h2 id="booking-title" class="text-2xl font-bold mb-4">Confirm Your Appointment</h2>
          <div class="mb-6 border-t border-b py-4">
            <p><strong>Doctor:</strong> ${currentDoctor.name}</p>
            <p><strong>Date:</strong> ${slot.start_time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Time:</strong> ${slot.getFormattedTime()}</p>
          </div>
          <form id="booking-form" novalidate>
            <h3 class="text-xl font-semibold mb-4">Enter Your Details</h3>
            <div class="space-y-4">
              <div>
                <label for="patient-name" class="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" id="patient-name" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary">
              </div>
              <div>
                <label for="patient-email" class="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="patient-email" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary">
              </div>
              <div>
                <label for="patient-phone" class="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
                <input type="tel" id="patient-phone" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary">
              </div>
            </div>
            <div id="booking-error" class="text-red-600 text-sm font-medium mt-4 hidden" role="alert"></div>
            <div class="mt-6 flex justify-end space-x-4">
              <button type="button" id="cancel-booking-btn" class="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300">Cancel</button>
              <button type="submit" id="confirm-booking-btn" class="px-4 py-2 rounded-md bg-primary text-white hover:bg-secondary disabled:bg-gray-400">Confirm Booking</button>
            </div>
          </form>
        </div>
      </div>
    `;
}

/**
 * Generates the text for the "copy to clipboard" feature.
 * @param {Booking} booking
 * @param {Doctor} doctor
 * @param {Slot} slot
 * @returns {string}
 */
function getConfirmationEmailText(booking, doctor, slot) {
    return `Subject: Appointment Confirmation - ${booking.booking_ref}

Dear ${booking.patient_name},

This is a confirmation of your appointment with ${doctor.name}.

Details:
- Booking Reference: ${booking.booking_ref}
- Doctor: ${doctor.name} (${doctor.specialty})
- Hospital: ${doctor.hospital}
- Date: ${slot.start_time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${slot.getFormattedTime()}

Thank you for booking with MediBook.`;
}

/**
 * Renders the final confirmation screen.
 * @param {Booking} booking The confirmed booking object.
 * @returns {string} HTML string for the confirmation screen.
 */
function renderConfirmation(booking) {
    const slot = new Slot(currentSlot);
    const emailText = getConfirmationEmailText(booking, currentDoctor, slot);

    return `
      <div class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
        <div class="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg text-center">
          <h2 id="confirmation-title" class="text-2xl font-bold text-green-600 mb-4">Booking Confirmed!</h2>
          <p class="mb-4">Your appointment reference ID is:</p>
          <p class="text-2xl font-mono bg-gray-100 p-2 rounded-md mb-6" aria-describedby="confirmation-title">${booking.booking_ref}</p>
          <div class="text-left border-t border-b py-4 mb-6">
            <p><strong>Doctor:</strong> ${currentDoctor.name}</p>
            <p><strong>Date:</strong> ${slot.start_time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Time:</strong> ${slot.getFormattedTime()}</p>
          </div>
          <div class="flex flex-wrap justify-center gap-4">
            <button id="copy-details-btn" class="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300">Copy Details</button>
            <button id="print-btn" class="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300">Print</button>
            <button id="close-confirmation-btn" class="px-4 py-2 rounded-md bg-primary text-white hover:bg-secondary">Close</button>
          </div>
          <textarea id="email-preview" class="sr-only">${emailText}</textarea>
        </div>
      </div>
    `;
}

/**
 * Handles the submission of the patient details form.
 * @param {Event} e The form submission event.
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const confirmBtn = document.getElementById('confirm-booking-btn');
    const errorDiv = document.getElementById('booking-error');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Processing...';
    errorDiv.classList.add('hidden');

    // 1. Conflict detection: re-fetch the slot to ensure it's still available
    const freshSlot = await db.get('slots', currentSlot.slot_id);
    if (freshSlot.is_booked) {
        errorDiv.textContent = 'Sorry, this slot was just booked. Please select another time.';
        errorDiv.classList.remove('hidden');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Booking';
        return;
    }

    // 2. Create Booking object
    const newBooking = new Booking({
        slot_id: currentSlot.slot_id,
        doctor_id: currentDoctor.id,
        patient_name: document.getElementById('patient-name').value,
        patient_email: document.getElementById('patient-email').value,
        patient_phone: document.getElementById('patient-phone').value,
    });

    // 3. Save to DB using an atomic transaction
    try {
        await db.performMultiStoreTransaction(['bookings', 'slots'], 'readwrite', (stores) => {
            stores.bookings.add(newBooking);

            const updatedSlot = { ...currentSlot, is_booked: true };
            stores.slots.put(updatedSlot);
        });

        showModal(renderConfirmation(newBooking));

    } catch (error) {
        console.error('Booking failed:', error);
        errorDiv.textContent = 'An error occurred during booking. Please try again.';
        errorDiv.classList.remove('hidden');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Booking';
    }
}


// --- Public API ---

/**
 * Initiates the booking flow for a given slot.
 * @param {string | number} slotId The ID of the slot to book.
 */
export async function startBookingFlow(slotId) {
    try {
        const slotData = await db.get('slots', Number(slotId));
        if (!slotData || slotData.is_booked) {
            alert('This slot is no longer available. Please refresh and try again.');
            window.dispatchEvent(new CustomEvent('bookingComplete')); // Refresh calendar
            return;
        }
        currentSlot = slotData;
        currentDoctor = await db.get('doctors', currentSlot.doctor_id);

        showModal(renderPatientForm());
    } catch (error) {
        console.error('Could not start booking flow:', error);
        alert('An error occurred. Please try again.');
    }
}

// --- Global Event Listeners (using delegation on the modal) ---
modalContainer.addEventListener('click', e => {
    if (e.target.id === 'cancel-booking-btn' || e.target.id === 'close-confirmation-btn') {
        hideModal();
    }
    if (e.target.id === 'print-btn') {
        window.print();
    }
    if (e.target.id === 'copy-details-btn') {
        const textToCopy = document.getElementById('email-preview').value;
        navigator.clipboard.writeText(textToCopy).then(() => {
            e.target.textContent = 'Copied!';
            setTimeout(() => { e.target.textContent = 'Copy Details' }, 2000);
        }).catch(err => console.error('Failed to copy text:', err));
    }
});

modalContainer.addEventListener('submit', e => {
    if (e.target.id === 'booking-form') {
        handleFormSubmit(e);
    }
});
