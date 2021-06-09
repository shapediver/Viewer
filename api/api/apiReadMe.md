
<script defer src="https://viewer.shapediver.com/v3/0.1.0/bundle.js"></script>

![logo](https://shapediver.com/imgs/logo-black.png "ShapeDiver")
# Viewer API
## Installation
<details>

### NPM installations

First of all, you need to have a version of `npm` installed. We currently use version `7.7.6`, but any newer version should be fine.

Then, let's call some `npm` tasks and install some dependencies. Go to an empty folder that you want to use and call these commands. Some might not be necessary for you if you are integrating the viewer into an existing setup.

This command just initializes `npm` for this project and creates the `package.json` file that is needed.
```bash
npm init --yes
```

Then we install some development dependencies. The first one is `typescript`, as we are using TypeScript in this example, we also have to install the dependency for it.
The next three are all dependencies for webpack, we get to that later on.
```bash
npm install --save-dev typescript webpack webpack-cli ts-loader
```

Then, we install the actual viewer dependency.
```bash
npm install --save @shapediver/viewer
```

### Adjusting Config Files

First, we create a file called `tsconfig.json` in the root of the project and add this content to it.
```json
{
    "compilerOptions": {
        "outDir": "./dist/",
        "module": "es6",
        "target": "es2015",
        "moduleResolution": "node"
    }
}
```

Then, we create a `webpack.config.js` file in the root of the directory and again, add some content to it. Here the package `ts-loader` is used, as webpack normally doesn't work with TypeScript files.
```javascript
const path = require('path');

module.exports = {
  entry: './src/index.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
```

### The First Example
Let's now create our first example. For that we first need an HTML-Page on which we want to load our example. Therefore, we create an `index.html` file in the root of our project:
```html
<!DOCTYPE html>
<html style="height: 100%">

<head>
    <title>ShapeDiver</title>
</head>

<body style="margin: 0px; overflow-y: hidden; height: 100%">
    <div style="width: 100%; height: 100%;">
        <canvas id="canvas" style="display: block"></canvas>
    </div>
    <script type="module" src="./dist/bundle.js"></script>
</body>

</html>
```
This HTML-File only has a canvas in it and a script tag that will load our script once it is built.

Now we create a `scr`-folder and add an `index.ts` file in it with the following contents:
```typescript
import "reflect-metadata"
import { api } from "@shapediver/viewer"

const modelViewUrl = ''; // PLEASE ADD YOUR MODEL VIEW URL HERE
const ticket = ''; // PLEASE ADD YOUR TICKET HERE

(async () => {
    await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas') })
    await api.createAndInitializeSession({ ticket, modelViewUrl });
})();
```
This is already everything we need. We import `reflect-metadata` as this is need for some functionalities that we use. It should always be on top of the imports. Then we import the api from the viewer.

Next we load a viewer by providing a canvas (we created one in the `index.html`) and then we load a session. Please note that you have to provide the necessary properties yourself here. See the comments in the example.

### Build

Now that we finished our example, we only need to build it to try it out. In our `package.json` we just need to add a small script for that. Currently there is only a `test` script in there, we now add a `build` script to make it look like this:
```json
"scripts": {
  "build": "webpack",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

With this we now call the build command `npm run build` and see that a `dist` folder was created automatically.

We are now done!

To try this out, just create a simple [http-server](https://www.npmjs.com/package/http-server) in this folder and load the `index.html`.

</details>

## Simple Examples
<details>

### The first Session and Viewer
Let's look at an easy example to set up a session with a viewer.
This, and accessing the scene tree is the purpose of the main {@link Api}.

```typescript
import "reflect-metadata"
import { api, RENDERERTYPE } from "@shapediver/viewer"

// From the api let's create a session with a ticket and a modelview url
const session = await api.createAndInitializeSession({ ticket: 'MY_TICKET', modelViewUrl: 'MY_MODELVIEW_URL', id: 'mySession'});

// From the api let's also create a viewer on our canvas
const viewer = await api.createAndInitializeViewer({ canvas: CANVAS, id: 'myViewer' });
```

That's it, with that we have loaded a session and created a viewer on a canvas.

### Adjusting Parameters and requesting Exports

Adjusting parameters and requesting exports is basically just as easy. The {@link Session} part of our API is responsible for that. Let's assume we did the setup exactly as above and continue from there.
```typescript
// Get a parameter with a specific ID
// Note: It is also easily possible to get the parameter by name, type or any other desired criteria.
const parameter = session.getParameterById('SOME_ID');

// To change the value of this parameter we can simply just change it (setter method takes care of checking if the value is approved)
parameter.updateValue('newValue')

// Get an export with a specific ID
// Note: It is also easily possible to get the export by name, type or any other desired criteria.
const export = session.getExport('SOME_ID');

// Get the export
await export.request();
```

### Adjusting the Scene

As in the above example we assume the simple initial setup was done already.
Now, let's change the camera via the {@link Viewer} API part.
```typescript
// Create a new camera
const camera = viewer.createPerspectiveCamera('myNewCamera')

// Change a value in the camera
camera.fov = 30;

// Assign the camera as the main camera
viewer.assignCamera(camera);
```
Also, let's add a light.
```typescript
// Create a new light
const ambientLight = viewer.addAmbientLight({ color: [1,1,1],  intensity: 0.5 });

// Change a value of the light
ambientLight.intensity = 0.1;
```
That's it. Easy as that.

</details>


## The Scene tree

<details>
We now have our own scene tree in which sessions store their computed outputs, but you can also create, adjust and remove parts of the scene tree yourself.

The scene tree is a tree structure with a single root node. Every node can have any number of children and data items. The data items contain the actual information, whereas the nodes are only used to maintain and manage the hierarchy.
Data items can simply be changed and adjusted. Only the version of the data item has to be updated to notify the renderer that a change has happened.

### Basic Setup

Before we do anything, the scene tree has already been created. There is nothing in it besides the root node.

![Example](./images/sceneGraph_1.png)

So let's just look at how the scene tree looks after we create a single session.

```typescript
// From the api let's create a session with a ticket and a modelview url
const session = await api.createAndInitializeSession({ ticket: 'MY_TICKET', modelViewUrl: 'MY_MODELVIEW_URL', id: 'mySession'})
```
With this call, our scene tree now change as a node was added automatically. Let's assume, the session has two outputs with one content each. Then the scene tree will look like this:

![Example](./images/sceneGraph_2.png)

### Updating a Session

If we follow our example above and update our session by changing a parameter, outputs that are connected to that parameter are changed. 
So the following code 

```typescript
// Get a parameter with a specific ID
const parameter = session.getParameterById('SOME_ID');

// To change the value of this parameter we can simply just change it (setter method takes care of checking if the value is approved)
parameter.updateValue('newValue')
```
![Example](./images/1.png)

Results in these updated nodes in the scene tree.

![Example](./images/sceneGraph_3.png)

### Manipulating the Scene tree

Let's now continue with the example and first of all change all colors of all material data to red.
```typescript
// We first need the scene tree
const sceneTree = api.sceneTree;

// Let's create a little helper function to make things easier
const changeColor = (node: TreeNode) => {
  // We go through all SceneTreeData elements of the current node and change the color if it is a SceneTreeMaterialData
  for(let i = 0; i < node.data.length; i++)
    if(node.data[i] instanceof TreeNodeData && node.data[i].color)
      node.data[i].color = 'red';

  // Recursively we do the same for all children of the node
  for(let i = 0; i < node.children.length; i++)
    changeColor(node.children[i])
}

// Now we just have to call the function with the scene tree root
changeColor(sceneTree.root)
```
![Example](./images/2.png)

### Copying Nodes
Now this results in all geometry being red. If we would customize the scene again, every output that is loaded again would be overwritten.
Therefore, we now save our session node by copying it.

```typescript

// We first need the scene tree
const sceneTree = api.sceneTree;

// Then we just get to the right node and copy it
const clonedNode = sceneTree.children[0].clone()
```

### Adjusting the Scene tree
Let's now customize the scene again and then add our copied node with some translation.

```typescript
// Get a parameter with a specific ID
const parameter = session.getParameterById('SOME_ID');

// To change the value of this parameter we can simply just change it (setter method takes care of checking if the value is approved)
parameter.updateValue('newValue')

// Customize the session
await session.customize();

// Translate the cloned node
clonedNode.transformations.push(TRANSLATION_MATRIX);

// Add the node to the scene
sceneTree.addChild(clonedNode);
```

![Example](./images/3.png)

The result is now that we have the geometry two times, once in the old configuration with all material being red, and once in the new configuration.

![Example](./images/sceneGraph_4.png)
### Adding Custom Data
It is now also very easy to add any data to the scene tree that you want.
Let's just add a complete three.js object to it via the corresponding data item.

```typescript
// Create some three.js geometry
const sphere = new THREE.Mesh(new THREE.SphereGeometry(), new THREE.MeshStandardMaterial());

// Create an Object3D for the data item
const obj3D =  new THREE.Object3D();
obj3D.add(sphere);

// Create a new node
const node = new TreeNode();

// Create a new data item
const data = new TreeNodeThreejsData(obj3D);
node.data.push(data);

// Add the node to the scene tree
sceneTree.addChild(node);
```

This adds a node in the root right next to the session nodes. Therefore, session updates don't concern this node.
(It is also possible to add this node at any level of the session nodes.)

</details>

## Advanced sessions

<details>

The management of sessions is now much easier then before. Not only can multiple different sessions be created, also the same session can be created multiple times.

### Creating multiple sessions
Let's create three different sessions.

```typescript
// From the api let's create the first session
const session1 = api.createAndInitializeSession({ ticket: 'MY_TICKET1', modelViewUrl: 'MY_MODELVIEW_URL1', id: 'mySession1'})

// Also the second
const session2 = api.createAndInitializeSession({ ticket: 'MY_TICKET2', modelViewUrl: 'MY_MODELVIEW_URL2', id: 'mySession2'})

// And the third
const session3 = api.createAndInitializeSession({ ticket: 'MY_TICKET3', modelViewUrl: 'MY_MODELVIEW_URL3', id: 'mySession3'})

// Now just wait for all of them to load 
await Promise.all([ session1, session2, session3 ]);
```

Yes, it is really as easy as that. 
Our scene tree now looks like this

![Example](./images/sceneGraph_5.png)

### Creating a duplicate session
It is also possible to create the same session multiple times.

```typescript
// From the api let's create the first session
const session = api.createAndInitializeSession({ ticket: 'MY_TICKET', modelViewUrl: 'MY_MODELVIEW_URL', id: 'mySession1'})

// Also the second
const sameSession = api.createAndInitializeSession({ ticket: 'MY_TICKET', modelViewUrl: 'MY_MODELVIEW_URL', id: 'mySession2'})

// Now just wait for all of them to load 
await Promise.all([ session, sameSession ]);
```

This just works as it would be two independent sessions.
</details>

<!--- VERSION_START -->
## Version
* __Version:__ 3.0.2.58
* __Build date:__ 2021-06-02T12:14:01.222Z
* __Branch:__ development
* __Commit:__ b5d63ffa501c8ce5a03f7d387f740147bb80219c
<!--- VERSION_END -->