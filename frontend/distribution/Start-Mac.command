#!/bin/sh
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo 'Please install Node.js 24 LTS or newer: https://nodejs.org/'
  read -r reply
  exit 1
fi
node launch.cjs
