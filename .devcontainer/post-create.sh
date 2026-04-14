#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing project dependencies..."
npm install

echo "==> Installing Claude Code globally..."
npm install -g @anthropic-ai/claude-code

echo "==> Post-create setup complete."
