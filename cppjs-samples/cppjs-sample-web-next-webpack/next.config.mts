import type { NextConfig } from "next";
import CppjsWebpackPlugin from '@cpp.js/plugin-webpack';



const cppjsWebpackPlugin = new CppjsWebpackPlugin();
const cppjsLoaderOptions = cppjsWebpackPlugin.getLoaderOptions();
const { state } = cppjsLoaderOptions;

const nextConfig: NextConfig = {

  /* config options here */
  webpack: (config, { isServer, dev }) => {

    // Add the cpp.js webpack plugin
    config.plugins.push(cppjsWebpackPlugin);

    // Add the loader rule for .h files
    config.module.rules.push({
      test: /\.h$/,
      loader: '@cpp.js/plugin-webpack-loader',
      options: cppjsLoaderOptions,
    });
    return config;
  },
};

export default nextConfig;
