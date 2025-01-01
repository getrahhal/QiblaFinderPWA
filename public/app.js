// Constants
const KAABA_COORDINATES = {
    latitude: 21.4225,
    longitude: 39.8262
};

class QiblaFinder {
    constructor() {
        this.startButton = document.getElementById('startButton');
        this.status = document.getElementById('status');
        this.compassFace = document.querySelector('.compass-face');
        this.coordinatesText = document.getElementById('coordinates-text');
        this.distanceElement = document.getElementById('distance');
        this.coordinatesContainer = document.getElementById('coordinates-container');
        this.statusDot = document.querySelector('.status-dot');
        this.statusText = document.querySelector('.status-text');
        
        this.currentCoordinates = null;
        this.qiblaDirection = null;
        this.watchId = null;
        this.deviceOrientation = false;

        // Hide button by default
        this.startButton.style.display = 'none';
        
        // Setup connection monitoring
        this.setupConnectionMonitoring();
        this.init();
    }

    setupConnectionMonitoring() {
        // Initial connection check
        this.updateConnectionStatus();

        // Listen for online/offline events
        window.addEventListener('online', () => this.updateConnectionStatus());
        window.addEventListener('offline', () => this.updateConnectionStatus());
    }

    updateConnectionStatus() {
        const isOnline = navigator.onLine;
        this.statusDot.classList.toggle('offline', !isOnline);
        this.statusText.textContent = isOnline ? 'Connected' : 'Offline';
        
        if (!isOnline) {
            this.updateStatus('No internet connection. Some features may be limited.');
            this.status.style.display = 'block';
        } else {
            this.status.style.display = 'none';
        }
    }

    async init() {
        // Setup event listeners
        this.coordinatesContainer.addEventListener('click', () => this.copyCoordinates());

        try {
            // For iOS 13+ devices
            if (typeof DeviceOrientationEvent !== 'undefined' && 
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                
                const orientationPermission = await DeviceOrientationEvent.requestPermission().catch(() => 'denied');
                if (orientationPermission === 'granted') {
                    this.deviceOrientation = true;
                    await this.initializeCompass();
                } else {
                    this.showStartButton();
                }
            } else {
                // For non-iOS devices
                this.deviceOrientation = true;
                await this.initializeCompass();
            }
        } catch (error) {
            console.error('Error during initialization:', error);
            this.showStartButton();
        }
    }

