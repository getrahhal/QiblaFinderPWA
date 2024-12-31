const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// SSL/TLS certificates
const options = {
    key: fs.readFileSync('certificates/key.pem'),
    cert: fs.readFileSync('certificates/cert.pem')
};

// Create HTTPS server
const port = process.env.PORT || 3000;
https.createServer(options, app).listen(port, () => {
    console.log(`
    🚀 Server running at:
    https://localhost:${port}
    
    Note: Accept the self-signed certificate warning in your browser
    `);
}); 