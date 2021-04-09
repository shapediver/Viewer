#!/bin/bash
VERSION=$(npm -v)
if [ $VERSION = '7.7.6' ]
then
    exit 0
else
    echo 'You need to switch to a different version (7.7.6, node 15.14.0) of npm to continue.'
    exit 1
fi