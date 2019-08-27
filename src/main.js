import log from './logger';

// TODO: consolidate between import & require pls
const jQuery = require('jquery');
const Constants = require('./constants.js');
const VERTEX_SHADER_SOURCE = require('./shaders/vertexShader.glsl');
const FRAGMENT_SHADER_SOURCE = require('./shaders/fragmentShader.glsl');
const cubeBaseModel = require('../models/basicCube.js');
const Camera = require('./camera.js');
const keyBindings = require('./keybinds');

let shaderProgram;
let vertexPositionAttribute;
let textureCoordAttribute;

// Instance Variables:
let canvas;
let gl;
let windowWidth = 0; // The canvas size is initialized in index.html !!!
let windowHeight = 0;
let projectionMatrix = {};
const pressedKeys = {};

const models = [];

let textNode;

/**
 * Initializes our gl object.
 * @return N/A
 */
function initWebGL() {
  gl = null;

  try {
    gl = canvas.getContext(Constants.WEBGL_CANVAS_CONTEXT);
  } catch (e) {
    log(Constants.WEBGL_CREATION_ERR);
  }

  if (!gl) {
    alert(Constants.WEBGL_UNSUPPORTED_ERR); // eslint-disable-line
  }
}

function setMatrixUniforms() {
  const pUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(projectionMatrix.flatten()));


  const mvUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(Camera.GetViewMatrix()));
}

function handleKeyDown(event) {
  pressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
  pressedKeys[event.keyCode] = false;
}

/**
* initShaders initializes our GLSL, compiles it from source, and attaches it.
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

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw new Error('Unable to initialize the shader program!');
  }

  gl.useProgram(shaderProgram);

  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  gl.enableVertexAttribArray(vertexPositionAttribute);

  textureCoordAttribute = gl.getAttribLocation(shaderProgram, 'aTextureCoord');
  gl.enableVertexAttribArray(textureCoordAttribute);
}


function initBuffers() {
  let cubeCopy = {};
  cubeCopy = jQuery.extend(true, {}, cubeBaseModel);

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

  models.push(cubeCopy);
}

function makeCubes() { // eslint-disable-line
  for (let y = 1; y < 11; y++) { // We already draw a cube at index 0, so just start with a translation of 1.
    for (let i = 1; i < 11; i++) { // Therefore, looping 1 -> 11 makes  10 rows of cubes.
      let toAdd = {};
      toAdd = jQuery.extend(true, {}, models[0]);

      // Every THIRD item in the array will correspond to the same coordinate of the next vertex.
      // ie. [0] = vertex1.x, [1] = vertex1.y, [2] = vertex1.z, [3] = vertex2.x, [4] = vertex2.y, etc.
      for (let j = 0; j < models[0].vertices.length; j += 3) { // Shift cubes in the X direction
        toAdd.vertices[j] += i;
      }

      for (let j = 1; j < models[0].vertices.length; j += 3) { // Shift cubes in the Y direction
        toAdd.vertices[j] += y;
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

function Draw() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // eslint-disable-line

  for (let i = 0; i < models.length; i++) {
    // Bind the vertex, index, and texture coordinate data
    gl.bindBuffer(gl.ARRAY_BUFFER, models[i].vertexBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, models[i].textureCoordBuffer);
    gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, models[i].indexBuffer);
    setMatrixUniforms();

    // Bind the current texture data
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, models[i].textureBinding);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, 'uSampler'), 0);

    // Draw the model.
    gl.drawElements(gl.TRIANGLES, models[i].indices.length, gl.UNSIGNED_SHORT, 0);
  }
}

function Update() {
  Object.keys(pressedKeys).forEach((button) => {
    if (pressedKeys[button]) { // If the button was pressed...
      const action = keyBindings.getKeyBinding(button); // Get what action it does
      Camera.Action(action); // For now, just immediately pass commands to the camera.
    }
  });

  // Then draw the frame
  Camera.UpdateCamera();
  textNode.nodeValue = Camera.GetPositionString();
  Draw();

  // Rinse and repeat
  requestAnimationFrame(Update);
}

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
 * Loads any content we need, called once after we have ensured webGL is working.
 * @return N/A
 */
async function LoadContent() {
  // makePerspective => (out, FOV, Aspect Ratio, near Z index, far Z index);
  projectionMatrix = makePerspective(Constants.FIELD_OF_VIEW_ANGLE, // eslint-disable-line 
    windowWidth / windowHeight,
    Constants.NEAR_Z_INDEX,
    Constants.FAR_Z_INDEX);

  Camera.Initialize();

  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;

  await loadTextureForModel(models[0]);
}

/**
 * Entry point to our JS code. It is called at the very bottom of this script.
 * @return Promise (async)
 */
async function Start() {
  canvas = document.getElementById('glcanvas');

  // This is how we can overlay some text.
  const textElement = document.getElementById('overlayText1');
  textNode = document.createTextNode('');
  textElement.appendChild(textNode);

  windowWidth = canvas.width;
  windowHeight = canvas.height;
  initWebGL(canvas); // Initialize the GL context

  if (!gl) {
    log(Constants.WEBGL_UNSUPPORTED_ERR);
    return;
  }

  const clearColor = Constants.COLOR_CORNFLOWER_BLUE;
  gl.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things
  gl.enable(gl.CULL_FACE); // These two lines enable culling,
  gl.cullFace(gl.BACK); // and we set the mode to BACK face culling.

  initBuffers(); // For now, this creates our first cube.
  await LoadContent(); // Loads textures, etc. uses async/await.
  initShaders();

  makeCubes();

  requestAnimationFrame(Update);
}

document.addEventListener('DOMContentLoaded', () => {
  log('DOM fully loaded and parsed. Application starting...');
  Start();
});
