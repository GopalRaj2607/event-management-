// ======================================================================
// 1. GLOBAL VARIABLES & CONSTANTS
//    - Centralized data store and commonly used DOM elements.
// ======================================================================

// Base URL for a hypothetical API (or a local JSON file path for demo)
const API_BASE_URL = 'data/events.json'; // This will simulate fetching data

// Array to store all events fetched from the server/local storage
let allEvents = [];
// Array to store events currently being displayed (after filters/search)
let displayedEvents = [];

// Pagination variables
const EVENTS_PER_PAGE = 9; // Number of events to show per page
let currentPage = 1;

// References to key DOM elements
const eventListContainer = document.getElementById('event-list-container');
const filterCategorySelect = document.getElementById('filter-category');
const searchInput = document.getElementById('search-input');
const sortBySelect = document.getElementById('sort-by');

const addEventButtonNav = document.getElementById('add-event-btn');
const addEventButtonHero = document.getElementById('add-event-btn-hero');
const addEventButtonCTA = document.getElementById('add-event-btn-cta');

const eventModal = document.getElementById('event-modal'); // Generic modal for add/edit/view
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const closeModalButton = eventModal.querySelector('.close-button'); // Use querySelector on modal to avoid conflicts

const eventForm = document.getElementById('event-form'); // Form for adding/editing events
const formSubmitButton = eventForm.querySelector('.btn-submit-event');

const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const closeDeleteModalButton = document.getElementById('close-delete-modal');

const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const pageInfoSpan = document.getElementById('page-info');

const notificationContainer = document.getElementById('notification-container');

// Form input elements (for eventForm)
const eventIdInput = document.getElementById('event-id'); // Hidden input for edit mode
const eventTitleInput = document.getElementById('event-title');
const eventDateInput = document.getElementById('event-date');
const eventTimeInput = document.getElementById('event-time');
const eventLocationInput = document.getElementById('event-location');
const eventDescriptionInput = document.getElementById('event-description');
const eventCategoryInput = document.getElementById('event-category');
const eventImageUrlInput = document.getElementById('event-image-url');
const eventPriceInput = document.getElementById('event-price');
const eventCapacityInput = document.getElementById('event-capacity');

// Error message elements (linked to form validation)
const errorTitle = document.getElementById('error-title');
const errorDate = document.getElementById('error-date');
const errorTime = document.getElementById('error-time');
const errorLocation = document.getElementById('error-location');
const errorDescription = document.getElementById('error-description');
const errorCategory = document.getElementById('error-category');
const errorImageUrl = document.getElementById('error-image-url');
const errorPrice = document.getElementById('error-price');
const errorCapacity = document.getElementById('error-capacity');

// Hamburger menu
const hamburgerMenu = document.querySelector('.hamburger-menu');
const mainNav = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.nav-list .nav-link'); // For closing nav on click

// ======================================================================
// 2. UTILITY FUNCTIONS
//    - Reusable functions for common tasks (e.g., date formatting, DOM creation, notifications).
// ======================================================================

/**
 * Formats a date string into a more readable format.
 * @param {string} dateString - The date string to format (e.g., '2025-08-15').
 * @returns {string} Formatted date (e.g., 'August 15, 2025').
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
        console.error('Invalid date string for formatDate:', dateString, e);
        return 'Invalid Date';
    }
}

/**
 * Formats a time string into a 12-hour format with AM/PM.
 * @param {string} timeString - The time string (e.g., '14:30').
 * @returns {string} Formatted time (e.g., '02:30 PM').
 */
function formatTime(timeString) {
    if (!timeString) return 'N/A';
    try {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
        console.error('Invalid time string for formatTime:', timeString, e);
        return 'Invalid Time';
    }
}

