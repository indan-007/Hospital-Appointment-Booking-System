/**
 * @file Data models for the application.
 * Defines classes for Doctor, Slot, and Booking to ensure
 * data consistency and encapsulate related logic.
 */

/**
 * Represents a Doctor.
 */
export class Doctor {
    constructor({ id, name, specialty, hospital, rating, languages, profile_img, bio }) {
        this.id = id;
        this.name = name;
        this.specialty = specialty;
        this.hospital = hospital;
        this.rating = rating;
        this.languages = languages || [];
        this.profile_img = profile_img;
        this.bio = bio;
    }

    /**
     * Returns a comma-separated string of languages for display.
     * @returns {string}
     */
    getLanguages() {
        return this.languages.join(', ');
    }
}

/**
 * Represents an available appointment slot.
 */
export class Slot {
    constructor({ slot_id, doctor_id, start_time, end_time, is_booked = false }) {
        this.slot_id = slot_id;
        this.doctor_id = doctor_id;
        // Store time as Date objects for easier manipulation and timezone handling
        this.start_time = new Date(start_time);
        this.end_time = new Date(end_time);
        this.is_booked = is_booked;
    }

    /**
     * Formats the slot time for display in the user's local timezone.
     * e.g., "9:00 AM - 9:30 AM"
     * @returns {string}
     */
    getFormattedTime() {
        const options = { hour: 'numeric', minute: 'numeric', hour12: true };
        // Use local time for display
        const startTime = this.start_time.toLocaleTimeString([], options);
        const endTime = this.end_time.toLocaleTimeString([], options);
        return `${startTime} - ${endTime}`;
    }

    /**
     * Returns the date of the slot in a simple YYYY-MM-DD format.
     * @returns {string}
     */
    getDateString() {
        // Use UTC methods to avoid timezone off-by-one day errors
        const year = this.start_time.getUTCFullYear();
        const month = String(this.start_time.getUTCMonth() + 1).padStart(2, '0');
        const day = String(this.start_time.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

/**
 * Represents a patient booking.
 */
export class Booking {
    constructor({ id, slot_id, doctor_id, patient_name, patient_email, patient_phone, booking_ref }) {
        this.id = id; // Will be null for new bookings until saved to DB
        this.slot_id = slot_id;
        this.doctor_id = doctor_id;
        this.patient_name = patient_name;
        this.patient_email = patient_email;
        this.patient_phone = patient_phone;
        // Generate a booking reference if one isn't provided
        this.booking_ref = booking_ref || this.constructor.generateBookingRef();
    }

    /**
     * Generates a unique booking reference ID.
     * Format: "MB-XXXX-XXXX"
     * @returns {string}
     */
    static generateBookingRef() {
        const prefix = 'MB';
        const randomPart = () => Math.random().toString(16).substr(2, 4).toUpperCase();
        return `${prefix}-${randomPart()}-${randomPart()}`;
    }
}
