rm -rf ./dist-dev
mkdir dist-dev
cp index.html dist-dev/index.html 
cp -r glTF-Sample-Models dist-dev/glTF-Sample-Models
webpack serve --config ../../webpack.dev.js --output-filename bundle.js --output-path dist-dev --content-base ./dist-dev