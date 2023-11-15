import jQuery from 'jquery';

import camera from './camera';
import constants from './constants';
import glMatrix from './extern/gl-matrix.js';
import keyBindings from'./keybinds';
import log from './logger';
import shaderHandler from './shaders/shaderHandler';
import textureHandler from './textures/textureHandler';
import cubeModels from '../models/basicCube.js';

const default_FOV = 70;
const default_near_Z = 0.1;
const default_far_z = 100;
const default_aspect_ratio = 800 / 600;
const default_width = 800;
const default_height = 600;

let requestId;
let shaderProgram;
let vertexPositionAttribute;
let vertexTranslationAttribute;
let textureCoordAttribute;
let gl_ex;
let pUniform, mvUniform;

// Instance Variables:
let canvas;
let gl;
let windowAspectRatio = default_aspect_ratio;
let projectionMatrix = glMatrix.mat4.create();
let projectionMatrixFlat;
const pressedKeys = {};

const models = [];

let textNode;


/* To follow the pattern from XNA, we do the following:

1) Initialize (Start)
2) LoadContent
3) Update
4) Draw

Every frame, we call Update, then Draw, just like XNA. That should occur every 1/60th of a second.
*/

/** Start ()
 * Entry point to our JS code. It is called at the very bottom of this script.
 * @return Promise (async)
 */
async function Start() {
  canvas = document.getElementById('glcanvas');
  initWebGL(canvas); // Create the GL object

  if (!gl) {
    log(constants.config.WEBGL_UNSUPPORTED_ERR);
    return;
  }

  setResolution(default_width, default_height); // Set up the canvas at the proper resolution.
  ({ shaderProgram, vertexPositionAttribute, textureCoordAttribute } = shaderHandler.initShaders(gl)); // Load & compile our shader programs
  setGLContext(); //  Initialize the GL context
  addCanvasEventListeners(); // Add event listeners to the canvas object.
  createBaseCubeVertexBuffers(); // For now, this creates our first cube.
  await LoadContent(); // Loads textures, etc. uses async/await.
  Update(); // Update Game logic
}

/**
 * Loads any content we need, called once after we have ensured webGL is working.
 * @return N/A
 */
async function LoadContent() {
  camera.Initialize();

  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;

  await textureHandler.loadTextureForModel(gl, models[0]);

  makeCubes();

  // Create references to view and projection matrices in the glsl program
  pUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
  mvUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
}

/** Update:
 * The main looped function of our program. Updates game logic, then draws the scene.
 * @return N/A
 */
function Update() {
  Object.keys(pressedKeys).forEach((button) => {
    if (pressedKeys[button]) { // If the button was pressed...
      const keybinding = keyBindings.getKeyBinding(button); // See if it has a keybinding...
      if (!keybinding) { return; } // If not - go to the next pressedKey.
      switch (keybinding.type) { // Do different things for diff keybinds
        case constants.config.CAMERA_ACTION:
          camera.Action(keybinding.name);
          break;
        case constants.config.GENERAL_KEYBINDING:
          // TODO: Something else here
          // "jitter" the cubes by adding and subtracting a random offset to all cubes X,Y,Z positions
           models.forEach(model => {
            model.translationVector[0] += Math.random();
            model.translationVector[1] += Math.random();
            model.translationVector[2] += Math.random();

            model.translationVector[0] -= Math.random();
            model.translationVector[1] -= Math.random();
            model.translationVector[2] -= Math.random();
          });
          break;
        default:
          break;
      }
    }
  });

  // Then draw the frame
  camera.UpdateCamera();
  textNode.nodeValue = camera.GetPositionString();
  Draw();

  // Rinse and repeat
  requestId = requestAnimationFrame(Update, canvas);
}

/** Draw:
 * Draws everything to the screen, called once per frame (approx 60fps)
 * @return N/A
 */
function Draw() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  setMatrixUniforms();

  // For each model, set the vertices, texture, etc, then draw them.
  for (let i = 0; i < models.length; i++) {
    // Bind the vertex, index, and texture coordinate data
    gl.bindBuffer(gl.ARRAY_BUFFER, models[i].vertexBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, models[i].textureCoordBuffer);
    gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, models[i].indexBuffer);

    // Pass translation vector to the shader:
    gl.uniform3f(gl.getUniformLocation(shaderProgram, 'aVertexTranslation'),
      models[i].translationVector[0],
      models[i].translationVector[1],
      models[i].translationVector[2]);

    // Bind the current texture data
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, models[i].textureBinding);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, 'uSampler'), 0);

    // Draw the model.
    gl.drawElements(gl.TRIANGLES, models[i].indices.length, gl.UNSIGNED_SHORT, 0);
  }
}

/** setResolution ( number - width, number - height)
 * Call to change the resolution of the GL canvas.
 * Also re-sets the GL viewport, updates the aspect ratio, and projection matrix.
 * @return N/A
 */
function setResolution(width, height) {
  canvas.width = width;
  canvas.height = height;
  windowAspectRatio = width / height;
  gl.viewport(0, 0, width, height);
  setupProjectionMatrix();
}

function contextLost(event) {
  log('Lost web context!');
  log(event);
  event.preventDefault();
  cancelAnimationFrame(requestId);
}

