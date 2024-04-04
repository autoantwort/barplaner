const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const path = require('path');

module.exports = {
    devServer: {
        port: 4200
    },
    configureWebpack: {
        //plugins: [new BundleAnalyzerPlugin()]
        resolve: {
            alias: {
                'common': path.resolve(__dirname, '../common'), // Alias for the components directory
            }
        },
    },
};