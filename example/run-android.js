#!/usr/bin/env node

const { spawnSync } = require('child_process');

require('./preandroid');
require('./postinstall');

process.env.CI = 'true';

const result = spawnSync('react-native', ['run-android'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
