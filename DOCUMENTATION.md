# Object Detection Application - Technical Documentation

## Overview
The Object Detection App is a real-time object detection web application built with Fastify (Node.js) that processes images and videos using machine learning models. It supports both RESTful API endpoints and WebSocket connections for real-time streaming, with optional Kafka integration for distributed video processing.

## Architecture

### Technology Stack
- **Backend Framework**: Fastify v5.6.1
- **WebSocket Support**: @fastify/websocket v11.2.0
- **Message Streaming**: KafkaJS v1.15.0 (optional)
- **Frontend**: React (built with Sass)
- **Cloud Storage**: AWS SDK v2 (S3 integration)
- **HTTP Client**: Axios v1.13.1

### Application Structure
```
object-detection-app/
├── app.js                 # Main application configuration
├── server.js              # Server entry point
├── routes/                # API route handlers
│   ├── root.js           # Root route
│   └── api/              # API endpoints
│       ├── images/       # Image processing endpoints
│       ├── videos/       # Video processing endpoints
│       └── status/       # Health check endpoints
├── socket/               # WebSocket handlers
│   ├── init.js          # Socket initialization
│   ├── process-socket-message.js  # Message router
│   ├── message-types.js # Message type definitions
│   └── handlers/        # Message handlers
│       ├── ping.js      # Ping handler
│       ├── image.js     # Image processing
│       └── video.js     # Video processing
├── kafka/               # Kafka integration
│   ├── config.js       # Kafka configuration
│   ├── init.js         # Kafka initialization
│   └── process-message.js  # Kafka message handler
├── utils/              # Utility functions
│   ├── constants.js   # Application constants
│   ├── axios.js       # Axios client configuration
│   └── appStatus.js   # Application status tracking
├── storage/           # Storage handlers (likely S3)
├── frontend/          # React frontend application
└── plugins/           # Fastify plugins
    └── kafka.js      # Kafka plugin

```

## Core Features

### 1. Real-Time WebSocket Communication
- **Endpoint**: `/socket` (WebSocket)
- **Max Payload**: 20GB
- **Supported Messages**: 
  - Ping/Pong for connection health
  - Image processing requests
  - Video streaming

### 2. REST API Endpoints
- `/api/images` - Image upload and processing
- `/api/videos` - Video upload and processing  
- `/api/status` - Application health check
- `/` - Serves static React frontend

### 3. Kafka Integration (Optional)
- **Topics**:
  - `images` - Image processing queue
  - `objects` - Detected objects stream
- **Configuration**: Supports PLAINTEXT and SASL authentication
- Used for video streaming at scale

### 4. Object Detection Integration
- External ML service integration via HTTP
- Configurable endpoint: `OBJECT_DETECTION_URL`
- Default: `http://localhost:5000/predictions`

## Environment Configuration

### Required Variables
```bash
# Object Detection Service
OBJECT_DETECTION_URL=http://<service-name>:<service-port>/predictions

# Kafka (Optional)
KAFKA_BOOTSTRAP_SERVER=localhost:9092
KAFKA_SECURITY_PROTOCOL=PLAINTEXT
KAFKA_SASL_MECHANISM=
KAFKA_USERNAME=
KAFKA_PASSWORD=
KAFKA_TOPIC_IMAGES=images
KAFKA_TOPIC_OBJECTS=objects

# Development
FRONTEND_DEV_PORT=3000
BACKEND_DEV_PORT=8080

# Container Registry
CONTAINER_BUILDER=docker
IMAGE_REPOSITORY=quay.io/apelline/object-detection-app:latest
SOURCE_REPOSITORY_URL=git@github.com:apelline/object-detection-app.git
SOURCE_REPOSITORY_REF=master
```

## Deployment

### Prerequisites
- Node.js 18+ (UBI8 base image)
- Object detection service running
- (Optional) Kafka cluster

### Installation
```bash
# Install backend dependencies
npm install

# Build frontend
npm run build

# Start production server
npm start
```

### Development Mode
```bash
# Start backend and frontend concurrently
npm run dev-all

# Backend only (with auto-reload)
npm run dev

# Frontend only
cd frontend && npm run dev
```

