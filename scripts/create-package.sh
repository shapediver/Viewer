#!/bin/bash
echo 'Package name:'
read NAME
echo 'Scope name:'
read SCOPE

PACKAGE_PATH='./'$SCOPE'/'$NAME'/'
echo 'Trying to create package "'$NAME'" at "'$PACKAGE_PATH'"...'

if [ -d $PACKAGE_PATH ]
then
    echo 'The path for this package already exists.'
    exit 1
fi

SCOPES=$(json -f 'lerna.json' packages)
if [[ $SCOPES != *"\""$SCOPE"/*\""* ]]
then
    json -q -I -f 'lerna.json' -e 'this.packages[this.packages.length]="'$SCOPE'/*"'
fi

lerna create $NAME $SCOPE --description "" --yes

# add an empty index.ts
mkdir -p $PACKAGE_PATH'/src/'
cd $PACKAGE_PATH'/src/'
touch index.ts
cd ../../..

cd $PACKAGE_PATH
rm -r 'lib'
cd ../..

cd $PACKAGE_PATH'/__tests__/'
rm $NAME'.test.js'
touch $NAME'.test.ts'
cd ../../..

# copy tsconfig and index.html
cp './scripts/utils/tsconfig.json' $PACKAGE_PATH
cp './scripts/utils/index.html' $PACKAGE_PATH

# adjust package.json
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.name="@shapediver/viewer.'$SCOPE.$NAME'"'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.description=""'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.license="polyform-noncommercial-1.0.0"'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.main="dist/index.js"'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.typings="dist/index.d.ts"'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.files=["dist"]'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.scripts.check="tsc --noEmit"'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.scripts.build="bash ../../scripts/build.sh"'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.scripts["build-dep"]="bash ../../scripts/build-dep.sh"'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.scripts["build-dev"]="bash ../../scripts/build-dev.sh"'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.scripts["build-prod"]="bash ../../scripts/build-prod.sh"'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.scripts.test="bash ../../scripts/test.sh"'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.jest={}'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.jest.preset="ts-jest"'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.jest.testEnvironment="node"'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.devDependencies={}'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.directories={}'
json -q -I -f $PACKAGE_PATH'package.json' -e 'this.directories.test="__tests__"'

npm run bootstrap
echo 'package "'$NAME'" successfully created!'