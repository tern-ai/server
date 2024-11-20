# Scalable Proxy Microservice for Open Street Map API

## Project Overview

**Objective**: Develop a scalable and highly available microservice acting as a proxy for the Open Street Map (OSM) API, caching responses in a Redis database to optimize performance. This service is designed for deployment on an elastic infrastructure using Infrastructure as Code (IaC) tools, allowing easy deployment across multiple cloud providers.

## Architectural Design

1. **Microservice Framework**
   - **Platform**: Node.js with Express, written in TypeScript.
   - **API Type**: RESTful API.

2. **Authentication**
   - Basic API-key-based authentication.
   - Requires the API key in the request header to validate authorized access.

3. **Caching Layer**
   - **Database**: Redis, acting as a caching layer.
   - **Purpose**: Minimizes redundant requests to the OSM API by caching responses, improving response times and reducing load on the external API.

4. **Infrastructure**
   - **Provisioning**: Terraform, used to define and provision infrastructure.
   - **Cloud-Agnostic**: Infrastructure defined in Terraform, enabling deployment to AWS, GCP, or Azure with minimal changes.
   - **Elasticity**: Infrastructure setup supports future auto-scaling to handle increased demand.

## Technical Requirements

1. **Environment Variables**
   - Sensitive data such as API keys, Redis configuration, and logging service credentials should be stored in environment variables.
   - Example environment variables:
     - `SERVICE_API_KEY`: Key for authenticating clients accessing this microservice.
   - Use `.env` files with packages like `dotenv` to load environment variables into the application securely.

2. **Monitoring & Logging**
   - Integrate with a third-party monitoring tool (e.g., DataDog or LogDNA) for health checks and performance metrics.
   - Structured logging (e.g., using Winston) to log API requests, responses, errors, and cache hits/misses for tracking and debugging.

3. **Security**
   - Enforce API-key authentication for secure access.
   - Potential for future rate limiting as a security and resource management measure.

## Infrastructure Setup in Terraform

1. **Modules**
   - **Compute**: Define an instance group or containerized deployment for Node.js with TypeScript.
   - **Networking**: Provision VPC, subnets, and security groups to manage inbound/outbound rules for API requests.
   - **Database**: Redis instance with a configuration that supports elastic scaling and high availability.
   - **Load Balancer**: To be defined as a future improvement.

2. **Configuration Files**
   - `variables.tf`: Defines variables for configuration flexibility across cloud providers.
   - `outputs.tf`: Outputs essential resources (e.g., service endpoint, Redis instance URL).
   - `main.tf`: Sets up and configures resources, with an emphasis on reusable and modular configuration.

3. **CI/CD Integration**
   - To be defined for future implementation, enabling automated deployment and high availability through continuous deployment.

## Summary

The microservice will act as a reliable, high-performance, cloud-agnostic proxy for the Open Street Map API with caching and essential monitoring capabilities. Express with TypeScript ensures a lightweight, efficient service layer, while Redis and Terraform enable speed, reliability, and straightforward deployment across any cloud provider.


## Installation and Testing Instructions

### Installation

1. **Clone the repository**
   ```sh
   git clone <repository-url>
   cd osm-proxy-microservice
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Configure environment variables**
   - Create a `.env` file in the root directory and add the required variables:
   ```
   SERVICE_API_KEY=your_service_api_key
   LOGGING_SERVICE_KEY=your_logging_service_key
   REDIS_URL=redis://localhost:6379
   ```

4. **Start Redis**
   - Make sure Redis is installed and running:
   ```sh
   redis-server
   ```

5. **Compile TypeScript**
   ```sh
   npx tsc
   ```

6. **Run the application**
   ```sh
   node dist/index.js
   ```

### Testing

1. **Test with Curl**
   Use the following command to test the `/osm` endpoint:
   ```sh
   curl -X GET "http://localhost:3000/osm?q=Buenos+Aires" -H "x-api-key: your_service_api_key"
   ```
   - Replace `your_service_api_key` with the actual API key you set in your `.env` file.

2. **Expected Response**
   - You should receive JSON data from OpenStreetMap for the queried location (`Buenos Aires`).
   - If the query is repeated, the data will be served from the Redis cache, improving response time.
   