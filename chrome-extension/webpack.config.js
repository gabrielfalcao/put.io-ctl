var webpack = require("webpack"),
  path = require("path"),
  fileSystem = require("fs"),
  env = require("./utils/env"),
  CleanWebpackPlugin = require("clean-webpack-plugin").CleanWebpackPlugin,
  CopyWebpackPlugin = require("copy-webpack-plugin"),
  HtmlWebpackPlugin = require("html-webpack-plugin"),
  WriteFilePlugin = require("write-file-webpack-plugin");

// load the secrets
var alias = {
  putio: path.resolve(__dirname, "src/js"),
  img: path.resolve(__dirname, "src/img"),
  css: path.resolve(__dirname, "src/css"),
  //  "semantic-ui": path.resolve(__dirname, "vendor/semantic-ui"),
};

var secretsPath = path.join(__dirname, "secrets." + env.NODE_ENV + ".js");
var now = new Date();
var fileExtensions = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "eot",
  "otf",
  "svg",
  "ttf",
  "woff",
  "woff2",
];

if (fileSystem.existsSync(secretsPath)) {
  alias["secrets"] = secretsPath;
}

var options = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    popup: path.join(__dirname, "src", "js", "popup.js"),
    options: path.join(__dirname, "src", "js", "options.js"),
    devtools: path.join(__dirname, "src", "js", "devtools.js"),
    panel: path.join(__dirname, "src", "js", "panel.js"),
    background: path.join(__dirname, "src", "js", "background.js"),
    content_script: path.join(__dirname, "src", "js", "content_script.js"),
  },
  chromeExtensionBoilerplate: {
    notHotReload: ["content_script"],
  },
  output: {
    path: path.join(__dirname, "build"),
    filename: "[name].bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: "style-loader!css-loader",
        exclude: /(node_modules)/,
      },
      {
        test: new RegExp(".(" + fileExtensions.join("|") + ")$"),
        loader: "file-loader?name=[name].[ext]",
        exclude: /(node_modules)/,
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /(node_modules)/,
      },
      {
        test: /\.(js|jsx)$/,
        loader: "babel-loader",
        exclude: /(node_modules)/,
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: alias,
    extensions: fileExtensions
      .map((extension) => "." + extension)
      .concat([".jsx", ".js", ".css"]),
  },
  plugins: [
    // // clean the build folder
    //new CleanWebpackPlugin(),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin(["NODE_ENV"]),
    new CopyWebpackPlugin([
      {
        from: "src/manifest.json",
        transform: function (content, path) {
          console.log(`Updating manifest: ${path}`);
          // generates the manifest file using the package.json informations
          return Buffer.from(
            JSON.stringify({
              description: process.env.npm_package_description,
              version: process.env.npm_package_version,
              ...JSON.parse(content.toString()),
            })
          );
        },
      },
    ]),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "popup.html"),
      filename: "popup.html",
      chunks: ["popup"],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "options.html"),
      filename: "options.html",
      chunks: ["options"],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "background.html"),
      filename: "background.html",
      chunks: ["background"],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "devtools.html"),
      filename: "devtools.html",
      chunks: ["devtools"],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "panel.html"),
      filename: "panel.html",
      chunks: ["panel"],
    }),

    new WriteFilePlugin(),
  ],
};

if (env.NODE_ENV !== "production") {
  options.devtool = "cheap-module-eval-source-map";
}

module.exports = options;