/**
 * Creates a DOM element with specified tag name, classes, and text content.
 * @param {string} tagName - The HTML tag name (e.g., 'div', 'p', 'button').
 * @param {string[]} classNames - An array of CSS class names.
 * @param {string} textContent - The inner text content of the element.
 * @param {Object} attributes - Optional object of attributes to set (e.g., { src: 'img.jpg', alt: 'desc' }).
 * @returns {HTMLElement} The created DOM element.
 */
function createElement(tagName, classNames = [], textContent = '', attributes = {}) {
    const element = document.createElement(tagName);
    if (classNames.length) {
        element.classList.add(...classNames);
    }
    if (textContent) {
        element.textContent = textContent;
    }
    for (const key in attributes) {
        element.setAttribute(key, attributes[key]);
    }
    return element;
}

/**
 * Shows a temporary notification message to the user.
 * @param {string} message - The message to display.
 * @param {string} type - 'success', 'error', 'info', 'warning'.
 * @param {number} duration - How long the notification should display in ms.
 */
function showNotification(message, type = 'info', duration = 3000) {
    const notification = createElement('div', ['notification', `notification-${type}`], message);
    notificationContainer.appendChild(notification);

    // Auto-hide after duration
    setTimeout(() => {
        notification.classList.add('hide');
        // Remove from DOM after transition
        notification.addEventListener('transitionend', () => notification.remove());
    }, duration);
}

/**
 * Clears all error messages from the form.
 */
function clearErrorMessages() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => el.textContent = '');
}

/**
 * Helper to update the form submit button text.
 * @param {boolean} isEditMode - True if in edit mode, false for add mode.
 */
function updateFormSubmitButton(isEditMode) {
    if (isEditMode) {
        formSubmitButton.textContent = 'Update Event';
    } else {
        formSubmitButton.textContent = 'Add Event';
    }
}

// ======================================================================
// 3. EVENT RENDERING FUNCTIONS
//    - Functions responsible for creating and updating event display.
// ======================================================================

/**
 * Creates an HTML card element for a single event.
 * @param {Object} event - The event object.
 * @returns {HTMLElement} The event card DOM element.
 */
function createEventCard(event) {
    const card = createElement('div', ['event-card']);
    card.setAttribute('data-event-id', event.id); // Store ID for easy lookup

    const image = createElement('img', ['event-card-image'], '', {
        src: event.imageUrl || 'https://via.placeholder.com/300x200?text=Event+Image',
        alt: event.title
    });

    const content = createElement('div', ['event-card-content']);
    const title = createElement('h3', ['event-card-title'], event.title);
    const date = createElement('p', ['event-card-date'], `Date: ${formatDate(event.date)} at ${formatTime(event.time)}`);
    const location = createElement('p', ['event-card-location'], `Location: ${event.location}`);
    const category = createElement('span', ['event-card-category'], event.category);

    const actions = createElement('div', ['event-card-actions']);
    const viewButton = createElement('button', ['btn', 'btn-primary'], 'View Details');
    viewButton.addEventListener('click', () => viewEventDetails(event.id));

    const editButton = createElement('button', ['btn', 'btn-secondary'], 'Edit');
    editButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click event from firing if any
        editEvent(event.id);
    });

    const deleteButton = createElement('button', ['btn', 'btn-danger'], 'Delete');
    deleteButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click event from firing if any
        confirmDeleteEvent(event.id, event.title);
    });

    actions.append(viewButton, editButton, deleteButton);
    content.append(title, date, location, category, actions);
    card.append(image, content);

    // Add a click listener to the card itself to view details (unless a button was clicked)
    // card.addEventListener('click', () => viewEventDetails(event.id));

    return card;
}

/**
 * Renders a list of events into the event list container, applying pagination.
 * @param {Object[]} eventsToRender - The array of event objects to display.
 */
