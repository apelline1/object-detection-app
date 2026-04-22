# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.0.2   | :white_check_mark: |
| 0.0.1   | :x:                |

## Security Updates (v0.0.2)

### Fixed Vulnerabilities

The following security vulnerabilities have been addressed in version 0.0.2:

#### High Priority Updates
- **axios**: Updated to v1.15.0+ (from v1.13.1)
  - Fixed: DoS via __proto__ Key
  - Fixed: HTTP/2 Session Cleanup vulnerability
  - Fixed: NO_PROXY Hostname Normalization Bypass (SSRF)
  - Fixed: Unrestricted Cloud Metadata Exfiltration

- **fastify**: Updated to latest stable version (from v5.6.1)
  - Fixed: DoS via Unbounded Memory Allocation
  - Fixed: Content-Type header validation bypass
  - Fixed: request.protocol and request.host spoofing
  - Fixed: Body Schema Validation Bypass

- **@fastify/static**: Updated to v9.1.3+ (from v8.3.0)
  - Fixed: Path traversal in directory listing
  - Fixed: Route guard bypass via encoded path separators

- **lodash**: Updated to latest version (from v4.17.21)
  - Fixed: Prototype Pollution in _.unset and _.omit
  - Fixed: Code Injection via _.template
  - Fixed: Prototype Pollution via array path bypass

#### Automatic Fixes Applied
- Various glob, minimatch, picomatch ReDoS vulnerabilities
- brace-expansion process hang issues
- ajv ReDoS vulnerabilities
- follow-redirects authentication header leakage
- tar path traversal vulnerabilities
- yaml stack overflow issues

### Removed Dependencies
- **coveralls**: Removed from devDependencies
  - Reason: Depends on deprecated `request` library with unfixable vulnerabilities
  - Alternative: Consider using GitHub Actions native coverage reporting

### Known Remaining Issues

#### AWS SDK v2 (Low Priority)
- **Issue**: AWS SDK v2 has reached end-of-support
- **Impact**: No longer receives security updates
- **Recommendation**: Migrate to AWS SDK v3 when feasible
- **Mitigation**: Add validation to region parameter values

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

1. **Do NOT** open a public GitHub issue
2. Email the maintainer at: [security contact needed]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Critical vulnerabilities patched within 30 days

## Security Best Practices for Deployment

### Production Configuration

1. **Environment Variables**
   ```bash
   # Never use default/example values in production
   OBJECT_DETECTION_URL=https://your-secure-endpoint/predictions
   ```

2. **Kafka Security**
   ```bash
   KAFKA_SECURITY_PROTOCOL=SASL_SSL
   KAFKA_SASL_MECHANISM=SCRAM-SHA-512
   # Use strong credentials
   KAFKA_USERNAME=<secure-username>
   KAFKA_PASSWORD=<secure-password>
   ```

3. **Network Security**
   - Use HTTPS/TLS for all external communications
   - Implement network policies to restrict pod-to-pod communication
   - Use service mesh for encrypted internal traffic

4. **Authentication & Authorization**
   - Implement authentication middleware for production
   - Add rate limiting to prevent abuse
   - Use API keys or OAuth for external access

5. **Input Validation**
   - Validate all WebSocket messages
   - Sanitize file uploads
   - Limit file sizes appropriately

6. **Monitoring**
   - Enable audit logging
   - Monitor for unusual traffic patterns
   - Set up alerts for failed authentication attempts

### Container Security

- **Base Image**: Uses Red Hat UBI8 with Node.js 18
- **Regular Updates**: Keep base image updated
- **Scanning**: Run container vulnerability scans regularly
- **Non-Root User**: Configure container to run as non-root user

### Dependency Management

```bash
# Check for vulnerabilities regularly
npm audit

# Update dependencies (test thoroughly)
npm update

# For critical security updates
npm audit fix --force
```

## Security Checklist for Deployment

- [ ] All environment variables use production values
- [ ] HTTPS/TLS enabled
- [ ] Authentication middleware implemented
- [ ] Rate limiting configured
- [ ] Kafka uses SASL/SSL (if enabled)
- [ ] Input validation on all endpoints
- [ ] File upload size limits set
- [ ] Container runs as non-root
- [ ] Security monitoring enabled
- [ ] Regular dependency updates scheduled
- [ ] Backup and disaster recovery plan in place

## Compliance

This application handles user-uploaded images and videos. Ensure compliance with:
- Data privacy regulations (GDPR, CCPA, etc.)
- Data retention policies
- User consent for data processing
- Secure data deletion procedures

---

**Last Updated**: 2026-04-22  
**Security Contact**: [To be configured]
