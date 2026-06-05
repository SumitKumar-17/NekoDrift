#!/bin/bash
# Run on macOS to generate icon.icns from icon.png
set -e
ASSETS="$(dirname "$0")/../assets"
mkdir -p /tmp/nekodrift.iconset
for size in 16 32 64 128 256 512; do
  sips -z $size $size "$ASSETS/icon.png" --out "/tmp/nekodrift.iconset/icon_${size}x${size}.png" 2>/dev/null
  sips -z $((size*2)) $((size*2)) "$ASSETS/icon.png" --out "/tmp/nekodrift.iconset/icon_${size}x${size}@2x.png" 2>/dev/null
done
iconutil -c icns /tmp/nekodrift.iconset -o "$ASSETS/icon.icns"
rm -rf /tmp/nekodrift.iconset
echo "Generated icon.icns"
