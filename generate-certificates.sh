#!/bin/bash

# Create certificates directory if it doesn't exist
mkdir -p certificates

# Generate SSL certificates
openssl req -x509 \
    -newkey rsa:4096 \
    -keyout certificates/key.pem \
    -out certificates/cert.pem \
    -days 365 \
    -nodes \
    -sha256 \
    -subj "/CN=localhost" \
    -extensions EXT \
    -config <( \
        echo "[dn]"; \
        echo "[req]"; \
        echo "distinguished_name = dn"; \
        echo "[EXT]"; \
        echo "subjectAltName = DNS:localhost"; \
        echo "keyUsage = digitalSignature"; \
        echo "extendedKeyUsage = serverAuth")

echo "✅ SSL certificates generated successfully!"
echo "
🚀 To start the server:
1. Run: npm install
2. Run: npm start
3. Open: https://localhost:3000
" 