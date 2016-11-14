

var cubeVerticesBuffer;
var cubeVerticesTextureCoordBuffer;
var cubeVerticesIndexBuffer;
var cubeVerticesIndexBuffer;

var cubeImage;
var cubeTexture;

//var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexNormalAttribute;
var textureCoordAttribute;
var perspectiveMatrix;

//Instance Variables: 
var _canvas;
var _deltaTime = 0; //Used as a measure in changes in time between frames.
var _then = 0; //A time reference needed by _deltaTime.
var _gl;
var _windowWidth = 0; //The canvas size is initialized in index.html !!!
var _windowHeight = 0;

var _projectionMatrix = {};
var _worldMatrix = {};
var _viewMatrix = {};
var _viewRotationMatrix = {};
var _pressedKeys = {};
var indicesCount = 0;
var cubeCopy = {};

//Required dependencies
var Constants = require("./constants.js");
var VERTEX_SHADER_SOURCE = require("./shaders/vertexShader.glsl");
var FRAGMENT_SHADER_SOURCE = require("./shaders/fragmentShader.glsl");
var cubeBaseModel = require("../models/basicCube.js");
var Camera = require("./camera.js");
var jQuery = require("jquery");

/**
 * Entry point to our JS code. It is called at the very bottom of this script.
 * @return N/A
 */
function Start() {

  _canvas = document.getElementById("glcanvas");
  
  _windowWidth = _canvas.width;
  _windowHeight = _canvas.height;
  initWebGL(_canvas);      // Initialize the GL context

  if (_gl) {
    var clearColor = Constants.COLOR_CORNFLOWER_BLUE;
    _gl.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);  // Clear to black, fully opaque
    _gl.clearDepth(1.0);                 // Clear everything
    _gl.enable(_gl.DEPTH_TEST);           // Enable depth testing
    _gl.depthFunc(_gl.LEQUAL);            // Near things obscure far things
    _gl.enable(_gl.CULL_FACE); //These two lines enable culling, 
    _gl.cullFace(_gl.BACK); //and we set the mode to BACK face culling.

    initBuffers();
    LoadContent();
    initShaders();
    //initBuffers();

    //cubeTexture = createCubeTexture("Cool texture bro");
    requestAnimationFrame(Update);

  } else {
    console.log(Constants.WEBGL_UNSUPPORTED_ERR);
  }
}


/**
 * Loads any content we need, called once after we have ensured webGL is working.
 * @return N/A
 */
function LoadContent(){
  //makePerspective => (FOV, Aspect Ratio, near Z index, far Z index);
  _projectionMatrix = makePerspective(Constants.FIELD_OF_VIEW_ANGLE, _windowWidth / _windowHeight, Constants.NEAR_Z_INDEX, Constants.FAR_Z_INDEX);
  Camera.Initialize();
  initTextures();

  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
  return;
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
    console.log(Constants.WEBGL_CREATION_ERR);
  }

  if (!_gl) {
    alert(Constants.WEBGL_UNSUPPORTED_ERR);
  }
}


function initBuffers() {

  cubeCopy = jQuery.extend(true, {}, cubeBaseModel)
  //cubeCopy = Object.assign({}, cubeBaseModel);
  console.log("Creating copy");
  
  console.log("Assigned copy"); 
  for (var i = 0; i < cubeCopy.vertices.length; i++){
    cubeCopy.vertices[i] += 1;
  }
  console.log("cubeCopy: ");
  console.log(cubeCopy);

  console.log("Show original is unmodified:");
  console.log(cubeBaseModel);
  
  cubeVerticesBuffer = _gl.createBuffer();
  
  _gl.bindBuffer(_gl.ARRAY_BUFFER, cubeVerticesBuffer);
  _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(cubeCopy.vertices), _gl.STATIC_DRAW);

  
  cubeVerticesTextureCoordBuffer = _gl.createBuffer();
  _gl.bindBuffer(_gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);

  _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(cubeCopy.textureMap),
                _gl.STATIC_DRAW);


  cubeVerticesIndexBuffer = _gl.createBuffer();
  _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);

  _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(cubeCopy.indices), _gl.STATIC_DRAW);

  indicesCount = cubeCopy.indices.length;

  console.log("VERTS: " + cubeCopy.vertices.length);
  console.log("INDS: " + cubeCopy.indices.length);
  console.log("TEX COORDS: " + cubeCopy.textureMap.length);
}


function initTextures() {
  /*   IMPORTANT!!!
      Loading textures this way will NOT work if we just double click on index.html
      We need to run the simpleHttpServer to host the textures and then they will load.
      Alternatively, it MAY work in firefox. Untested.
  */ 
  cubeTexture = _gl.createTexture();
  cubeImage = new Image();
  

  //This is async... so let's wait for ALL textures to be completely loaded before drawing!
  cubeImage.onload = function() { handleTextureLoaded(cubeImage, cubeTexture); }
  cubeImage.src = cubeCopy.textureSourceFile; //"textures/crate.png";

}

