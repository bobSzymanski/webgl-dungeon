import log from './logger';

// TODO: consolidate between import & require pls
const Constants = require("./constants.js");
const VERTEX_SHADER_SOURCE = require("./shaders/vertexShader.glsl");
const FRAGMENT_SHADER_SOURCE = require("./shaders/fragmentShader.glsl");
const cubeBaseModel = require("../models/basicCube.js");
const Camera = require("./camera.js");
const jQuery = require("jquery");
const keyBindings = require('./keybinds');

let cubeVerticesBuffer;
let cubeVerticesTextureCoordBuffer;
let cubeVerticesIndexBuffer;

let cubeTexture;

let shaderProgram;
let vertexPositionAttribute;
let vertexNormalAttribute;
let textureCoordAttribute;
let perspectiveMatrix;

//Instance Variables: 
let _canvas;
let _deltaTime = 0; //Used as a measure in changes in time between frames.
let _then = 0; //A time reference needed by _deltaTime.
let _gl;
let _windowWidth = 0; //The canvas size is initialized in index.html !!!
let _windowHeight = 0;

let _projectionMatrix = {};
let _worldMatrix = {};
let _viewMatrix = {};
let _viewRotationMatrix = {};
let _pressedKeys = {};
let _actions = [];


let models = [];

let textNode;

/**
 * Entry point to our JS code. It is called at the very bottom of this script.
 * @return Promise (async)
 */
async function Start() {

  _canvas = document.getElementById("glcanvas");

  // This is how we can overlay some text.
  const textElement = document.getElementById("overlayText1");
  textNode = document.createTextNode("");
  textElement.appendChild(textNode);

  _windowWidth = _canvas.width;
  _windowHeight = _canvas.height;
  initWebGL(_canvas);      // Initialize the GL context

  if (!_gl) {
    log(Constants.WEBGL_UNSUPPORTED_ERR);
    return;
  }

  let clearColor = Constants.COLOR_CORNFLOWER_BLUE;
  _gl.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);  // Clear to black, fully opaque
  _gl.clearDepth(1.0);                  // Clear everything
  _gl.enable(_gl.DEPTH_TEST);           // Enable depth testing
  _gl.depthFunc(_gl.LEQUAL);            // Near things obscure far things
  _gl.enable(_gl.CULL_FACE); //These two lines enable culling, 
  _gl.cullFace(_gl.BACK); //and we set the mode to BACK face culling.

  initBuffers(); // For now, this creates our first cube.
  await LoadContent(); // Loads textures, etc. uses async/await.
  initShaders();

  makeCubes();

  requestAnimationFrame(Update);
}


/**
 * Loads any content we need, called once after we have ensured webGL is working.
 * @return N/A
 */
async function LoadContent() {
  
  // makePerspective => (FOV, Aspect Ratio, near Z index, far Z index);
  _projectionMatrix = makePerspective(Constants.FIELD_OF_VIEW_ANGLE,
    _windowWidth / _windowHeight,
    Constants.NEAR_Z_INDEX,
    Constants.FAR_Z_INDEX);

  Camera.Initialize();

  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;

  await loadTextureForModel(models[0]);
}

/**
 * Initializes our _gl object. 
 * @return N/A
 */
function initWebGL() {
  _gl = null;
  
  try {
    _gl = _canvas.getContext(Constants.WEBGL_CANVAS_CONTEXT);
  } catch(e) {
    log(Constants.WEBGL_CREATION_ERR);
  }

  if (!_gl) {
    alert(Constants.WEBGL_UNSUPPORTED_ERR);
  }
}

/**
* initShaders initializes our GLSL, compiles it from source, and attaches it.
* @return: N/A 
*/
function initShaders() {
  let vertexShader = _gl.createShader(_gl.VERTEX_SHADER);
  _gl.shaderSource(vertexShader, VERTEX_SHADER_SOURCE);
  _gl.compileShader(vertexShader);
  let fragmentShader = _gl.createShader(_gl.FRAGMENT_SHADER);
  _gl.shaderSource(fragmentShader, FRAGMENT_SHADER_SOURCE);
  _gl.compileShader(fragmentShader);

  // Create the shader program  
  shaderProgram = _gl.createProgram();
  _gl.attachShader(shaderProgram, vertexShader);
  _gl.attachShader(shaderProgram, fragmentShader);
  _gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  if (!_gl.getProgramParameter(shaderProgram, _gl.LINK_STATUS)) {
    throw new Error('Unable to initialize the shader program!');
  }
  
  _gl.useProgram(shaderProgram);
  
  vertexPositionAttribute = _gl.getAttribLocation(shaderProgram, "aVertexPosition");
  _gl.enableVertexAttribArray(vertexPositionAttribute);
  
  textureCoordAttribute = _gl.getAttribLocation(shaderProgram, "aTextureCoord");
  _gl.enableVertexAttribArray(textureCoordAttribute);
}


