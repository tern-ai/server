# OSM proxy service

## Overview

Proxies OSM requests for the Tern app, reducing our dependency on an external
resoruce and allowing modification and caching.


## Architecture

The service consists of three components

1. A REST API server in Typescript, supporting basic key-based authentication

2. An in-memory cache, to exploit temporal locality across queries. Later, we
will support spatial caching for non-exact matches

3. On-disk storage of heavily-used queries to pre-fill the cache

## Run Locally
`./run_local.py`

## Deployment
TODO
