const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const root = path.resolve(__dirname, '..');
const pak = require('../package.json');

const modules = Object.keys({
  ...pak.peerDependencies,
});

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [root],

  resolver: {
    // Exclude Android / iOS build artefacts so Metro doesn't crash when Gradle
    // removes incremental build directories while the bundler is running.
    blockList: [
      /example[/\\]android[/\\]app[/\\]build[/\\].*/,
      /example[/\\]ios[/\\]build[/\\].*/,
    ],

    blacklistRE: /node_modules\/.*\/node_modules\/react-native\/.*/,

    extraNodeModules: {
      // Map the scoped package name directly to the library root so Metro
      // resolves it without requiring a node_modules symlink.
      [pak.name]: root,
      ...modules.reduce((acc, name) => {
        acc[name] = path.join(root, 'node_modules', name);
        return acc;
      }, {}),
    },

    nodeModulesPaths: [
      path.join(__dirname, 'node_modules'),
      path.join(root, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
