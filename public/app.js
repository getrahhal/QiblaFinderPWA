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
        statusElement.textContent = "Getting your location...";
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
    statusElement.textContent = `Your coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    
    updateCompass();
}

// Initialize app when start button is clicked
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
        
        // Hide the button since we don't need it anymore
        startButton.style.display = 'none';
    } catch (error) {
        console.error('Error starting app:', error);
        statusElement.textContent = 'Please enable both location and orientation access in your settings';
        startButton.disabled = false;
        startButton.textContent = 'Try Again';
    }
}

// Add click handler to start button
startButton.addEventListener('click', startApp);

// Initialize button state
document.addEventListener('DOMContentLoaded', () => {
    startButton.disabled = false;
});
