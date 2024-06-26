module.exports = [
  // Add support for native node modules
    {
    // We're specifying native_modules in the test because the asset relocator loader generates a
    // "fake" .node file which is really a cjs file.
    test: /native_modules[/\\].+\.node$/,
    use: 'node-loader',
    },
    {
    test: /\.js$/,
    parser: { amd: false },
    use: {
        loader: '@vercel/webpack-asset-relocator-loader',
        options: {
            // Specify the name of the folder in which to relocate the files
            outputAssetBase: 'assets'
            }
        }
    },
  // Put your webpack loader rules in this array.  This is where you would put
  // your ts-loader configuration for instance:
  /**
   * Typescript Example:
   *
   * {
   *   test: /\.tsx?$/,
   *   exclude: /(node_modules|.webpack)/,
   *   loaders: [{
   *     loader: 'ts-loader',
   *     options: {
   *       transpileOnly: true
   *     }
   *   }]
   * }
   */
];
