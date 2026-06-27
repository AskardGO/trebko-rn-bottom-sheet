#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create ReactAndroid stub directory and gradle.properties for New Architecture compatibility
const reactNativePath = path.join(__dirname, 'node_modules', 'react-native');
const reactNativePackageJson = path.join(reactNativePath, 'package.json');

// Skip stub creation when react-native is hoisted/linked from the monorepo root.
if (!fs.existsSync(reactNativePackageJson)) {
  console.log('Skipping ReactAndroid stub: react-native is not installed locally.');
  process.exit(0);
}

const reactAndroidPath = path.join(reactNativePath, 'ReactAndroid');

if (!fs.existsSync(reactAndroidPath)) {
  console.log('Creating ReactAndroid directory stub for New Architecture...');
  fs.mkdirSync(reactAndroidPath, { recursive: true });
}

const gradlePropertiesPath = path.join(reactAndroidPath, 'gradle.properties');
const gradlePropertiesContent = `# Stub gradle.properties for New Architecture compatibility
# This file is needed by React Native Gradle Plugin when newArchEnabled=true

VERSION_NAME=0.74.0
GROUP=com.facebook.react
POM_ARTIFACT_ID=react-android
POM_NAME=ReactAndroid
`;

console.log('Writing ReactAndroid/gradle.properties stub...');
fs.writeFileSync(gradlePropertiesPath, gradlePropertiesContent, 'utf8');

// Create CMake stub directory structure
const cmakeUtilsPath = path.join(reactAndroidPath, 'cmake-utils', 'default-app-setup');
if (!fs.existsSync(cmakeUtilsPath)) {
  console.log('Creating CMake utils stub directory...');
  fs.mkdirSync(cmakeUtilsPath, { recursive: true });
}

const cmakeListsPath = path.join(cmakeUtilsPath, 'CMakeLists.txt');
const cmakeListsContent = `# Stub CMakeLists.txt for New Architecture compatibility
# This file is needed by React Native Gradle Plugin when newArchEnabled=true

cmake_minimum_required(VERSION 3.13)
project(ReactAndroid)

# This is a stub file - the actual CMake configuration
# is handled by React Native Gradle Plugin
`;

console.log('Writing CMakeLists.txt stub...');
fs.writeFileSync(cmakeListsPath, cmakeListsContent, 'utf8');

console.log('✅ New Architecture stub files created successfully!');
