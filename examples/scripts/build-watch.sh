rm -rf ./dist-dev
mkdir dist-dev
cp index.html dist-dev/index.html 
webpack serve --config ../scripts/webpack.dev.js --output-filename bundle.js --output-path dist-dev --static dist-dev