function initBuffers() {
  let cubeCopy = {};
  cubeCopy = jQuery.extend(true, {}, cubeBaseModel)

  //Now we translate the cube copy over by 1 coordinate in each direction.
  for (let i = 0; i < cubeCopy.vertices.length; i++) {
    cubeCopy.vertices[i] += 1;
  }
  
  cubeCopy.vertexBuffer = _gl.createBuffer();
  cubeCopy.indexBuffer = _gl.createBuffer();
  cubeCopy.textureCoordBuffer = _gl.createBuffer();
  
  _gl.bindBuffer(_gl.ARRAY_BUFFER, cubeCopy.vertexBuffer);
  _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(cubeCopy.vertices), _gl.STATIC_DRAW);

 
  _gl.bindBuffer(_gl.ARRAY_BUFFER, cubeCopy.textureCoordBuffer);
  _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(cubeCopy.textureMap),
                _gl.STATIC_DRAW);


  _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, cubeCopy.indexBuffer);
  _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(cubeCopy.indices), _gl.STATIC_DRAW);

  models.push(cubeCopy);
}
 
async function loadTextureForModel(model) {
  return new Promise((success, failure) => {
    model.textureBinding = _gl.createTexture();
    const img = new Image();
    img.onload = function() { // Always define onload func first, then set src property.
      handleTextureLoaded(img, model.textureBinding, model); 
      return success();
    }
    img.onerror = function() {
      log(`Error loading texture: ${img.src}`);
      return failure();
    }
    img.src = model.textureSourceFile;
  });
}

function makeCubes() {
  for (let y = 1; y < 11; y++) { // We already draw a cube at index 0, so just start with a translation of 1.
    for (let i = 1; i < 11; i++) { //Therefore, looping 1 -> 11 makes  10 rows of cubes.
      let toAdd = {};
      toAdd = jQuery.extend(true, {}, models[0]);

      //Every THIRD item in the array will correspond to the same coordinate of the next vertex.
      //ie. [0] = vertex1.x, [1] = vertex1.y, [2] = vertex1.z, [3] = vertex2.x, [4] = vertex2.y, etc.
      for (let j = 0; j < models[0].vertices.length; j+=3) { //Shift cubes in the X direction
        toAdd.vertices[j] += i; 
      }

      for (let j = 1; j < models[0].vertices.length; j+=3) { //Shift cubes in the Y direction
        toAdd.vertices[j] += y;
      }

      toAdd.vertexBuffer = _gl.createBuffer();
      toAdd.indexBuffer = _gl.createBuffer();
      toAdd.textureCoordBuffer = _gl.createBuffer();
      
      _gl.bindBuffer(_gl.ARRAY_BUFFER, toAdd.vertexBuffer);
      _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(toAdd.vertices), _gl.STATIC_DRAW);

     
      _gl.bindBuffer(_gl.ARRAY_BUFFER, toAdd.textureCoordBuffer);
      _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(toAdd.textureMap),
                    _gl.STATIC_DRAW);


      _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, toAdd.indexBuffer);
      _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(toAdd.indices), _gl.STATIC_DRAW);

      models.push(toAdd);
    }
  }
}

function handleTextureLoaded(image, texture, model, callback) {
  _gl.bindTexture(_gl.TEXTURE_2D, texture);
  _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, image);
  _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
  _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR_MIPMAP_NEAREST);
  _gl.generateMipmap(_gl.TEXTURE_2D);
  _gl.bindTexture(_gl.TEXTURE_2D, null);

  model.textureBinding = texture;
}

function Update() {
  Object.keys(_pressedKeys).forEach((button) => {
    if (_pressedKeys[button]) { // If the button was pressed...
      let action = keyBindings.getKeyBinding(button); // Get what action it does
      Camera.Action(action); // For now, just immediately pass commands to the camera.
    }
  })

  //Then draw the frame
  Camera.UpdateCamera();
  textNode.nodeValue = Camera.GetPositionString();
  Draw();

  //Rinse and repeat
  requestAnimationFrame(Update);
}

function Draw(){
  _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);

  for (let i = 0; i < models.length; i++){
    //Bind the vertex, index, and texture coordinate data
    _gl.bindBuffer(_gl.ARRAY_BUFFER, models[i].vertexBuffer);
    _gl.vertexAttribPointer(vertexPositionAttribute, 3, _gl.FLOAT, false, 0, 0);
    _gl.bindBuffer(_gl.ARRAY_BUFFER, models[i].textureCoordBuffer);
    _gl.vertexAttribPointer(textureCoordAttribute, 2, _gl.FLOAT, false, 0, 0);
    _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, models[i].indexBuffer);
    setMatrixUniforms();

    //Bind the current texture data
    _gl.activeTexture(_gl.TEXTURE0);
    _gl.bindTexture(_gl.TEXTURE_2D, models[i].textureBinding);
    _gl.uniform1i(_gl.getUniformLocation(shaderProgram, "uSampler"), 0);

    //Draw the model.
    _gl.drawElements(_gl.TRIANGLES, models[i].indices.length, _gl.UNSIGNED_SHORT, 0);
  }
 
}


function setMatrixUniforms() {
  let pUniform = _gl.getUniformLocation(shaderProgram, "uPMatrix");
  _gl.uniformMatrix4fv(pUniform, false, new Float32Array(_projectionMatrix.flatten()));


  let mvUniform = _gl.getUniformLocation(shaderProgram, "uMVMatrix");
  _gl.uniformMatrix4fv(mvUniform, false, new Float32Array(Camera.GetViewMatrix()));
}

function handleKeyDown(event){
  _pressedKeys[event.keyCode] = true;
}

function handleKeyUp(event){
  _pressedKeys[event.keyCode] = false;
}

document.addEventListener("DOMContentLoaded", function(event) {
  log("DOM fully loaded and parsed. Application starting...");
  Start();
});
