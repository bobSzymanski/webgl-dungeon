# webgl-dungeon

### What is this I just found it here
- I am [VERY SLOWLY] working on a 3D dungeon crawler that uses WebGL to draw simple mazes where you battle monsters and stuff.

- I started working on this in early November 2016 while I was on vacation and I knew I wanted to port my dungeon crawler code from C++ / DirectX over to webGL because javascript is pretty cool and the web is a pretty interesting platform. I tend to pick this up every couple of months when I think it could use some new features or cleaning up. It should be suitable for a very barebones webGL demo.

- As of Jan 2025 this project is finally further along in JS than it ever was in C++, C#, etc. Yay!

### How to

Assuming you already have a working nodejs environment.. I recommend using node version manager (nvm) and following the node version in this project.
Then to install dependencies, run:
- `npm install`

Then to run the application:
- `npm run build`
- `npm run start`
- navigate to `localhost:8080`

If you are on Windows:
- `npm run win`
- navigate to `localhost:8080`

Current default controls are WASD + Arrow keys.
Press Space to raise the camera.
Press Left Shift to lower the camera.
Use the mouse to look around in the environment.
The arrow keys can be used to look around in place of the mouse.

## Codebase
- Javascript, using the latest LTS version as of Jan 2025
- Webpack is used to build
- WebGL works in newer and decent modern browsers like chrome and firefox. Edge maybe in the future.
- I started using the example [here](http://www.sw-engineering-candies.com/snippets/webgl/hello-world) but there was a ton I needed to change to even get started.
- This started out really crappy but is getting better. The demo runs smoothly on a 2014 Macbook, which is 11 years old as of writing this.
- Firefox seems to have a significant speed advantage over Google Chrome on older systems.

## Disclaimers
- All code and assets are for use at your own risk.
- Regarding cookies: I have implemented a very crude implementation of cookie consent, so that this application can use cookies only after prompting the user. Do not take this as the basis to implement your own cookie consent, nor can I fully guarantee this implementation complies with local cookie consent laws. Do not collect cookies using this code for any purposes other than maintaining game / game engine state (i.e. player save files, player controls, player game preferences, etc). Cookies should always be set to "Strict" and "Secure" cookies, such that they are only included over HTTPS, and to help prevent CSRF.
