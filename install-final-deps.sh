#!/bin/bash

cd /Users/macbookm2/Desktop/Work/projects/rushita-care-nextjs/node_modules || exit 1

# Install missing npm packages
declare -A packages=(
  ["simple-swizzle"]="0.2.2"
  ["hsl-to-rgb-for-reals"]="1.1.1"
)

for pkg in "${!packages[@]}"; do
  version="${packages[$pkg]}"
  echo "Installing $pkg@$version..."
  mkdir -p "$pkg"
  cd "$pkg"
  curl -sL "https://registry.npmjs.org/${pkg}/-/${pkg}-${version}.tgz" -o p.tgz
  tar -xzf p.tgz --strip-components=1 2>/dev/null
  rm -f p.tgz
  cd ..
done

# Install @react-pdf/image
echo "Installing @react-pdf/image..."
cd @react-pdf || exit 1
mkdir -p image
cd image
curl -sL "https://registry.npmjs.org/@react-pdf/image/-/image-3.0.3.tgz" -o p.tgz
tar -xzf p.tgz --strip-components=1 2>/dev/null
rm -f p.tgz

echo "All dependencies installed!"
