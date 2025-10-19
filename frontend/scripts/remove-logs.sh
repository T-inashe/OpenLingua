#!/bin/bash

# Script to remove non-error console logs from frontend
# Keeps console.error but removes console.log, console.warn (except critical ones)

echo "🧹 Removing excessive console logs from frontend..."

# Function to comment out console.log statements
comment_logs() {
  local file=$1
  # Comment out console.log and console.warn, keep console.error
  sed -i 's/^\(\s*\)console\.log(/\1\/\/ console.log(/g' "$file"
  sed -i 's/^\(\s*\)console\.warn(/\1\/\/ console.warn(/g' "$file"
}

# Find and process TypeScript/TSX files
find /home/vmuser/Downloads/hey/OpenLingua/frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) | while read file; do
  # Skip logger.ts itself
  if [[ "$file" == *"logger.ts"* ]]; then
    continue
  fi
  
  # Check if file has console.log or console.warn
  if grep -q "console\.log\|console\.warn" "$file" 2>/dev/null; then
    echo "Processing: $file"
    comment_logs "$file"
  fi
done

echo "✅ Done! Console logs have been commented out (except errors)"
