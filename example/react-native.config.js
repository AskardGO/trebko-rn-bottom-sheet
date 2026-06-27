module.exports = {
  dependencies: {
    // Android native module is included directly via settings.gradle (monorepo).
    // Disable autolinking to avoid duplicate registration.
    '@trebko/rn-bottom-sheet': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
