module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        alias: {
          'rn-bottom-sheet': '../src/index',
        },
      },
    ],
    'react-native-reanimated/plugin', // Must be last!
  ],
};
