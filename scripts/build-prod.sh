WEBPACK_PATH=$1

rm -rf ./dist-prod
mkdir dist-prod
cp index.html dist-prod/index.html

echo ${WEBPACK_PATH}
if [ -n "$WEBPACK_PATH" ]
then
    webpack --config $WEBPACK_PATH --output-filename bundle.js --output-path dist-prod
else
    webpack --config ../../webpack.prod.js --output-filename bundle.js --output-path dist-prod
fi