function renderEvents(eventsToRender) {
    displayedEvents = eventsToRender; // Store the currently filtered/sorted events
    eventListContainer.innerHTML = ''; // Clear existing events

    if (displayedEvents.length === 0) {
        eventListContainer.appendChild(createElement('p', ['loading-message'], 'No events found matching your criteria.'));
        updatePaginationControls(0, 0);
        return;
    }

    const totalPages = Math.ceil(displayedEvents.length / EVENTS_PER_PAGE);
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages; // Adjust current page if events were removed
    } else if (currentPage === 0 && totalPages > 0) {
        currentPage = 1; // Reset to first page if no events initially
    } else if (totalPages === 0) {
        currentPage = 0; // No pages if no events
    }


    const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
    const endIndex = startIndex + EVENTS_PER_PAGE;
    const paginatedEvents = displayedEvents.slice(startIndex, endIndex);

    if (paginatedEvents.length === 0 && currentPage > 1) {
        // This case can happen if the last event on a page is deleted
        currentPage--;
        renderEvents(displayedEvents); // Recurse to render previous page
        return;
    }

    paginatedEvents.forEach(event => {
        eventListContainer.appendChild(createEventCard(event));
    });

    updatePaginationControls(currentPage, totalPages);
}

// ======================================================================
// 4. DATA FETCHING & MANAGEMENT
//    - Functions for interacting with an API or local storage.
// ======================================================================

/**
 * Fetches all events from the API or local data source.
 * @returns {Promise<Object[]>} A promise that resolves to an array of event objects.
 */
async function fetchEvents() {
    eventListContainer.innerHTML = '<p class="loading-message">Loading events...</p>';
    try {
        const response = await fetch(API_BASE_URL); // Fetch from local JSON for demo
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allEvents = await response.json();

        // Sort by date ascending by default
        allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Initial render, filter, and sort
        filterAndSortEvents();
        populateCategoryFilter(); // Populate filter options once events are loaded
        showNotification('Events loaded successfully!', 'success');
        return allEvents;
    } catch (error) {
        console.error('Error fetching events:', error);
        eventListContainer.innerHTML = '<p class="loading-message error-message">Failed to load events. Please check your connection or try again later.</p>';
        showNotification('Failed to load events. Please try again later.', 'error');
        return [];
    }
}

/**
 * Adds a new event to the system. In a real app, this would send to a backend.
 * For demo, it adds to the in-memory array and localStorage.
 * @param {Object} newEventData - The data for the new event.
 */