### Container Deployment
The application is designed to run on Red Hat UBI8 with Node.js 18:
- Base Image: `registry.redhat.io/ubi8/nodejs-18`
- Container Registry: Quay.io
- Image: `quay.io/apelline/object-detection-app:latest`

## Git Repository Information

### Repository Details
- **URL**: https://github.com/apelline1/object-detection-app
- **Owner**: apelline1
- **License**: GPLv3

### Recent Development History
1. **Video Capabilities** (c9624c2, 7697712, 54f7183)
   - Added video processing via Cursor AI
   - Updated prediction URL formatting
   
2. **Container Configuration** (074c045, 23a6002, fbb201b)
   - Changed to Red Hat UBI8 Node.js 18 base image
   - Updated image repository to apelline namespace
   
3. **Stability Improvements** (443d57e)
   - Added error handler for HTTP 500 errors
   - Prevents pod crashes
   
4. **WebSocket Enhancements** (9f82c2c, 7eff90c, c56619b)
   - New WebSocket test suite
   - Implemented message processing
   - Added error handling for WebSocket connections

5. **Fastify Upgrades** (ff02637, 065d4c5)
   - Updated to Fastify v5+
   - Updated @fastify/websocket integration

## Security Considerations

### Current Security Issues (as of audit)
**Critical:**
- form-data: Unsafe random function for boundary selection
  - Impact: Used in request library (dev dependency via coveralls)

**High Severity:**
- axios (1.13.1): Multiple vulnerabilities including DoS, SSRF, header injection
- fastify (5.6.1): DoS, validation bypass, header spoofing
- lodash (4.17.21): Prototype pollution vulnerabilities
- Various glob/minimatch/picomatch: ReDoS vulnerabilities

**Moderate:**
- @fastify/static (8.3.0): Path traversal, route guard bypass
- ajv: ReDoS vulnerabilities
- follow-redirects: Authentication header leakage

### Recommendations
1. **Immediate**: Run `npm audit fix` to update non-breaking fixes
2. **High Priority**: Upgrade axios to v1.15.0+
3. **High Priority**: Upgrade fastify to v5.8.5+
4. **High Priority**: Upgrade @fastify/static to v9.1.3+
5. **Medium Priority**: Replace lodash with modern alternatives or upgrade
6. **Low Priority**: Review dev dependencies (coveralls/request) for removal

### Additional Security Best Practices
- **Input Validation**: Validate all WebSocket messages
- **Rate Limiting**: Implement rate limiting for API endpoints
- **Authentication**: Add authentication layer for production
- **HTTPS**: Use TLS in production
- **Kafka Security**: Use SASL/SSL for Kafka in production

## Known Issues

1. **README.md Merge Conflict**: Unresolved Git merge conflict in README
2. **AWS SDK v2**: Consider migrating to AWS SDK v3 (v2 deprecated)
3. **Deprecated Dependencies**: Several outdated packages with security vulnerabilities

## Performance Considerations

- **WebSocket Payload**: Maximum 20GB per message (may need tuning)
- **Global State**: Uses `global.users` object (consider Redis for multi-instance)
- **Plugin Timeout**: Set to 10 seconds (may need adjustment for slow networks)

## Testing

Currently, the test suite is minimal:
```bash
npm test  # Currently exits with error message
```

**Recommendation**: Implement comprehensive test coverage including:
- Unit tests for handlers
- Integration tests for WebSocket flows
- API endpoint tests
- Kafka integration tests

## Monitoring & Logging

- **Log Level**: Configurable via `LOG_LEVEL` environment variable
- **Logger**: Fastify's built-in Pino logger
- **WebSocket Errors**: Logged as warnings to prevent crashes

## Contributing

The repository follows standard Git workflows:
- Main branch: `master`
- Format code: `npm run format` (Prettier)
- Conventional commits recommended

## License

This project is licensed under GPLv3.

---

**Last Updated**: 2026-04-22  
**Documentation Version**: 1.0  
**Application Version**: 0.0.1
