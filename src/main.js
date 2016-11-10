

var cubeVerticesBuffer;
var cubeVerticesTextureCoordBuffer;
var cubeVerticesIndexBuffer;
var cubeVerticesIndexBuffer;
var cubeRotation = 0.0;
var lastCubeUpdateTime = 0;

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

//Required dependencies
var Constants = require("./constants.js");
var VERTEX_SHADER_SOURCE = require("./shaders/vertexShader.glsl");
var FRAGMENT_SHADER_SOURCE = require("./shaders/fragmentShader.glsl");
var Camera = require("./camera.js");

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

    LoadContent();
    initShaders();
    initBuffers();
    

    cubeTexture = createCubeTexture("Cool texture bro");
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

/**
 * Initializes vertex, index, texture, and normal coordinate buffers.
 * This function may be deprecated once the cube demo is completely removed.
 * @return N/A
 */
function initBuffers() {
  
  // Create a buffer for the cube's vertices.
  cubeVerticesBuffer = _gl.createBuffer();
  
  // Select the cubeVerticesBuffer as the one to apply vertex
  // operations to from here out.
  _gl.bindBuffer(_gl.ARRAY_BUFFER, cubeVerticesBuffer);
  
  // Now create an array of vertices for the cube.
  
  var vertices = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,
    
    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,
    
    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,
    
    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,
    
    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,
    
    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0
  ];
  
  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.
  
  _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(vertices), _gl.STATIC_DRAW);

  // Set up the normals for the vertices, so that we can compute lighting.
  
  cubeVerticesNormalBuffer = _gl.createBuffer();
  _gl.bindBuffer(_gl.ARRAY_BUFFER, cubeVerticesNormalBuffer);
  
  var vertexNormals = [
    // Front
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
    
    // Back
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
    
    // Top
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
    
    // Bottom
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
    
    // Right
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
    
    // Left
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0
  ];
  
  _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
                _gl.STATIC_DRAW);
  
  // Map the texture onto the cube's faces.
  
  cubeVerticesTextureCoordBuffer = _gl.createBuffer();
  _gl.bindBuffer(_gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
  
  var textureCoordinates = [
    // Front
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Back
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Top
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Bottom
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Right
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Left
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0
  ];

  _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                _gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.
  
  cubeVerticesIndexBuffer = _gl.createBuffer();
  _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
  
  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.
  
  var cubeVertexIndices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23    // left
  ]
  
  // Now send the element array to GL
  
  _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(cubeVertexIndices), _gl.STATIC_DRAW);
}

//
// initTextures
//
// Initialize the textures we'll be using, then initiate a load of
// the texture images. The handleTextureLoaded() callback will finish
// the job; it gets called each time a texture finishes loading.
//
// TODO#1 Start
function createCubeTexture(text) {
                
    // create a hidden canvas to draw the texture 
    var canvas = document.createElement('canvas');
    canvas.id     = "hiddenCanvas";
    canvas.width  = 512;
    canvas.height = 512;
    canvas.style.display   = "none";
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(canvas);        

    // draw texture
    var cubeImage = document.getElementById('hiddenCanvas');
    var ctx = cubeImage.getContext('2d');
    ctx.beginPath();
    ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);            
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.font = "65px Arial";
    ctx.textAlign = 'center';            
    ctx.fillText(text, ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.restore();        

    // create new texture
    var texture = _gl.createTexture();
    _gl.bindTexture(_gl.TEXTURE_2D, texture);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR_MIPMAP_NEAREST);
    _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);
    handleTextureLoaded(cubeImage, texture) 
    
    return texture;
}
 
function handleTextureLoaded(image, texture) {
  _gl.bindTexture(_gl.TEXTURE_2D, texture);
  _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, image);
  _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
  _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR_MIPMAP_NEAREST);
  _gl.generateMipmap(_gl.TEXTURE_2D);
  _gl.bindTexture(_gl.TEXTURE_2D, null);
}

function Update(now) {
  now *= 0.001;
  _deltaTime = now - _then;
  _then = now;

  //Update logic here.

  //Then draw the frame
  Draw();

  //Rinse and repeat
  requestAnimationFrame(Update);
}

