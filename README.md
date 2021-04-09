![logo](https://shapediver.com/imgs/logo-black.png "ShapeDiver")
# Viewer

This Repository is the main repository for the Shapediver Viewer.

The end product is the package `@shapediver/viewer` which is the api.
See the documentation on it [here](https://viewer.shapediver.com/v3/0.1.0/api/index.html).

The setup is built on `lerna` which is a package that is build for handling javascript monorepos. I extended some functionality and made created some further custom scripts for creating packages and building them. But trust me, there is no magic involved, mostly just creating a nice project setup.

## 1. Setup
### Node / NPM
You need to install a specific version of node (14.5.0) and npm (6.14.5). You can do this in any way you want to, but in the following steps we will explain how to do this with nvm.

First of all, download nvm ([windows](https://github.com/coreybutler/nvm-windows)/[unix](https://github.com/nvm-sh/nvm)/[mac](https://github.com/nvm-sh/nvm)).
Once installed, just use the commands

`nvm install 14.5.0`

and

`nvm use 14.5.0`

This will install node (14.5.0) and the corresponding npm version (6.14.5).

### GIT
Make sure to have GIT installed on your system.
Set the `script-shell` of npm to bash via

`npm config set script-shell "PATH\TO\Git\bin\bash.exe"`

### Installing

Just call `npm run init`

## 2. Creating Packages and Libraries

In the root of the project, call `npm run create-package`. You will be prompted to add a scope and a name. Inside this call a `lerna` command is executed first and then some smaller file changes are done after.
Your package name will be `@shapediver/viewer.SCOPE.NAME`. 

## 3. Bootstrapping

One great feature of `lerna` is bootstrapping. As we have multiple packages, the either rely on each other or have the same dependencies, installing the dependencies per package doesn't make sense. Also, bootstrapping checks for circular dependencies, which makes our life that much easier.

Therefore there are two scripts (one for normal dependencies, one for devDependencies) that use `lerna` and will make your life easier. I will just explain the script for normal dependencies, but the script for devDependencies works just the same. (just replace `add-dependency` with `add-devDependency` in the examples below)

### Example 1 - adding an external dependency

Let's say we want to add the package `three` to a specific package `a_package`.
Then the only thing we have to do is call `npm run add-dependency three @shapediver/viewer.test.a_package` in the root folder.
This installs the package in the root and links it to `a_package`.

In case you want `three` in all packages and libs you can call `npm run add-dependency three`.

### Example 2 - adding an internal dependency

Now I want to add `a_package` to `another_package` (both are part of this repository).
This works just similarly with `npm run add-dependency @shapediver/viewer.test.a_package @shapediver/viewer.test.another_package`.

## 4. Building

There are various build tasks for different scenarios in each package.

| Usage | Description |
| ------------- | ------------- |
| `npm run build` | Builds just the current package. (folder: `dist`) |
| `npm run build-current` | Builds all dependencies that are needed for the api package. (folder: `dist`) |
| `npm run build-dep` | Builds this package and all internal dependencies that it has before that. (folder: `dist`) |
| `npm run build-dev` | Builds this package and all internal dependencies with webpack and starts a http-server in watch mode. (folder: `dist-dev`, only for actual packages) |
| `npm run build-prod` | Builds this package and all internal dependencies with webpack and puts them into a single file.  (folder: `dist-prod`, only for actual packages) |

## 5. Testing

Call `npm run test` to test all packages or `npm run test` in a package to just test that single package.
Testing is configured via jest and should be fairly easy to use.

## 6. Publishing

Publishing can only be done for the whole repository at once, to keep the versioning simple. We publish to github packages, where you can see the all packages of the whole organization here: https://github.com/orgs/shapediver/packages
Naturally, please be smart with the naming of packages.

First, if you haven't already, create an access token on github. An explanation can be seen [here](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token). You need permissions for `repo`, `write:packages`, `read:packages` and `delete:packages`.

Then create on the root of this repository a `.npmrc` file, if there isn't one already and add the following.
```bash
//npm.pkg.github.com/:_authToken=TOKEN
registry=https://npm.pkg.github.com/shapediver
@shapediver:registry=https://npm.pkg.github.com/
```

Here just, replace `TOKEN` with you access token that you just created.

Afterwards, just call `npm run publish` and follow the prompts.

## 6. FAQ

- I add a dependency, but in the typescript file, it still shows me an error. What is up with that?

The VSCode typescript language server has some issues, just restart it or VSCode in general.