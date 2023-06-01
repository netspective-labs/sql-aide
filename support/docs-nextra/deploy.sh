#!/bin/bash

echo "Building static site..."
pnpm run build

echo "Exporting static site..."
pnpm run export

echo "Deploying to GitHub Pages..."
gh-pages -d out
