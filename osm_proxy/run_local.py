#!/usr/bin/env python3

import os
import shlex
import subprocess

from typing import Dict

def _call(cmd: str) -> str:
    return subprocess.check_output(shlex.split(cmd)).decode("utf-8")

def main():
    print("Running Tern OSM server locally")
    # cd to script's dir
    os.chdir(os.path.dirname(os.path.realpath(__file__)))
    # TODO: Maybe needs env vars set up
    # Install dependencies
    _call("npm install")
    _call("redis-server")
    _call("npx tsc")
    _call("node dist/index.js")


if __name__ == "__main__":
    main()