async function addEvent(newEventData) {
    try {
        // Simulate API POST request (assigning a simple unique ID)
        const addedEvent = { ...newEventData, id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
        allEvents.push(addedEvent);

        // Sort events again after adding to maintain order
        allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        filterAndSortEvents(); // Re-filter and re-render
        closeModal();
        showNotification('Event added successfully!', 'success');
    } catch (error) {
        console.error('Error adding event:', error);
        showNotification('Failed to add event. Please check your input.', 'error');
    }
}

/**
 * Updates an existing event. In a real app, this would send to a backend.
 * For demo, it updates the in-memory array.
 * @param {string} eventId - The ID of the event to update.
 * @param {Object} updatedEventData - The updated data for the event.
 */
async function updateEvent(eventId, updatedEventData) {
    try {
        const index = allEvents.findIndex(e => e.id === eventId);
        if (index !== -1) {
            allEvents[index] = { ...allEvents[index], ...updatedEventData };

            // Sort events again after updating to maintain order
            allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

            filterAndSortEvents(); // Re-filter and re-render
            closeModal();
            showNotification('Event updated successfully!', 'success');
        } else {
            throw new Error('Event not found for update.');
        }
    } catch (error) {
        console.error('Error updating event:', error);
        showNotification('Failed to update event. Please try again.', 'error');
    }
}

/**
 * Deletes an event from the system. In a real app, this would send to a backend.
 * For demo, it removes from the in-memory array.
 * @param {string} eventId - The ID of the event to delete.
 */
async function deleteEvent(eventId) {
    try {
        allEvents = allEvents.filter(event => event.id !== eventId);
        filterAndSortEvents(); // Re-filter and re-render
        closeDeleteConfirmModal();
        showNotification('Event deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting event:', error);
        showNotification('Failed to delete event. Please try again.', 'error');
    }
}

// ======================================================================
// 5. MODAL & FORM MANAGEMENT
//    - Functions to handle showing/hiding modals and populating forms.
// ======================================================================

/**
 * Opens the generic event modal with specific content.
 * @param {string} title - The title for the modal.
 * @param {HTMLElement | string} content - The content to display in the modal body.
 * @param {boolean} isForm - True if the content is the form, false for details.
 */
function openModal(title, content, isForm = false) {
    modalTitle.textContent = title;
    if (typeof content === 'string') {
        modalBody.innerHTML = content;
    } else {
        modalBody.innerHTML = ''; // Clear previous content
        modalBody.appendChild(content);
        // Ensure the form is visible if it's the content
        if (isForm) {
            eventForm.style.display = 'block';
        }
    }
    eventModal.style.display = 'block';
    // Add class after display property is set to allow transition
    requestAnimationFrame(() => {
        eventModal.classList.add('is-open');
    });
}

/**
 * Closes the generic event modal.
 */
function closeModal() {
    eventModal.classList.remove('is-open');
    // Use setTimeout to allow for CSS transition to complete before setting display to 'none'
    setTimeout(() => {
        eventModal.style.display = 'none';
        // Reset form fields and clear errors
        eventForm.reset();
        eventForm.style.display = 'none'; // Hide the form again
        clearErrorMessages();
        modalBody.innerHTML = ''; // Clear content to prevent lingering form
    }, 300); // Must match CSS transition duration
}

/**
 * Displays detailed information about an event in the modal.
 * @param {string} eventId - The ID of the event to display.
 */
function viewEventDetails(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) {
        showNotification('Event not found.', 'error');
        return;
    }

    const detailsContent = createElement('div', ['event-details-content']);
    detailsContent.innerHTML = `
        <img src="${event.imageUrl || 'https://via.placeholder.com/400x300?text=Event+Details'}" alt="${event.title}" class="event-details-image">
        <p><strong>Category:</strong> <span class="badge">${event.category}</span></p>
        <p><strong>Date:</strong> ${formatDate(event.date)}</p>
        <p><strong>Time:</strong> ${formatTime(event.time)}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Price:</strong> ${event.price > 0 ? `$${event.price.toFixed(2)}` : 'Free'}</p>
        <p><strong>Capacity:</strong> ${event.capacity} attendees</p>
        <h4>Description:</h4>
        <p>${event.description || 'No description available.'}</p>
        `;
    openModal(event.title, detailsContent);
}

/**
 * Opens the event form modal for adding a new event.
 */
function openAddEventForm() {
    eventForm.reset(); // Clear any previous data
    eventIdInput.value = ''; // Ensure ID is empty for new event
    clearErrorMessages(); // Clear any previous error messages
    updateFormSubmitButton(false); // Set button text to "Add Event"
    openModal('Add New Event', eventForm, true); // Pass the actual form element and indicate it's a form
}

/**
 * Populates the form with existing event data for editing.
 * @param {string} eventId - The ID of the event to edit.
 */
function editEvent(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) {
        showNotification('Event not found for editing.', 'error');
        return;
    }

    // Populate form fields
    eventIdInput.value = event.id; // Set hidden ID for update operation
    eventTitleInput.value = event.title;
    eventDateInput.value = event.date;
    eventTimeInput.value = event.time;
    eventLocationInput.value = event.location;
    eventDescriptionInput.value = event.description;
    eventCategoryInput.value = event.category;
    eventImageUrlInput.value = event.imageUrl || '';
    eventPriceInput.value = event.price;
    eventCapacityInput.value = event.capacity;

    clearErrorMessages(); // Clear any previous error messages
    updateFormSubmitButton(true); // Set button text to "Update Event"
    openModal('Edit Event', eventForm, true);
}