function Draw(){
  _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
  
  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  //loadIdentity();
  
  // Now move the drawing position a bit to where we want to start
  // drawing the cube.
  
  //mvTranslate([0.0, 0.0, -6.0]);
  
  // Save the current matrix, then rotate before we draw.
  
  //mvPushMatrix();
  //mvRotate(cubeRotation, [1, 0, 1]);

  Camera.Rotate(cubeRotation, [1, 0, 0]);
  
  // Draw the cube by binding the array buffer to the cube's vertices
  // array, setting attributes, and pushing it to _gl.
  
  _gl.bindBuffer(_gl.ARRAY_BUFFER, cubeVerticesBuffer);
  _gl.vertexAttribPointer(vertexPositionAttribute, 3, _gl.FLOAT, false, 0, 0);
  
  // Set the texture coordinates attribute for the vertices.
  
  _gl.bindBuffer(_gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
  _gl.vertexAttribPointer(textureCoordAttribute, 2, _gl.FLOAT, false, 0, 0);
  
  // Bind the normals buffer to the shader attribute.
  
  _gl.bindBuffer(_gl.ARRAY_BUFFER, cubeVerticesNormalBuffer);
  _gl.vertexAttribPointer(vertexNormalAttribute, 3, _gl.FLOAT, false, 0, 0);
  
  // Specify the texture to map onto the faces.
  
  _gl.activeTexture(_gl.TEXTURE0);
  _gl.bindTexture(_gl.TEXTURE_2D, cubeTexture);
  _gl.uniform1i(_gl.getUniformLocation(shaderProgram, "uSampler"), 0);
  
  // Draw the cube.
  
  _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
  setMatrixUniforms();
  _gl.drawElements(_gl.TRIANGLES, 36, _gl.UNSIGNED_SHORT, 0);
  
  // Restore the original matrix
  //mvPopMatrix();
  
  // Update the rotation for the next draw.
  cubeRotation = (30 * _deltaTime); 

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

  //var fragmentShader = getShader(gl, "shader-fs");
  //var vertexShader = getShader(gl, "shader-vs");
  
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
  
  vertexNormalAttribute = _gl.getAttribLocation(shaderProgram, "aVertexNormal");
  _gl.enableVertexAttribArray(vertexNormalAttribute);
}


//
// Matrix utility functions
//

// function loadIdentity() {
//   mvMatrix = Matrix.I(4);
// }

// function multMatrix(m) {
//   mvMatrix = mvMatrix.x(m);
// }

// function mvTranslate(v) {
//   multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
// }

function setMatrixUniforms() {
  var pUniform = _gl.getUniformLocation(shaderProgram, "uPMatrix");
  _gl.uniformMatrix4fv(pUniform, false, new Float32Array(_projectionMatrix.flatten()));

  var mvUniform = _gl.getUniformLocation(shaderProgram, "uMVMatrix");
  _gl.uniformMatrix4fv(mvUniform, false, new Float32Array(Camera.GetViewMatrix().flatten()));
  
  var normalMatrix = Camera.GetViewMatrix().inverse();
  normalMatrix = normalMatrix.transpose();
  var nUniform = _gl.getUniformLocation(shaderProgram, "uNormalMatrix");
  _gl.uniformMatrix4fv(nUniform, false, new Float32Array(normalMatrix.flatten()));
}

// var mvMatrixStack = [];

// function mvPushMatrix(m) {
//   if (m) {
//     mvMatrixStack.push(m.dup());
//     mvMatrix = m.dup();
//   } else {
//     mvMatrixStack.push(mvMatrix.dup());
//   }
// }

// function mvPopMatrix() {
//   if (!mvMatrixStack.length) {
//     throw("Can't pop from an empty matrix stack.");
//   }
  
//   mvMatrix = mvMatrixStack.pop();
//   return mvMatrix;
// }

// function mvRotate(angle, v) {
//   var inRadians = angle * Math.PI / 180.0;
  
//   var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
//   multMatrix(m);
// }

document.addEventListener("DOMContentLoaded", function(event) {
  console.log("DOM fully loaded and parsed");
  Start();
});
