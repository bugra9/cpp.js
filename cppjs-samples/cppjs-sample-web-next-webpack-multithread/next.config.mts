import type { NextConfig } from "next";
import CppjsWebpackPlugin from '@cpp.js/plugin-webpack';



const cppjsWebpackPlugin = new CppjsWebpackPlugin();
const cppjsLoaderOptions = cppjsWebpackPlugin.getLoaderOptions();
const { state } = cppjsLoaderOptions;

const nextConfig: NextConfig = {

  /* config options here */

  // Required headers for SharedArrayBuffer (WebAssembly pthreads)
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },

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