/**
 * Opens the delete confirmation modal.
 * @param {string} eventId - The ID of the event to be deleted.
 * @param {string} eventTitle - The title of the event to be deleted.
 */
function confirmDeleteEvent(eventId, eventTitle) {
    deleteConfirmModal.setAttribute('data-event-id', eventId);
    document.getElementById('delete-event-title').textContent = eventTitle;
    deleteConfirmModal.style.display = 'block';
    requestAnimationFrame(() => {
        deleteConfirmModal.classList.add('is-open');
    });
}

/**
 * Closes the delete confirmation modal.
 */
function closeDeleteConfirmModal() {
    deleteConfirmModal.classList.remove('is-open');
    setTimeout(() => {
        deleteConfirmModal.style.display = 'none';
        deleteConfirmModal.removeAttribute('data-event-id');
        document.getElementById('delete-event-title').textContent = ''; // Clear title
    }, 300); // Must match CSS transition duration
}


// ======================================================================
// 6. FORM VALIDATION
//    - Client-side validation for event creation/editing.
// ======================================================================

/**
 * Validates a single form input field and displays/clears error messages.
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} inputElement - The DOM element to validate.
 * @param {string} errorMessageElementId - The ID of the element to display the error message.
 * @param {function} validationFn - A function that returns true if valid, false otherwise.
 * @param {string} message - The error message to display if invalid.
 * @returns {boolean} True if the input is valid, false otherwise.
 */
function validateInput(inputElement, errorMessageElementId, validationFn, message) {
    const errorElement = document.getElementById(errorMessageElementId);
    if (!validationFn(inputElement.value)) {
        errorElement.textContent = message;
        inputElement.classList.add('is-invalid'); // Add visual cue for invalid input
        return false;
    } else {
        errorElement.textContent = '';
        inputElement.classList.remove('is-invalid');
        return true;
    }
}

/**
 * Validates the event form inputs.
 * @param {Object} formData - An object containing form field values.
 * @returns {boolean} True if the entire form is valid, false otherwise.
 */
