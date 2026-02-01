#!/bin/bash

# Install @react-pdf dependencies manually

cd node_modules/@react-pdf || exit 1

packages=(
  "primitives:4.1.1"
  "fns:3.1.2"
  "font:4.0.4"
  "layout:4.4.2"
  "pdfkit:4.1.0"
  "reconciler:2.0.0"
  "render:4.3.2"
  "types:2.9.2"
)

for pkg_version in "${packages[@]}"; do
  IFS=':' read -r pkg version <<< "$pkg_version"
  echo "Installing @react-pdf/$pkg@$version"

  mkdir -p "$pkg"
  cd "$pkg" || continue

  curl -sL "https://registry.npmjs.org/@react-pdf/${pkg}/-/${pkg}-${version}.tgz" -o package.tgz
  tar -xzf package.tgz --strip-components=1 2>/dev/null
  rm -f package.tgz

  cd ..
done

echo "Done installing @react-pdf dependencies"
