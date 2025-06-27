#!/bin/bash

# Script to verify that the new Docker image has the same Python packages as the old one
# Usage: ./verify_docker_images.sh <old_image> <new_image>

OLD_IMAGE=${1:-"sdv-runtime:old"}
NEW_IMAGE=${2:-"sdv-runtime:new"}

echo "Comparing Docker images: $OLD_IMAGE vs $NEW_IMAGE"
echo "==========================================="

# Create temporary directory for outputs
TEMP_DIR=$(mktemp -d)
echo "Using temp directory: $TEMP_DIR"

# Function to extract Python package list from an image
extract_packages() {
    local image=$1
    local output_file=$2
    
    echo "Extracting package list from $image..."
    
    # Run pip list in the container and save output
    docker run --rm "$image" python -m pip list --format=freeze | sort > "$output_file"
    
    # Also get package details with versions
    docker run --rm "$image" python -m pip show $(docker run --rm "$image" python -m pip list --format=freeze | cut -d= -f1) > "${output_file}.details" 2>/dev/null || true
}

# Extract packages from both images
extract_packages "$OLD_IMAGE" "$TEMP_DIR/old_packages.txt"
extract_packages "$NEW_IMAGE" "$TEMP_DIR/new_packages.txt"

# Compare package lists
echo ""
echo "Package comparison:"
echo "==================="

# Check for differences
if diff -u "$TEMP_DIR/old_packages.txt" "$TEMP_DIR/new_packages.txt" > "$TEMP_DIR/diff.txt"; then
    echo "✓ Package lists are identical"
else
    echo "✗ Package lists differ:"
    cat "$TEMP_DIR/diff.txt"
    echo ""
    echo "Lines starting with '-' are in old image only"
    echo "Lines starting with '+' are in new image only"
fi

# Compare Python paths
echo ""
echo "Python path comparison:"
echo "======================="

OLD_PYTHONPATH=$(docker run --rm "$OLD_IMAGE" python -c "import sys; print(':'.join(sys.path))")
NEW_PYTHONPATH=$(docker run --rm "$NEW_IMAGE" python -c "import sys; print(':'.join(sys.path))")

if [ "$OLD_PYTHONPATH" = "$NEW_PYTHONPATH" ]; then
    echo "✓ Python paths are identical"
else
    echo "✗ Python paths differ"
    echo "Old: $OLD_PYTHONPATH"
    echo "New: $NEW_PYTHONPATH"
fi

# Test imports of key packages
echo ""
echo "Testing key package imports:"
echo "============================"

KEY_PACKAGES=(
    "grpc"
    "aiohttp" 
    "yaml"
    "websockets"
    "cloudevents"
    "kuksa_client"
    "velocitas_sdk"
    "sdv"  # This is the symlink to velocitas_sdk
)

for pkg in "${KEY_PACKAGES[@]}"; do
    OLD_RESULT=$(docker run --rm "$OLD_IMAGE" python -c "import $pkg; print('OK')" 2>&1)
    NEW_RESULT=$(docker run --rm "$NEW_IMAGE" python -c "import $pkg; print('OK')" 2>&1)
    
    if [[ "$OLD_RESULT" == "OK" ]] && [[ "$NEW_RESULT" == "OK" ]]; then
        echo "✓ $pkg imports successfully in both images"
    else
        echo "✗ $pkg import differs:"
        echo "  Old: $OLD_RESULT"
        echo "  New: $NEW_RESULT"
    fi
done

# Check file structure
echo ""
echo "Checking file structure:"
echo "======================="

# Check if python-packages directory exists
OLD_PKG_DIR=$(docker run --rm "$OLD_IMAGE" bash -c "ls -la /home/dev/python-packages/ 2>&1 | head -5")
NEW_PKG_DIR=$(docker run --rm "$NEW_IMAGE" bash -c "ls -la /home/dev/python-packages/ 2>&1 | head -5")

echo "Old image /home/dev/python-packages/:"
echo "$OLD_PKG_DIR"
echo ""
echo "New image /home/dev/python-packages/:"
echo "$NEW_PKG_DIR"

# Summary
echo ""
echo "Summary:"
echo "========"
if diff -q "$TEMP_DIR/old_packages.txt" "$TEMP_DIR/new_packages.txt" > /dev/null; then
    echo "✓ All Python packages match between images"
else
    echo "✗ Python packages differ between images"
    echo "  See detailed diff above"
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "Verification complete!"