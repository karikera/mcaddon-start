
const path = require('path');

function devtoolModuleFilenameTemplate(info)
{
	return info.absoluteResourcePath;
}

module.exports = {
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    externals: {
        'original-fs': 'fs'
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    mode: 'development',
    devtool: 'source-map',
    entry: {
        'server': './src/server/index.ts',
        // 'client': './src/client/index.ts'
    },
    output: {
        devtoolModuleFilenameTemplate,
        filename: '[name]/script.dist.js',
        path: path.resolve(__dirname, 'outlink/scripts')
    }
};
