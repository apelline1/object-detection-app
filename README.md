# object-detection-app

## Deployment Instructions

At deployment time, please remember to add the advanced deployment options:

Under **Environment variables (runtime only)**, create a Name / Value pair:

- **Name**: `OBJECT_DETECTION_URL`
- **Value**: `http://<service-name>:<service-port>/predictions`

Example: `http://object-detection-rest:8080/predictions`

For complete documentation, see [DOCUMENTATION.md](DOCUMENTATION.md)
