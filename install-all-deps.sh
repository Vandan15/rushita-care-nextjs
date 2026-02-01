#!/bin/bash

# Install all missing dependencies for @react-pdf

cd node_modules || exit 1

# Install @react-pdf packages
echo "Installing @react-pdf packages..."
cd @react-pdf 2>/dev/null || mkdir -p @react-pdf && cd @react-pdf

for pkg_version in \
  "stylesheet:4.0.0" \
  "textkit:5.0.2"
do
  IFS=':' read -r pkg version <<< "$pkg_version"
  echo "Installing @react-pdf/$pkg@$version"
  mkdir -p "$pkg"
  cd "$pkg" || continue
  curl -sL "https://registry.npmjs.org/@react-pdf/${pkg}/-/${pkg}-${version}.tgz" -o package.tgz
  tar -xzf package.tgz --strip-components=1 2>/dev/null
  rm -f package.tgz
  cd ..
done

cd ..

# Install regular npm packages
echo "Installing regular packages..."
for pkg_version in \
  "is-url:1.2.4" \
  "fontkit:2.1.1" \
  "yoga-layout:3.1.0"
do
  IFS=':' read -r pkg version <<< "$pkg_version"
  echo "Installing $pkg@$version"
  mkdir -p "$pkg"
  cd "$pkg" || continue
  curl -sL "https://registry.npmjs.org/${pkg}/-/${pkg}-${version}.tgz" -o package.tgz
  tar -xzf package.tgz --strip-components=1 2>/dev/null
  rm -f package.tgz
  cd ..
done

echo "Done installing dependencies"