function validateEventForm(formData) {
    let formIsValid = true;

    // Validate Title
    formIsValid = validateInput(eventTitleInput, 'error-title', (val) => val.trim().length >= 5 && val.trim().length <= 100, 'Title must be 5-100 characters.') && formIsValid;

    // Validate Date
    formIsValid = validateInput(eventDateInput, 'error-date', (val) => {
        if (!val) return false;
        const eventDate = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today to start of day
        return eventDate >= today;
    }, 'Event date is required and cannot be in the past.') && formIsValid;

    // Validate Time
    formIsValid = validateInput(eventTimeInput, 'error-time', (val) => !!val, 'Event time is required.') && formIsValid;

    // Validate Location
    formIsValid = validateInput(eventLocationInput, 'error-location', (val) => val.trim().length > 0 && val.trim().length <= 200, 'Location is required (max 200 chars).') && formIsValid;

    // Validate Description
    formIsValid = validateInput(eventDescriptionInput, 'error-description', (val) => val.trim().length >= 20, 'Description is required (min 20 chars).') && formIsValid;

    // Validate Category
    formIsValid = validateInput(eventCategoryInput, 'error-category', (val) => !!val, 'Category is required.') && formIsValid;

    // Validate Image URL (optional, but if present, must be valid URL)
    formIsValid = validateInput(eventImageUrlInput, 'error-image-url', (val) => {
        if (!val) return true; // Optional, so empty is fine
        try {
            new URL(val); // Check if it's a valid URL format
            return /\.(jpg|jpeg|png|gif|svg)$/i.test(val); // Check for common image extensions
        } catch (e) {
            return false;
        }
    }, 'Please enter a valid image URL (jpg, png, gif, svg).') && formIsValid;

    // Validate Price
    formIsValid = validateInput(eventPriceInput, 'error-price', (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, 'Price must be a non-negative number.') && formIsValid;

    // Validate Capacity
    formIsValid = validateInput(eventCapacityInput, 'error-capacity', (val) => Number.isInteger(parseInt(val, 10)) && parseInt(val, 10) >= 1, 'Capacity must be a positive whole number.') && formIsValid;

    return formIsValid;
}

// ======================================================================
// 7. EVENT LISTENER REGISTRATIONS
//    - All event listeners for user interactions.
// ======================================================================

// Listen for DOM content to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchEvents(); // Initial load of events

    // Add Event buttons
    addEventButtonNav.addEventListener('click', openAddEventForm);
    addEventButtonHero.addEventListener('click', openAddEventForm);
    addEventButtonCTA.addEventListener('click', openAddEventForm);

    // Event listener for closing the main modal
    closeModalButton.addEventListener('click', closeModal);
    eventModal.addEventListener('click', (e) => {
        if (e.target === eventModal) {
            closeModal(); // Close if clicking outside the modal content
        }
    });

    // Event listener for the event form submission (add/edit)
    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        const formData = {
            id: eventIdInput.value || null, // Will be null for new events
            title: eventTitleInput.value.trim(),
            date: eventDateInput.value,
            time: eventTimeInput.value,
            location: eventLocationInput.value.trim(),
            description: eventDescriptionInput.value.trim(),
            category: eventCategoryInput.value.trim(),
            imageUrl: eventImageUrlInput.value.trim(),
            price: parseFloat(eventPriceInput.value) || 0,
            capacity: parseInt(eventCapacityInput.value, 10) || 0,
            // Add other fields as needed
        };

        const formIsValid = validateEventForm(formData); // Run full validation

        if (formIsValid) {
            if (formData.id) {
                await updateEvent(formData.id, formData);
            } else {
                await addEvent(formData);
            }
        } else {
            showNotification('Please correct the errors in the form.', 'error');
            // Errors are already displayed by validateEventForm
        }
    });

    // Event listener for filter by category and search input (debounced for performance)
    filterCategorySelect.addEventListener('change', () => {
        currentPage = 1; // Reset to first page on filter change
        filterAndSortEvents();
    });

    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentPage = 1; // Reset to first page on search change
            filterAndSortEvents();
        }, 300); // Wait 300ms after last input
    });

    // Event listener for sorting
    sortBySelect.addEventListener('change', () => {
        currentPage = 1; // Reset to first page on sort change
        filterAndSortEvents();
    });

    // Event listeners for delete confirmation modal
    confirmDeleteBtn.addEventListener('click', async () => {
        const eventIdToDelete = deleteConfirmModal.getAttribute('data-event-id');
        if (eventIdToDelete) {
            await deleteEvent(eventIdToDelete);
        }
    });
    cancelDeleteBtn.addEventListener('click', closeDeleteConfirmModal);
    closeDeleteModalButton.addEventListener('click', closeDeleteConfirmModal);
    deleteConfirmModal.addEventListener('click', (e) => {
        if (e.target === deleteConfirmModal) {
            closeDeleteConfirmModal();
        }
    });

    // Pagination button listeners
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderEvents(displayedEvents);
            window.scrollTo({ top: document.getElementById('events-section').offsetTop, behavior: 'smooth' });
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(displayedEvents.length / EVENTS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            renderEvents(displayedEvents);
            window.scrollTo({ top: document.getElementById('events-section').offsetTop, behavior: 'smooth' });
        }
    });

    // Keyboard accessibility for modals (e.g., Escape key)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (eventModal.classList.contains('is-open')) {
                closeModal();
            }
            if (deleteConfirmModal.classList.contains('is-open')) {
                closeDeleteConfirmModal();
            }
        }
    });

    // Hamburger menu toggle for mobile
    hamburgerMenu.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        mainNav.querySelector('.nav-list').classList.toggle('is-open');
    });

    // Close mobile nav when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mainNav.classList.contains('active')) {
                mainNav.classList.remove('active');
                mainNav.querySelector('.nav-list').classList.remove('is-open');
            }
        });
    });

    // Contact Form Submission (dummy for frontend demo)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // In a real application, you would send this data to a backend server.
            console.log('Contact form submitted:', {
                name: document.getElementById('contact-name').value,
                email: document.getElementById('contact-email').value,
                subject: document.getElementById('contact-subject').value,
                message: document.getElementById('contact-message').value
            });
            showNotification('Thank you for your message! We will get back to you soon.', 'success');
            contactForm.reset();
        });
    }

    // Newsletter Form Submission (dummy for frontend demo)
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Newsletter subscription:', document.querySelector('.newsletter-form input[type="email"]').value);
            showNotification('Thank you for subscribing to our newsletter!', 'success');
            newsletterForm.reset();
        });
    }

});

