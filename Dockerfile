FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install OpenSSL for certificate generation
RUN apk add --no-cache openssl bash

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Generate SSL certificates
RUN chmod +x generate-certificates.sh && ./generate-certificates.sh

# Expose HTTPS port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 