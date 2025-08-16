/**
 * @file IndexedDB wrapper for the Hospital Booking System.
 *
 * This module handles all interactions with the IndexedDB database,
 * including schema definition, migrations, and CRUD operations.
 */

const DB_NAME = 'hospital-booking-db';
const DB_VERSION = 1;
let db;

/**
 * Opens and initializes the IndexedDB database.
 * Handles schema creation and version upgrades.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 */
function openDB() {
    return new Promise((resolve, reject) => {
        // If the database connection is already open, resolve it.
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject('Error opening database');
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database opened successfully.');
            resolve(db);
        };

        // This event is only triggered for new databases or version changes.
        request.onupgradeneeded = (event) => {
            const dbInstance = event.target.result;
            console.log('Database upgrade needed.');

            // Create 'doctors' object store
            if (!dbInstance.objectStoreNames.contains('doctors')) {
                dbInstance.createObjectStore('doctors', { keyPath: 'id' });
            }

            // Create 'slots' object store
            if (!dbInstance.objectStoreNames.contains('slots')) {
                const slotsStore = dbInstance.createObjectStore('slots', { keyPath: 'slot_id' });
                slotsStore.createIndex('doctor_id', 'doctor_id', { unique: false });
                slotsStore.createIndex('start_time', 'start_time', { unique: false });
            }

            // Create 'bookings' object store
            if (!dbInstance.objectStoreNames.contains('bookings')) {
                const bookingsStore = dbInstance.createObjectStore('bookings', { keyPath: 'id', autoIncrement: true });
                bookingsStore.createIndex('slot_id', 'slot_id', { unique: true });
            }
        };
    });
}

/**
 * A generic function to perform a database transaction.
 * @param {string} storeName The name of the object store.
 * @param {IDBTransactionMode} mode The transaction mode ('readonly' or 'readwrite').
 * @param {(store: IDBObjectStore) => IDBRequest} operation The operation to perform on the store.
 * @returns {Promise<any>} A promise that resolves with the result of the operation.
 */
async function performTransaction(storeName, mode, operation) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);

        transaction.oncomplete = () => {
            // Transaction completed successfully.
        };

        transaction.onerror = (event) => {
            console.error(`Transaction error on ${storeName}:`, event.target.error);
            reject(event.target.error);
        };

        const request = operation(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => {
             // This is for request-specific errors
            console.error(`Request error on ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

// Service object containing all public database methods.
const dbService = {
    get: (storeName, key) => performTransaction(storeName, 'readonly', store => store.get(key)),
    getAll: (storeName) => performTransaction(storeName, 'readonly', store => store.getAll()),
    add: (storeName, item) => performTransaction(storeName, 'readwrite', store => store.add(item)),
    put: (storeName, item) => performTransaction(storeName, 'readwrite', store => store.put(item)),
    delete: (storeName, key) => performTransaction(storeName, 'readwrite', store => store.delete(key)),
    clear: (storeName) => performTransaction(storeName, 'readwrite', store => store.clear()),

    /**
     * Populates the database with initial data from JSON files if the stores are empty.
     */
    async populateInitialData() {
        await openDB();

        const populateStore = async (storeName, jsonPath) => {
            try {
                const count = await performTransaction(storeName, 'readonly', store => store.count());
                if (count === 0) {
                    console.log(`Populating '${storeName}' store...`);
                    const response = await fetch(jsonPath);
                    if (!response.ok) throw new Error(`Failed to fetch ${jsonPath}`);
                    const data = await response.json();

                    const db = await openDB();
                    const transaction = db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    for (const item of data) {
                        store.add(item);
                    }
                    await new Promise(resolve => transaction.oncomplete = resolve);
                    console.log(`'${storeName}' store populated.`);
                }
            } catch (error) {
                console.error(`Error populating '${storeName}' store:`, error);
            }
        };

        await populateStore('doctors', './data/doctors.json');
        await populateStore('slots', './data/slots.json');
    },

    /**
     * Performs a transaction on multiple object stores.
     * @param {string[]} storeNames Array of store names.
     * @param {IDBTransactionMode} mode Transaction mode.
     * @param {(stores: Record<string, IDBObjectStore>) => Promise<void>} operation
     * @returns {Promise<void>}
     */
    async performMultiStoreTransaction(storeNames, mode, operation) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeNames, mode);
            const stores = {};
            for (const name of storeNames) {
                stores[name] = transaction.objectStore(name);
            }

            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(event.target.error);

            operation(stores);
        });
    }
};

export default dbService;
