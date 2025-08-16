/**
 * @file Calendar module for displaying doctor availability.
 *
 * Renders an accessible, timezone-aware calendar and handles slot selection.
 */

import { Slot } from './models.js';

// Module-level state
let currentDate = new Date();
let onSlotSelectCallback;
let allDoctorSlots;
let calendarContainer;

/**
 * Groups available (unbooked) slots by date string (YYYY-MM-DD).
 * @param {Slot[]} slots - Array of slot objects.
 * @returns {Map<string, Slot[]>} A map where keys are 'YYYY-MM-DD' and values are arrays of slots.
 */
function groupSlotsByDate(slots) {
    const availableSlots = slots.filter(slot => !slot.is_booked);
    return availableSlots.reduce((acc, slot) => {
        const dateString = slot.getDateString();
        if (!acc.has(dateString)) {
            acc.set(dateString, []);
        }
        acc.get(dateString).push(slot);
        return acc;
    }, new Map());
}

/**
 * Renders the time slots for a selected day into the time-slot-container.
 * @param {string} selectedDateString - The 'YYYY-MM-DD' string of the selected date.
 */
function renderTimeSlots(selectedDateString) {
    const container = document.getElementById('time-slot-container');
    if (!container) return;

    const slotsByDate = groupSlotsByDate(allDoctorSlots);
    const slotsForDay = slotsByDate.get(selectedDateString) || [];

    if (slotsForDay.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-600 text-center py-4">No available times on this day.</p>';
        return;
    }

    // Sort slots by start time
    slotsForDay.sort((a, b) => a.start_time - b.start_time);

    container.innerHTML = `
        <h4 class="font-semibold text-center mb-3 text-gray-800">Available Times</h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            ${slotsForDay.map(slot => `
                <button data-slot-id="${slot.slot_id}" class="time-slot-btn bg-secondary text-white text-sm py-2 px-1 rounded-md hover:bg-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    ${slot.getFormattedTime()}
                </button>
            `).join('')}
        </div>
    `;

    container.querySelectorAll('.time-slot-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (onSlotSelectCallback) {
                // Visually indicate selection
                container.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('ring-2', 'ring-offset-2', 'ring-primary'));
                e.currentTarget.classList.add('ring-2', 'ring-offset-2', 'ring-primary');
                onSlotSelectCallback(e.currentTarget.dataset.slotId);
            }
        });
    });
}

/**
 * Draws the main calendar grid, header, and day names.
 */
function drawCalendar() {
    if (!calendarContainer) return;

    calendarContainer.innerHTML = ''; // Clear previous content
    const slotsByDate = groupSlotsByDate(allDoctorSlots);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-4';
    header.innerHTML = `
        <button id="prev-month" aria-label="Previous month" class="p-2 rounded-full hover:bg-gray-200">&lt;</button>
        <h3 id="month-year" class="text-lg font-semibold text-gray-800" aria-live="polite">
            ${new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button id="next-month" aria-label="Next month" class="p-2 rounded-full hover:bg-gray-200">&gt;</button>
    `;
    calendarContainer.appendChild(header);

    const dayGrid = document.createElement('div');
    dayGrid.className = 'grid grid-cols-7 gap-1 text-center text-sm text-gray-500 font-medium border-b pb-2';
    dayGrid.innerHTML = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `<div>${day}</div>`).join('');
    calendarContainer.appendChild(dayGrid);

    const dateGrid = document.createElement('div');
    dateGrid.className = 'grid grid-cols-7 gap-1 mt-2';

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) {
        dateGrid.appendChild(document.createElement('div'));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const daySlots = slotsByDate.get(dateString);
        const cell = document.createElement('div');
        cell.className = 'flex justify-center items-center h-10';

        if (daySlots) {
            const button = document.createElement('button');
            button.dataset.date = dateString;
            button.className = 'date-btn w-9 h-9 rounded-full font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary';
            button.textContent = day;
            button.setAttribute('aria-label', `${daySlots.length} slots available on ${new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`);
            cell.appendChild(button);
        } else {
            cell.innerHTML = `<div class="w-9 h-9 flex items-center justify-center text-gray-400">${day}</div>`;
        }
        dateGrid.appendChild(cell);
    }
    calendarContainer.appendChild(dateGrid);

    const timeSlotContainer = document.createElement('div');
    timeSlotContainer.id = 'time-slot-container';
    timeSlotContainer.className = 'mt-4 min-h-[5rem]';
    calendarContainer.appendChild(timeSlotContainer);

    // Attach event listeners
    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        drawCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        drawCalendar();
    });

    dateGrid.querySelectorAll('.date-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedButton = e.currentTarget;
            renderTimeSlots(selectedButton.dataset.date);
            dateGrid.querySelectorAll('.date-btn').forEach(b => b.classList.remove('bg-primary', 'text-white', 'ring-2', 'ring-offset-1', 'ring-primary'));
            selectedButton.classList.add('bg-primary', 'text-white');
            selectedButton.classList.remove('bg-blue-100', 'text-blue-800');
        });
    });
}

/**
 * Main entry point to render the calendar.
 * @param {HTMLElement} container - The element to render the calendar into.
 * @param {Slot[]} slots - All slots for the current doctor.
 * @param {(slotId: string) => void} onSlotSelect - Callback for when a time slot is selected.
 */
export function renderCalendar(container, slots, onSlotSelect) {
    calendarContainer = container;
    allDoctorSlots = slots.map(s => new Slot(s)); // Ensure we have Slot instances
    onSlotSelectCallback = onSlotSelect;
    currentDate = new Date(); // Reset to current month whenever a new doctor's calendar is shown

    drawCalendar();
}
