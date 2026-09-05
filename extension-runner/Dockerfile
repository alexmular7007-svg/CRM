# Production Dockerfile for Extension Runner Service
FROM mcr.microsoft.com/playwright:v1.47.0-jammy

WORKDIR /app/extension-runner

# Copy package definition and install production dependencies
COPY extension-runner/package*.json ./
RUN npm ci || npm install

# Copy extension-runner application source code
COPY extension-runner/ ./

# Copy chrome-extension into the container image for standalone execution
COPY chrome-extension/ /app/chrome-extension/

# Environment defaults
ENV PORT=9090 \
    HOST=0.0.0.0 \
    HEADLESS=true \
    EXTENSION_PATH=/app/chrome-extension \
    ARTIFACTS_DIR=/app/extension-runner/artifacts

EXPOSE 9090

# Production start command
CMD ["node", "src/server.js"]
