# AR

Getting AR into your ShapeDiver-Viewer only requires two additional calls. One checks if the device supports AR, the other one opens the scene in AR.

Our integrated AR functionality only works on Android devices using Chrome, and iOS devices using Safari. You can check if the user is currently on one of these devices like this:

```
try {
    const check = api.viewableInAR();
} catch(e) {
    // the error tells you why it is not possible, no error -> no problem
}
```

Once you made sure that the device supports AR, simply call `api.viewInAR()`.

You can also see the [CodePen](https://codepen.io/ShapeDiver/pen/3b9d8050a14afd396df07e7b77bc8c5f).