// ======================================================================
// 8. FILTERING, SEARCHING & SORTING LOGIC
//    - Functions to apply filters and search queries to event data.
// ======================================================================

/**
 * Filters and sorts events based on current criteria and then renders them.
 */
function filterAndSortEvents() {
    const selectedCategory = filterCategorySelect.value;
    const searchTerm = searchInput.value.toLowerCase().trim();
    const sortBy = sortBySelect.value;

    let filtered = [...allEvents]; // Start with a copy of all events

    // Apply category filter
    if (selectedCategory !== 'all') {
        filtered = filtered.filter(event => event.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Apply search term filter
    if (searchTerm) {
        filtered = filtered.filter(event =>
            event.title.toLowerCase().includes(searchTerm) ||
            (event.description && event.description.toLowerCase().includes(searchTerm)) || // Description might be optional
            event.location.toLowerCase().includes(searchTerm) ||
            event.category.toLowerCase().includes(searchTerm)
        );
    }

    // Apply sorting
    switch (sortBy) {
        case 'date-asc':
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'date-desc':
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'price-asc':
            filtered.sort((a, b) => (a.price || 0) - (b.price || 0)); // Handle potential undefined price
            break;
        case 'price-desc':
            filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        // Add more sorting options as needed (e.g., by title, capacity)
    }

    renderEvents(filtered); // Render the filtered and sorted events
}

/**
 * Populates the category filter dropdown based on unique categories from loaded events.
 */
function populateCategoryFilter() {
    const categories = new Set();
    allEvents.forEach(event => {
        if (event.category) {
            // Capitalize first letter for display, but store lowercase for filtering
            categories.add(event.category.charAt(0).toUpperCase() + event.category.slice(1).toLowerCase());
        }
    });

    // Clear existing options, keep 'All'
    filterCategorySelect.innerHTML = '<option value="all">All Categories</option>';
    // Add unique categories, sorted alphabetically
    Array.from(categories).sort().forEach(category => {
        const option = createElement('option', [], category);
        option.value = category.toLowerCase();
        filterCategorySelect.appendChild(option);
    });
}

// ======================================================================
// 9. PAGINATION LOGIC
//    - Functions to control and update pagination.
// ======================================================================

/**
 * Updates the state of pagination buttons and info text.
 * @param {number} current - The current page number.
 * @param {number} total - The total number of pages.
 */
function updatePaginationControls(current, total) {
    pageInfoSpan.textContent = `Page ${current} of ${total}`;

    if (current <= 1) {
        prevPageBtn.disabled = true;
    } else {
        prevPageBtn.disabled = false;
    }

    if (current >= total) {
        nextPageBtn.disabled = true;
    } else {
        nextPageBtn.disabled = false;
    }

    if (total === 0 || total === 1) {
        prevPageBtn.style.display = 'none';
        nextPageBtn.style.display = 'none';
        pageInfoSpan.style.display = 'none';
    } else {
        prevPageBtn.style.display = 'inline-flex';
        nextPageBtn.style.display = 'inline-flex';
        pageInfoSpan.style.display = 'inline';
    }
}