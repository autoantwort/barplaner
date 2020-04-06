const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
    .BundleAnalyzerPlugin;
module.exports = {
    devServer: {
        port: 4200
    },
    /*configureWebpack: {
        plugins: [new BundleAnalyzerPlugin()]
    },*/
};