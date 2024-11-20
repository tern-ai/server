#!/usr/bin/env python3

"""
Provide a string as the first and only argument to this script. This string
will need to be sent in every request as the `x-api-key` header.

You should have a Redis server running on your machine at port 6379
"""

# TODO: Proper environment setup for redis-server. Will probably just move this
# into a docker container

import os
import shlex
import subprocess
import sys

def _call(cmd: str, env = None) -> str:
    return subprocess.check_output(shlex.split(cmd), env=env).decode("utf-8")

def main(api_key: str) -> None:
    print("Running Tern OSM server locally")
    # cd to script's dir
    os.chdir(os.path.dirname(os.path.realpath(__file__)))
    _call("npm install")
    _call("npx ts-node src/index.ts", env={"TERN_API_KEY": api_key})

if __name__ == "__main__":
    (api_key,) = sys.argv[1:]
    main(api_key)
