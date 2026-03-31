#!/bin/bash

# Default test if none provided
TEST_NAME=${1:-alarm-multiple}

# Paths
PROJECT_ROOT="/home/vivek/Desktop/osProject"
PINTOS_BUILD="$PROJECT_ROOT/pintos/src/threads/build"
OUTPUT_IMG="$PROJECT_ROOT/my-web-os/public/images/pintos.img"
MKDISK="$PROJECT_ROOT/pintos/src/utils/pintos-mkdisk"

echo "--------------------------------------------------"
echo "🔨 Rebuilding Pintos Disk Image"
echo "🧪 Test to run: $TEST_NAME"
echo "--------------------------------------------------"

# Remove existing image to avoid "already exists" error
if [ -f "$OUTPUT_IMG" ]; then
    rm "$OUTPUT_IMG"
    echo "🗑️  Removed old disk image."
fi

# Run pintos-mkdisk
# Note: We omit --geometry to avoid the division by zero bug in Pintos.pm
"$MKDISK" \
    --kernel="$PINTOS_BUILD/kernel.bin" \
    --loader="$PINTOS_BUILD/loader.bin" \
    --format=partitioned \
    "$OUTPUT_IMG" \
    -- run "$TEST_NAME"

if [ $? -eq 0 ]; then
    echo "--------------------------------------------------"
    echo "✅ Success! Disk image created at:"
    echo "   $OUTPUT_IMG"
    echo ""
    echo "👉 Reload your browser (http://localhost:3000) to run the test."
    echo "--------------------------------------------------"
else
    echo "--------------------------------------------------"
    echo "❌ Error: Failed to create disk image."
    echo "--------------------------------------------------"
    exit 1
fi
