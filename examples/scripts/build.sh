WEBPACK_PATH=$1

rm -rf ./dist
mkdir dist
cp index.html dist/index.html

echo ${WEBPACK_PATH}
if [ -n "$WEBPACK_PATH" ]
then
    webpack --config $WEBPACK_PATH --output-filename bundle.js --output-path dist
else
    webpack --config ../scripts/webpack.prod.js --output-filename bundle.js --output-path dist
fi