# SDV Runtime

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![Docker Image Version](https://img.shields.io/docker/v/ghcr.io/eclipse-autowrx/sdv-runtime/latest?label=Docker%20Image)](https://github.com/eclipse-autowrx/sdv-runtime/pkgs/container/sdv-runtime)
[![GitHub Issues](https://img.shields.io/github/issues/eclipse-autowrx/sdv-runtime.svg)](https://github.com/eclipse-autowrx/sdv-runtime/issues)

A containerized runtime environment for Software Defined Vehicle (SDV) development and testing. The SDV Runtime provides a fully configured stack for developing, deploying, and testing vehicle applications with native integration to [playground.digital.auto](https://playground.digital.auto).

## Features

- **Ready-to-use Docker container** for SDV development
- **Native integration** with [playground.digital.auto](https://playground.digital.auto)
- **Multi-architecture support** (arm64, amd64)
- **Complete SDV stack** with all components pre-configured
- **Cloud or local mode** operation
- **Vehicle data simulation** for testing

## Components

The SDV Runtime includes the following components:

| Component | Version | Description |
|-----------|---------|-------------|
| [Kuksa Databroker](https://github.com/eclipse-kuksa/kuksa-databroker) | 0.4.4 | Central data broker for vehicle signals |
| [Vehicle Signal Specification](https://github.com/COVESA/vss-tools) | 4.0 | Standardized vehicle data model |
| [Vehicle Model Generator](https://github.com/eclipse-velocitas/vehicle-model-generator) | 0.7.2 | Generates code from VSS models |
| [Kuksa Syncer](./kuksa-syncer) | Custom | Runtime synchronization service |
| [Kit Manager](./kit-manager) | Custom | Runtime management service |
| [Kuksa Mock Provider](https://github.com/eclipse-kuksa/kuksa-mock-provider) | Modified | Vehicle data simulation |
| [Velocitas Python SDK](https://github.com/eclipse-velocitas/vehicle-app-python-sdk) | 0.14.1 | Application development framework |
| [Python](https://www.python.org/downloads/release/python-3100/) | 3.10 | Application runtime environment |

## Quick Start

### Prerequisites

- Docker installed on your system
- Internet connection (for pulling the image)

### Running the Container

Run the SDV Runtime with a custom name:

```bash
docker run -d -e RUNTIME_NAME="MyRuntimeName" ghcr.io/eclipse-autowrx/sdv-runtime:latest
```

When you run this Docker container, all the components mentioned above will be ready to use, and you will be connected to [playground.digital.auto](https://playground.digital.auto) natively.

### Access the Databroker

To use kuksa-client to interact with the data broker from outside the container, add port forwarding to the run command:

```bash
docker run -d -e RUNTIME_NAME="MyRuntimeName" -p 55555:55555 ghcr.io/eclipse-autowrx/sdv-runtime:latest
```

### Local Development Mode

To run your runtime with a local self-manager (no external connection):

```bash
docker run -d -e RUNTIME_NAME="MyRuntimeName" -e SYNCER_SERVER_URL="http://localhost:3090" -p 3090:3090 ghcr.io/eclipse-autowrx/sdv-runtime:latest
```

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RUNTIME_NAME` | Required: Unique name for your runtime | - |
| `SYNCER_SERVER_URL` | URL of the runtime manager server | https://kit.digitalauto.tech |

## Building from Source

### Prerequisites for Building

- Docker with BuildKit capability
- Git

### Clone the Repository

```bash
git clone https://github.com/eclipse-autowrx/sdv-runtime.git
cd sdv-runtime
```

### Build the Docker Image

For a multi-architecture build (amd64 and arm64):

```bash
# Create a multi-platform builder
docker buildx create --driver docker-container --name mybuilder --platform "linux/amd64,linux/arm64" default
docker buildx use mybuilder

# Build the image
docker buildx build --push --platform linux/amd64,linux/arm64 -t <your-registry>/sdv-runtime:latest -f Dockerfile .
```

For a single architecture build:

```bash
docker buildx use default
docker buildx build --platform linux/amd64 -t sdv-runtime:latest -f Dockerfile .
```

## Development Guide

### Architecture Overview

The SDV Runtime is designed as a containerized environment with several interconnected components:

1. **KUKSA Databroker**: The central data broker for vehicle signals, implemented in Rust with gRPC interfaces.

2. **Kuksa Syncer**: A custom component that manages the registration and synchronization of the runtime with external management services.

3. **Kit Manager**: Orchestrates the runtime environment and provides management capabilities.

4. **Mock Provider**: Generates simulated vehicle data for development and testing.

5. **Velocitas SDK**: Provides a high-level API for vehicle application development.

### Development Workflow

1. Start the SDV Runtime container
2. Develop your vehicle application using the Velocitas SDK
3. Test your application with the mock vehicle data
4. Deploy your application to the runtime

### Example Application

Here's a simple Python application using the Velocitas SDK:

```python
from velocitas_sdk import VehicleApp
from velocitas_sdk.vehicle_model import Vehicle

class MyVehicleApp(VehicleApp):
    def __init__(self):
        super().__init__()
        self.Vehicle = Vehicle()
    
    async def on_start(self):
        # Subscribe to vehicle speed
        await self.Vehicle.Speed.subscribe(self.on_speed_change)
    
    async def on_speed_change(self, data):
        speed = data.value
        print(f"Current speed: {speed} km/h")
        
        # Add your application logic here

if __name__ == "__main__":
    app = MyVehicleApp()
    app.run()
```

## Instance Setup Guide

This section provides a step-by-step guide for setting up and managing SDV Runtime instances for various scenarios.

### Basic Setup

#### 1. Development Instance

```bash
docker run -d \
  --name sdv-dev \
  -e RUNTIME_NAME="DevInstance" \
  -p 55555:55555 \
  ghcr.io/eclipse-autowrx/sdv-runtime:latest
```

This setup is ideal for local development with:
- Unique runtime name ("DevInstance")
- Exposed databroker port for external tool access
- Cloud connection for playground.digital.auto integration

#### 2. Isolated Testing Instance

```bash
docker run -d \
  --name sdv-test \
  -e RUNTIME_NAME="TestInstance" \
  -e SYNCER_SERVER_URL="http://localhost:3090" \
  -p 3090:3090 \
  --network sdv-test-net \
  ghcr.io/eclipse-autowrx/sdv-runtime:latest
```

First create the network:
```bash
docker network create sdv-test-net
```

This setup provides:
- Completely isolated environment
- Local manager with no external connections
- Custom network for integration testing

#### 3. Production-Ready Instance

```bash
docker run -d \
  --name sdv-prod \
  -e RUNTIME_NAME="ProdInstance" \
  --restart unless-stopped \
  --memory="2g" \
  --cpus="2" \
  ghcr.io/eclipse-autowrx/sdv-runtime:latest
```

Features:
- Resource limits (2GB RAM, 2 CPUs)
- Automatic restart policy
- Default cloud connectivity

### Advanced Configuration

#### Custom VSS Model

1. Create your custom VSS model file (e.g., `custom-vss.json`)
2. Use it in a custom Dockerfile:

```dockerfile
FROM ghcr.io/eclipse-autowrx/sdv-runtime:latest
COPY custom-vss.json /vss/custom-vss.json
ENV VSS_MODEL_PATH=/vss/custom-vss.json
```

Build and run:
```bash
docker build -t custom-sdv-runtime .
docker run -d -e RUNTIME_NAME="CustomVSS" custom-sdv-runtime
```

#### Persistent Storage

For development with persistent data:

```bash
docker volume create sdv-data
docker run -d \
  -e RUNTIME_NAME="PersistentInstance" \
  -v sdv-data:/data \
  ghcr.io/eclipse-autowrx/sdv-runtime:latest
```

#### Docker Compose Setup

Create a `docker-compose.yml` file:

```yaml
version: '3'
services:
  sdv-runtime:
    image: ghcr.io/eclipse-autowrx/sdv-runtime:latest
    container_name: sdv-runtime
    environment:
      - RUNTIME_NAME=ComposeInstance
    ports:
      - "55555:55555"
    volumes:
      - sdv-data:/data
    restart: unless-stopped
    
  my-vehicle-app:
    build: ./my-app
    container_name: my-vehicle-app
    depends_on:
      - sdv-runtime
    network_mode: "service:sdv-runtime"

volumes:
  sdv-data:
```

Run with:
```bash
docker-compose up -d
```

### Health Monitoring

Check the runtime status:

```bash
# Check container logs
docker logs sdv-runtime

# Check running services
docker exec sdv-runtime ps aux

# Test databroker connection
docker exec -it sdv-runtime kuksa-client
```

### Performance Tuning

For high-performance setups:

```bash
docker run -d \
  -e RUNTIME_NAME="HighPerformance" \
  --cpuset-cpus="0,1" \
  --memory="4g" \
  --memory-swap="6g" \
  --ulimit nofile=65536:65536 \
  ghcr.io/eclipse-autowrx/sdv-runtime:latest
```

## Troubleshooting

### Common Issues

1. **Container Fails to Start**
   - Check Docker logs: `docker logs <container_id>`
   - Verify RUNTIME_NAME is specified
   - Ensure Docker has sufficient resources

2. **Cannot Connect to Databroker**
   - Verify port mapping: `docker port <container_id>`
   - Check if databroker is running: `docker exec <container_id> ps aux | grep databroker`
   - Test internal connection: `docker exec -it <container_id> kuksa-client`

3. **Not Appearing in Playground**
   - Ensure RUNTIME_NAME is unique
   - Check internet connectivity: `docker exec <container_id> ping kit.digitalauto.tech`
   - Verify logs for registration success: `docker logs <container_id> | grep "registered"`

### Debug Mode

Enable debug logging:

```bash
docker run -d \
  -e RUNTIME_NAME="DebugInstance" \
  -e LOG_LEVEL=DEBUG \
  ghcr.io/eclipse-autowrx/sdv-runtime:latest
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

To contribute code:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Copyright (c) 2024 Eclipse AutoWRX Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
