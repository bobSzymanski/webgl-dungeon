import jQuery from 'jquery';

import camera from './camera';
import constants from './constants';
import glMatrix from './extern/gl-matrix.js';
import keyBindings from'./keybinds';
import log from './logger';
import VERTEX_SHADER_SOURCE from './shaders/vertexShader.glsl';
import FRAGMENT_SHADER_SOURCE from './shaders/fragmentShader.glsl';
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
let windowWidth = default_width; // The canvas size is initialized in index.html !!!
let windowHeight = default_height;
let windowAspectRatio = default_aspect_ratio;
let projectionMatrix = glMatrix.mat4.create();
let projectionMatrixFlat;
const pressedKeys = {};

const models = [];

let textNode;

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

  setGLContext(); //  Initialize the GL context
  setGLContextHandlers(); // Add callbacks when GL context is lost or regained
  createBaseCubeVertexBuffers(); // For now, this creates our first cube.
  await LoadContent(); // Loads textures, etc. uses async/await.
  Update();
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

function setGLContextHandlers() {
  canvas.addEventListener('webglcontextlost', contextLost, false);
  canvas.addEventListener('webglcontextrestored', contextGained, false);
}

/**
 * Loads any content we need, called once after we have ensured webGL is working.
 * @return N/A
 */
async function LoadContent() {
  camera.Initialize();

  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;

  await loadTextureForModel(models[0]);

  makeCubes();

  // Create references to view and projection matrices in the glsl program
  pUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
  mvUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
}

/** setResolution ( number - width, number - height)
 * Call to change the resolution of the GL canvas. Also re-sets the GL context and updates the aspect ratio.
 * @return N/A
 */
function setResolution(width, height) {
  canvas.width = width;
  canvas.height = height;
  windowAspectRatio = width / height;
  setGLContext();
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
           models[0].translationVector[0] += 0.25;
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

/** loadTextureForModel:
 * loads the texture file as described in the model
 * @return N/A
 */
async function loadTextureForModel(model) {
  return new Promise((success, failure) => {
    Object.assign(model, { textureBinding: gl.createTexture() });
    const img = new Image();
    // Always define onload func first, then set src property.
    img.onload = function () { // eslint-disable-line
      handleTextureLoaded(img, model.textureBinding, model);
      return success();
    };

    img.onerror = function () { // eslint-disable-line
      log(`Error loading texture: ${img.src}`);
      return failure();
    };

    img.src = model.textureSourceFile;
  });
}

/**
 * Initializes our gl object.
 * @return N/A
 */
function initWebGL() {
  gl = null;

  try {
    gl = canvas.getContext(constants.config.WEBGL_CANVAS_CONTEXT);
    log(`Canvas dimensions: ${canvas.width}, ${canvas.height}`);
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

  initShaders();

  // makePerspective => (out, FOV, Aspect Ratio, near Z index, far Z index);
  projectionMatrix = makePerspective(default_FOV, // eslint-disable-line 
    windowAspectRatio,
    default_near_Z,
    default_far_z);

  projectionMatrixFlat = new Float32Array(projectionMatrix.flatten());
  gl_ex = gl.getExtension('WEBGL_lose_context'); // Prep for losing context.
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

/**
* initShaders initializes our GLSL, compiles it from source, and attaches it.
* Since we use webpack-glsl-loader, the GLSL source files can be imported just like any other JS file.
* @return: N/A
*/
function initShaders() {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, VERTEX_SHADER_SOURCE);
  gl.compileShader(vertexShader);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, FRAGMENT_SHADER_SOURCE);
  gl.compileShader(fragmentShader);

  // Create the shader program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  gl.validateProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) && !gl.isContextLost()) {
    throw new Error('Unable to initialize the shader program!');
  }

  // Check the state of the vertex and fragment shaders:
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    throw `Failed to compile vertex shader: ${gl.getShaderInfoLog(vertexShader)}`;
  }

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    throw `Failed to compile vertex shader: ${gl.getShaderInfoLog(fragmentShader)}`;
  }

  gl.useProgram(shaderProgram);

  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  gl.enableVertexAttribArray(vertexPositionAttribute);

  textureCoordAttribute = gl.getAttribLocation(shaderProgram, 'aTextureCoord');
  gl.enableVertexAttribArray(textureCoordAttribute);
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

function handleTextureLoaded(image, texture, model) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);

  Object.assign(model, { textureBinding: texture });
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
