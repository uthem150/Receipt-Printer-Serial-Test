const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        buffer: require.resolve("buffer/"),
        // 다른 필요한 폴리필도 여기에 추가할 수 있음
      };
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
        })
      );
      return webpackConfig;
    },
  },
};
