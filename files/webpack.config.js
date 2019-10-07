
const path = require('path');

function devtoolModuleFilenameTemplate(info)
{
	return info.absoluteResourcePath;
}

module.exports = {/*<<<!javascript*/
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },/*>>>*/
    resolve: {
        extensions: [/*<<<!javascript*/'.ts', /*>>>*/'.js']
    },
    mode: 'development',
    devtool: 'source-map',
    entry: {
        'server': './src/server/index.{{ext}}'/*<<<client*/,
        'client': './src/client/index.{{ext}}'/*>>>*/
    },
    output: {
        devtoolModuleFilenameTemplate,
        filename: '[name]/script.dist.js',
        path: path.resolve(__dirname, 'behavior_pack_link/scripts')
    }
};