function handleTextureLoaded(image, texture, callback) {
  _gl.bindTexture(_gl.TEXTURE_2D, texture);
  _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, image);
  _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
  _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR_MIPMAP_NEAREST);
  _gl.generateMipmap(_gl.TEXTURE_2D);
  _gl.bindTexture(_gl.TEXTURE_2D, null);

  _gl.activeTexture(_gl.TEXTURE0);
  _gl.bindTexture(_gl.TEXTURE_2D, texture);
  _gl.uniform1i(_gl.getUniformLocation(shaderProgram, "uSampler"), 0);
}

function Update(now) {
  now *= 0.001;
  _deltaTime = now - _then;
  _then = now;

  if (_pressedKeys[Constants.ASCII_UP]){
    Camera.RotateUp();
  }

  if (_pressedKeys[Constants.ASCII_DOWN]){
    Camera.RotateDown();
  }

  if (_pressedKeys[Constants.ASCII_LEFT]){
    Camera.RotateLeft();
  }

  if (_pressedKeys[Constants.ASCII_RIGHT]){
    Camera.RotateRight();
  }

  if (_pressedKeys[Constants.ASCII_W]){
    Camera.MoveForward();
  }

  if (_pressedKeys[Constants.ASCII_S]){
    Camera.MoveBackwards();
  }

  if (_pressedKeys[Constants.ASCII_A]){
    Camera.StrafeLeft();
  }
  
  if (_pressedKeys[Constants.ASCII_D]){
    Camera.StrafeRight();
  }

  if (_pressedKeys[Constants.ASCII_SPACE]){
    Camera.RaiseCamera();
  }

  if (_pressedKeys[Constants.ASCII_LSHIFT]){
    Camera.LowerCamera();
  }

  //Then draw the frame
  Camera.UpdateCamera();
  Draw();

  //Rinse and repeat
  requestAnimationFrame(Update);
}

function Draw(){
  _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
  
  _gl.bindBuffer(_gl.ARRAY_BUFFER, cubeVerticesBuffer);
  _gl.vertexAttribPointer(vertexPositionAttribute, 3, _gl.FLOAT, false, 0, 0);
  
  // Set the texture coordinates attribute for the vertices.
  
  _gl.bindBuffer(_gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
  _gl.vertexAttribPointer(textureCoordAttribute, 2, _gl.FLOAT, false, 0, 0);
  
  
  // Draw the cube.
  
  _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
  setMatrixUniforms();
 // _gl.drawElements(_gl.TRIANGLES, 36, _gl.UNSIGNED_SHORT, 0);

 //Number of INDICES.
 _gl.drawElements(_gl.TRIANGLES, indicesCount, _gl.UNSIGNED_SHORT, 0);
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {

/// NEW CODE:
  var vertexShader = _gl.createShader(_gl.VERTEX_SHADER);
  _gl.shaderSource(vertexShader, VERTEX_SHADER_SOURCE);
  _gl.compileShader(vertexShader);
  var fragmentShader = _gl.createShader(_gl.FRAGMENT_SHADER);
  _gl.shaderSource(fragmentShader, FRAGMENT_SHADER_SOURCE);
  _gl.compileShader(fragmentShader);

  // Create the shader program  
  shaderProgram = _gl.createProgram();
  _gl.attachShader(shaderProgram, vertexShader);
  _gl.attachShader(shaderProgram, fragmentShader);
  _gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  if (!_gl.getProgramParameter(shaderProgram, _gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }
  
  _gl.useProgram(shaderProgram);
  
  vertexPositionAttribute = _gl.getAttribLocation(shaderProgram, "aVertexPosition");
  _gl.enableVertexAttribArray(vertexPositionAttribute);
  
  textureCoordAttribute = _gl.getAttribLocation(shaderProgram, "aTextureCoord");
  _gl.enableVertexAttribArray(textureCoordAttribute);
  
}


function setMatrixUniforms() {
  var pUniform = _gl.getUniformLocation(shaderProgram, "uPMatrix");
  _gl.uniformMatrix4fv(pUniform, false, new Float32Array(_projectionMatrix.flatten()));


  var mvUniform = _gl.getUniformLocation(shaderProgram, "uMVMatrix");
  _gl.uniformMatrix4fv(mvUniform, false, new Float32Array(Camera.GetViewMatrix()));

}

function handleKeyDown(event){
  _pressedKeys[event.keyCode] = true;
  //console.log("Key: " + event.keyCode + " was pressed!!!");
}

function handleKeyUp(event){
  _pressedKeys[event.keyCode] = false;
}

document.addEventListener("DOMContentLoaded", function(event) {
  console.log("DOM fully loaded and parsed");
  Start();
});
