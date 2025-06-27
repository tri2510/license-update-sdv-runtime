# Docker Image Verification Process

This document describes how to verify that the new Docker build process (without bundled Python packages) produces an image with identical functionality to the original.

## Overview

We're removing the pre-bundled Python packages from the repository and installing them during Docker build time instead. This ensures proper license compliance while maintaining the same runtime functionality.

## Verification Steps

### 1. Build the Original Image (Before Changes)

First, build and tag the current image with bundled packages:

```bash
# Build the original image with bundled packages
docker buildx build --platform linux/amd64 -t sdv-runtime:old -f Dockerfile .
```

### 2. Build the New Image (After Changes)

After implementing the Dockerfile changes to install packages during build:

```bash
# Build the new image without bundled packages
docker buildx build --platform linux/amd64 -t sdv-runtime:new -f Dockerfile .
```

### 3. Run the Verification Script

Use the provided verification script to compare both images:

```bash
./verify_docker_images.sh sdv-runtime:old sdv-runtime:new
```

The script will check:
- Python package lists (using pip list)
- Package versions
- Python paths
- Import functionality for key packages
- File structure in /home/dev/python-packages/

### 4. Manual Verification

Additionally, you can manually verify functionality:

```bash
# Test the databroker in both images
docker run --rm sdv-runtime:old /app/databroker --version
docker run --rm sdv-runtime:new /app/databroker --version

# Test Python imports
docker run --rm sdv-runtime:old python -c "import velocitas_sdk; print('OK')"
docker run --rm sdv-runtime:new python -c "import velocitas_sdk; print('OK')"

# Test the full runtime
docker run -d -e RUNTIME_NAME="TestOld" -p 55555:55555 sdv-runtime:old
docker run -d -e RUNTIME_NAME="TestNew" -p 55556:55556 sdv-runtime:new
```

### 5. Expected Results

The verification should show:
- ✓ Identical Python package lists
- ✓ Same package versions
- ✓ All key packages import successfully
- ✓ Python paths match (except for potential ordering differences)
- ✓ Same functionality when running the full container

## Key Packages to Verify

The following packages are critical for SDV Runtime functionality:
- grpcio
- aiohttp
- websockets
- PyYAML
- cloudevents
- kuksa-client
- velocitas-sdk (aliased as 'sdv')
- opentelemetry components

## Troubleshooting

If packages differ:
1. Check the requirements.txt file matches the bundled packages
2. Ensure pip install uses the same index URL
3. Verify no packages were missed in the requirements
4. Check for platform-specific packages (linux_x86_64 vs linux_aarch64)

## Building for Multiple Architectures

For multi-architecture verification:

```bash
# Build both architectures
docker buildx build --platform linux/amd64,linux/arm64 -t sdv-runtime:old-multi -f Dockerfile .
docker buildx build --platform linux/amd64,linux/arm64 -t sdv-runtime:new-multi -f Dockerfile .

# Verify each architecture
docker run --rm --platform linux/amd64 sdv-runtime:new-multi python -m pip list
docker run --rm --platform linux/arm64 sdv-runtime:new-multi python -m pip list
```