    async initializeCompass() {
        try {
            // Check if we already have location permission
            const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
            
            if (permissionStatus.state === 'granted') {
                // We already have permission, start the compass
                this.startCompass();
            } else if (permissionStatus.state === 'prompt') {
                // We need to request permission
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    });
                });
                
                // If we got here, we have both permissions
                this.startCompass();
            } else {
                // Permission was denied
                console.error('Location permission denied');
                this.showStartButton();
            }
        } catch (error) {
            console.error('Error getting location:', error);
            this.showStartButton();
        }
    }

    showStartButton() {
        this.startButton.style.display = 'block';
        this.startButton.addEventListener('click', async () => {
            try {
                // Request permissions again when button is clicked
                if (typeof DeviceOrientationEvent !== 'undefined' && 
                    typeof DeviceOrientationEvent.requestPermission === 'function') {
                    const permission = await DeviceOrientationEvent.requestPermission();
                    if (permission === 'granted') {
                        this.deviceOrientation = true;
                    } else {
                        throw new Error('Orientation permission denied');
                    }
                }

                await this.initializeCompass();
                this.startButton.style.display = 'none';
            } catch (error) {
                console.error('Error starting compass:', error);
                this.updateStatus('Please enable required permissions in your settings');
            }
        });
    }

    startCompass() {
        if (!this.deviceOrientation) {
            this.updateStatus('Device orientation not supported');
            return;
        }

        this.updateStatus('Getting your location...');

        // Get user's location
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => this.handleLocationSuccess(position),
                (error) => this.handleLocationError(error),
                { enableHighAccuracy: true }
            );

            // Start listening to device orientation
            window.addEventListener('deviceorientationabsolute', (e) => this.handleOrientation(e), true);
            window.addEventListener('deviceorientation', (e) => this.handleOrientation(e), true);
        } else {
            this.updateStatus('Geolocation is not supported by your browser');
        }
    }

    handleLocationSuccess(position) {
        this.currentCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };

        // Calculate Qibla direction
        this.qiblaDirection = this.calculateQiblaDirection(
            this.currentCoordinates.latitude,
            this.currentCoordinates.longitude
        );

        // Calculate distance
        const distance = this.calculateDistance(
            this.currentCoordinates.latitude,
            this.currentCoordinates.longitude,
            KAABA_COORDINATES.latitude,
            KAABA_COORDINATES.longitude
        );

        // Update UI
        this.startButton.style.display = 'none'; // Hide the button completely
        this.status.style.display = 'none'; // Hide the status message completely
        this.updateCoordinates();
        this.updateDistance(distance);
    }

    handleLocationError(error) {
        let message = 'Error getting your location: ';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message += 'Please enable location permissions';
                break;
            case error.POSITION_UNAVAILABLE:
                message += 'Location information unavailable';
                break;
            case error.TIMEOUT:
                message += 'Location request timed out';
                break;
            default:
                message += 'An unknown error occurred';
        }
        this.updateStatus(message);
        this.startButton.textContent = 'Start Compass';
    }

    handleOrientation(event) {
        if (!this.qiblaDirection) return;

        let compass;
        if (event.webkitCompassHeading) {
            // iOS devices
            compass = event.webkitCompassHeading;
        } else if (event.alpha) {
            // Android devices
            compass = event.alpha;
            if (window.screen.orientation) {
                // Adjust for screen orientation
                const screenOrientation = window.screen.orientation.angle || 0;
                compass = (compass + screenOrientation) % 360;
            }
        } else {
            this.updateStatus('Compass not supported by your device');
            return;
        }

        // Calculate the rotation needed
        const rotation = (360 - compass + this.qiblaDirection) % 360;
        
        // Apply smooth rotation to compass face
        this.compassFace.style.transform = `rotate(${rotation}deg)`;
    }

    calculateQiblaDirection(latitude, longitude) {
        // Convert to radians
        const lat1 = this.toRadians(latitude);
        const lon1 = this.toRadians(longitude);
        const lat2 = this.toRadians(KAABA_COORDINATES.latitude);
        const lon2 = this.toRadians(KAABA_COORDINATES.longitude);

        // Calculate Qibla direction
        const y = Math.sin(lon2 - lon1);
        const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(lon2 - lon1);
        let qibla = this.toDegrees(Math.atan2(y, x));

        // Normalize to 0-360
        return (qibla + 360) % 360;
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return Math.round(distance);
    }

    updateStatus(message) {
        this.status.textContent = message;
    }

    updateCoordinates() {
        if (this.currentCoordinates) {
            this.coordinatesText.textContent = 
                `${this.currentCoordinates.latitude.toFixed(4)}°, ${this.currentCoordinates.longitude.toFixed(4)}°`;
        }
    }

    updateDistance(distance) {
        this.distanceElement.textContent = `${distance} km to Kaaba`;
    }

    async copyCoordinates() {
        if (this.currentCoordinates) {
            const text = `${this.currentCoordinates.latitude.toFixed(4)}°, ${this.currentCoordinates.longitude.toFixed(4)}°`;
            try {
                await navigator.clipboard.writeText(text);
                const originalText = this.coordinatesText.textContent;
                this.coordinatesText.textContent = 'Copied!';
                setTimeout(() => {
                    this.coordinatesText.textContent = originalText;
                }, 1500);
            } catch (err) {
                console.error('Failed to copy coordinates:', err);
            }
        }
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    toDegrees(radians) {
        return radians * (180 / Math.PI);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.qiblaFinder = new QiblaFinder();
});
