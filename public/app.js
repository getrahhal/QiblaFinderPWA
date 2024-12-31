// Kaaba coordinates
const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

// DOM elements
const distanceElement = document.getElementById('distance');
const statusElement = document.getElementById('status');
const compassElement = document.querySelector('.compass');
const arrowContainer = document.querySelector('.arrow-container');
const startButton = document.getElementById('startButton');

// Global variables for device orientation
let deviceHeading = 0;
let targetBearing = 0;

// Request device orientation permission separately
async function requestOrientationPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting orientation permission:', error);
            return false;
        }
    }
    return true; // Non-iOS devices don't need explicit permission
}

// Request location permission
function requestLocationPermission() {
    return new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                () => resolve(true),
                () => resolve(false),
                { enableHighAccuracy: true }
            );
        } else {
            resolve(false);
        }
    });
}

// Start tracking location
function startLocationTracking() {
    if ("geolocation" in navigator) {
        const statusElement = document.getElementById('status');
        const coordsContainer = document.getElementById('coordinates-container');
        
        // Show status and hide coordinates while getting location
        statusElement.textContent = "Getting your location...";
        statusElement.classList.remove('hidden');
        coordsContainer.classList.remove('visible');
        
        navigator.geolocation.watchPosition(updateUI, handleError, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        });
    } else {
        handleError({ code: 0, message: "Geolocation not supported" });
    }
}

// Handle errors
function handleError(error) {
    startButton.disabled = false;
    let message;
    switch(error.code) {
        case 1:
            message = 'Location access denied. Please enable it in your settings.';
            break;
        case 2:
            message = 'Location unavailable. Please try again.';
            break;
        case 3:
            message = 'Location request timed out. Please try again.';
            break;
        default:
            message = 'Location error occurred. Please try again.';
    }
    statusElement.textContent = message;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Convert degrees to radians
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Calculate bearing between two points
function calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = toRad(lon2 - lon1);
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    let bearing = Math.atan2(y, x);
    bearing = toDeg(bearing);
    return (bearing + 360) % 360;
}

// Convert radians to degrees
function toDeg(rad) {
    return rad * (180 / Math.PI);
}

// Handle device orientation
function handleOrientation(event) {
    let heading;
    
    if (event.webkitCompassHeading) {
        // iOS devices
        heading = event.webkitCompassHeading;
    } else if (event.alpha) {
        // Android devices
        heading = 360 - event.alpha;
    } else {
        console.warn('Device orientation not supported');
        return;
    }

    deviceHeading = heading;
    requestAnimationFrame(updateCompass);
}

// Update compass rotation
function updateCompass() {
    // Calculate arrow rotation to point to Kaaba
    let arrowRotation = targetBearing - deviceHeading;
    
    // Normalize arrow rotation to -180 to 180 degrees
    while (arrowRotation > 180) arrowRotation -= 360;
    while (arrowRotation < -180) arrowRotation += 360;
    
    // Apply the rotation to the arrow container with the Kaaba icon
    arrowContainer.style.transform = `rotate(${arrowRotation}deg)`;
}

// Update the UI with distance and direction
function updateUI(position) {
    const { latitude, longitude } = position.coords;
    const distance = calculateDistance(latitude, longitude, KAABA_LAT, KAABA_LNG);
    targetBearing = calculateBearing(latitude, longitude, KAABA_LAT, KAABA_LNG);
    
    distanceElement.textContent = `${distance.toFixed(2)} km`;
    
    // Format coordinates for display and copying
    const coordsText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    const coordsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    
    // Update coordinates and show container
    const coordsContainer = document.getElementById('coordinates-container');
    const statusElement = document.getElementById('status');
    
    document.getElementById('coordinates-text').textContent = coordsText;
    coordsContainer.dataset.url = coordsUrl;
    
    // Hide status and show coordinates
    statusElement.classList.add('hidden');
    coordsContainer.classList.add('visible');
    
    updateCompass();
}

// Handle coordinates copying
document.getElementById('coordinates-container').addEventListener('click', async function() {
    const url = this.dataset.url;
    if (!url) return;
    
    try {
        await navigator.clipboard.writeText(url);
        const feedback = document.getElementById('copy-feedback');
        feedback.classList.add('visible');
        setTimeout(() => feedback.classList.remove('visible'), 2000);
    } catch (err) {
        console.error('Failed to copy coordinates:', err);
    }
});

// Add keyboard support for accessibility
document.getElementById('coordinates-container').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
    }
});

// Check if we already have permissions
async function checkPermissions() {
    let hasOrientation = false;
    let hasLocation = false;

    // Check orientation permission
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS requires explicit permission check
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            hasOrientation = permission === 'granted';
        } catch (error) {
            hasOrientation = false;
        }
    } else {
        // Non-iOS devices don't need explicit permission
        hasOrientation = true;
    }

    // Check location permission
    if ("permissions" in navigator) {
        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            hasLocation = permission.state === 'granted';
        } catch (error) {
            hasLocation = false;
        }
    }

    return { hasOrientation, hasLocation };
}

// Initialize app
async function initializeApp() {
    const { hasOrientation, hasLocation } = await checkPermissions();

    if (hasOrientation && hasLocation) {
        // If we already have both permissions, start automatically
        startButton.style.display = 'none';
        window.addEventListener('deviceorientation', handleOrientation, true);
        startLocationTracking();
    } else {
        // Show button if we need permissions
        startButton.disabled = false;
        startButton.style.display = 'block';
        statusElement.textContent = 'Tap the button below to start';
    }
}

// Modify startApp function
async function startApp() {
    startButton.disabled = true;
    startButton.textContent = 'Starting...';
    
    try {
        const hasOrientation = await requestOrientationPermission();
        if (!hasOrientation) {
            throw new Error('Orientation permission denied');
        }

        const hasLocation = await requestLocationPermission();
        if (!hasLocation) {
            throw new Error('Location permission denied');
        }

        // If we got here, both permissions were granted
        window.addEventListener('deviceorientation', handleOrientation, true);
        startLocationTracking();
        
        // Hide the button
        startButton.style.display = 'none';
    } catch (error) {
        console.error('Error starting app:', error);
        statusElement.textContent = 'Please enable both location and orientation access in your settings';
        startButton.disabled = false;
        startButton.textContent = 'Try Again';
    }
}

// Modify the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Keep the click handler for the button
startButton.addEventListener('click', startApp);
