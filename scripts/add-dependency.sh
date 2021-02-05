NAME1=$1
NAME2=$2

if [ -z "$NAME1" ]
then
    echo 'Please provide a valid name.'
    exit 1
fi

# dot separate

# @ shapediver
# utils / uuid

if [ -z "$NAME2" ]
then
    lerna add $NAME1
else
    lerna add $NAME1 $NAME2
fi