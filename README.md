# Distance to Kaaba PWA

A Progressive Web Application (PWA) that calculates your distance from the Kaaba in Mecca. This application provides users with their real-time distance from Islam's holiest site.

## Features

- Calculate real-time distance to Kaaba
- Works offline (PWA functionality)
- Responsive design
- HTTPS support with SSL certificates
- Docker support for easy deployment

## Prerequisites

- Node.js (Latest LTS version recommended)
- Docker and Docker Compose (optional, for containerized deployment)
- SSL certificates (for HTTPS)

## Installation

### Standard Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd kaaba-distance-pwa
```

2. Install dependencies and generate SSL certificates:
```bash
npm run setup
```

3. Start the application:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### Docker Setup

1. Build the Docker image:
```bash
npm run docker:build
```

2. Start the container:
```bash
npm run docker:start
```

Or run in detached mode:
```bash
npm run docker:start:detach
```

3. To stop the container:
```bash
npm run docker:stop
```

## Available Scripts

- `npm start` - Start the application
- `npm run dev` - Start with nodemon for development
- `npm run setup` - Generate SSL certificates and install dependencies
- `npm run docker:build` - Build Docker image
- `npm run docker:start` - Start Docker container
- `npm run docker:start:detach` - Start Docker container in detached mode
- `npm run docker:stop` - Stop Docker container
- `npm run docker:logs` - View Docker logs
- `npm run docker:clean` - Clean up Docker resources

## Technical Stack

- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js with Express
- PWA Features: Service Workers, Manifest
- Containerization: Docker
- SSL: Self-signed certificates for development

## Security

The application uses HTTPS with SSL certificates. This is crucial for accessing the device's geolocation features, as modern browsers (especially Safari on iOS devices) require a secure HTTPS connection to request location permissions. For development, self-signed certificates are provided to enable this functionality locally. For production deployment, replace the self-signed certificates with proper SSL certificates from a trusted Certificate Authority.

