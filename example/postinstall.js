#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const exampleDir = __dirname;
const rootNodeModules = path.join(exampleDir, '..', 'node_modules');
const exampleNodeModules = path.join(exampleDir, 'node_modules');

// Yarn workspaces hoist dependencies to the monorepo root. Android Gradle and
// codegen tasks still resolve packages from example/node_modules, so mirror the
// hoisted packages here via directory junctions (Windows) or symlinks (Unix).
function linkHoistedPackage(name) {
  const target = path.join(rootNodeModules, name);
  const link = path.join(exampleNodeModules, name);

  if (!fs.existsSync(target)) return;
  if (!fs.statSync(target).isDirectory()) return;
  if (fs.existsSync(link)) return;

  fs.mkdirSync(exampleNodeModules, { recursive: true });

  try {
    if (process.platform === 'win32') {
      execSync(`cmd /c mklink /J "${link}" "${target}"`, { stdio: 'pipe' });
    } else {
      fs.symlinkSync(target, link, 'dir');
    }
    console.log(`Linked ${name} -> ${target}`);
  } catch {
    // Junction may already exist from a previous run — safe to ignore.
  }
}

if (fs.existsSync(rootNodeModules)) {
  const skip = new Set(['.bin', '.generated']);
  for (const name of fs.readdirSync(rootNodeModules)) {
    if (skip.has(name) || name.startsWith('.')) continue;
    linkHoistedPackage(name);
  }
}

// Legacy stub — only needed when react-native lives locally (non-hoisted).
const reactNativePath = path.join(exampleNodeModules, 'react-native');
const reactNativePackageJson = path.join(reactNativePath, 'package.json');

if (!fs.existsSync(reactNativePackageJson)) {
  console.log('react-native linked from monorepo root.');
} else {
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

  if (!fs.existsSync(gradlePropertiesPath)) {
    console.log('Writing ReactAndroid/gradle.properties stub...');
    fs.writeFileSync(gradlePropertiesPath, gradlePropertiesContent, 'utf8');
  }

  const cmakeUtilsPath = path.join(reactAndroidPath, 'cmake-utils', 'default-app-setup');
  if (!fs.existsSync(cmakeUtilsPath)) {
    console.log('Creating CMake utils stub directory...');
    fs.mkdirSync(cmakeUtilsPath, { recursive: true });
  }

  const cmakeListsPath = path.join(cmakeUtilsPath, 'CMakeLists.txt');
  const cmakeListsContent = `# Stub CMakeLists.txt for New Architecture compatibility
cmake_minimum_required(VERSION 3.13)
project(ReactAndroid)
`;

  if (!fs.existsSync(cmakeListsPath)) {
    console.log('Writing CMakeLists.txt stub...');
    fs.writeFileSync(cmakeListsPath, cmakeListsContent, 'utf8');
  }
}

console.log('✅ Example node_modules links ready.');