function contextGained(event) {
  log('Regained webgl context!');
  log(event);
  initWebGL();
  setGLContext();
}

function handleRightClick(event) {
  //button === 2 is from stack overflow, I'm guessing that refers to right-click being mouse button 2.
  if (event.button === 2) {
    e.preventDefault();
    return false;
  }
}

function addCanvasEventListeners() {
  canvas.addEventListener('webglcontextlost', contextLost, false);
  canvas.addEventListener('webglcontextrestored', contextGained, false);
  canvas.addEventListener('contextmenu', handleRightClick, false);
}

/**
 * Initializes our gl object.
 * @return N/A
 */
function initWebGL() {
  gl = null;

  try {
    gl = canvas.getContext(constants.config.WEBGL_CANVAS_CONTEXT);
    gl_ex = gl.getExtension('WEBGL_lose_context'); // Prep for losing context.
  } catch (e) {
    log(constants.config.WEBGL_CREATION_ERR);
  }

  if (!gl) {
    alert(constants.config.WEBGL_UNSUPPORTED_ERR); // eslint-disable-line
  }
}

function setGLContext() {
  gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
  const clearColor = constants.config.COLOR_CORNFLOWER_BLUE;
  gl.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things
  gl.enable(gl.CULL_FACE); // These two lines enable culling,
  gl.cullFace(gl.BACK); // and we set the mode to BACK face culling.
}

function setupProjectionMatrix() {
  // makePerspective => (out, FOV, Aspect Ratio, near Z index, far Z index);
  projectionMatrix = makePerspective(default_FOV, // eslint-disable-line 
    windowAspectRatio,
    default_near_Z,
    default_far_z);

  projectionMatrixFlat = new Float32Array(projectionMatrix.flatten());
}

function setMatrixUniforms() {
  // Set the projection, and then the view matrix.
  gl.uniformMatrix4fv(pUniform, false, projectionMatrixFlat);
  gl.uniformMatrix4fv(mvUniform, false, camera.GetViewMatrix());
}

function handleKeyDown(event) {
  pressedKeys[event.keyCode] = true;
  if (gl.isContextLost()) {
    gl_ex.restoreContext();
  }
}

function handleKeyUp(event) {
  pressedKeys[event.keyCode] = false;
}

function createBaseCubeVertexBuffers() {
  models.length = 0; // Neat way of emptying a const array reference.
  let cubeCopy = {};
  cubeCopy = jQuery.extend(true, {}, cubeModels.baseCube);

  // Now we translate the cube copy over by 1 coordinate in each direction.
  for (let i = 0; i < cubeCopy.vertices.length; i++) {
    cubeCopy.vertices[i] += 1;
  }

  cubeCopy.vertexBuffer = gl.createBuffer();
  cubeCopy.indexBuffer = gl.createBuffer();
  cubeCopy.textureCoordBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeCopy.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeCopy.vertices), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeCopy.textureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeCopy.textureMap),
    gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeCopy.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(cubeCopy.indices), gl.STATIC_DRAW);

  cubeCopy.translationVector = glMatrix.vec3.fromValues(0, 0, 0);

  models.push(cubeCopy);
}

function makeCubes() { // eslint-disable-line
  for (let y = 1; y < 11; y++) { // We already draw a cube at index 0, so just start with a translation of 1.
    for (let i = 1; i < 11; i++) { // Therefore, looping 1 -> 11 makes  10 rows of cubes.
      let toAdd = {};
      const randomOffset = Math.floor(Math.random() * 5); // Make each cube have a random height offset. 
      toAdd = jQuery.extend(true, {}, models[0]);

      // Every THIRD item in the array will correspond to the same coordinate of the next vertex.
      // ie. [0] = vertex1.x, [1] = vertex1.y, [2] = vertex1.z, [3] = vertex2.x, [4] = vertex2.y, etc.
      for (let j = 0; j < models[0].vertices.length; j += 3) { // Shift cubes in the X direction
        toAdd.vertices[j] += i;
      }

      for (let j = 1; j < models[0].vertices.length; j += 3) { // Shift cubes in the Y direction
        toAdd.vertices[j] += y;
      }

      for (let j = 2; j < models[0].vertices.length; j += 3) { // Shift cubes in the Z direction, randomly
        toAdd.vertices[j] += randomOffset;
      }

      toAdd.vertexBuffer = gl.createBuffer();
      toAdd.indexBuffer = gl.createBuffer();
      toAdd.textureCoordBuffer = gl.createBuffer();

      gl.bindBuffer(gl.ARRAY_BUFFER, toAdd.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(toAdd.vertices), gl.STATIC_DRAW);


      gl.bindBuffer(gl.ARRAY_BUFFER, toAdd.textureCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(toAdd.textureMap),
        gl.STATIC_DRAW);


      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, toAdd.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(toAdd.indices), gl.STATIC_DRAW);

      toAdd.translationVector = glMatrix.vec3.fromValues(0, 0, 0);

      models.push(toAdd);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  log('DOM fully loaded and parsed. Application starting...');

  // This is how we can overlay some text.
  const textElement = document.getElementById('overlayText1');
  textNode = document.createTextNode('');
  textElement.appendChild(textNode);

  // Now start our game.
  Start();
});
