module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        alias: {
          '@trebko/rn-bottom-sheet': '../src/index',
        },
      },
    ],
    'react-native-worklets/plugin', // Must be last! (Reanimated 4 uses worklets plugin)
  ],
};
