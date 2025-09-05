import VERTEX_SHADER_SOURCE from './vertexShader.glsl';
import FRAGMENT_SHADER_SOURCE from './fragmentShader.glsl';

/**
* initShaders initializes our GLSL, compiles it from source, and attaches it.
* Since we use webpack-glsl-loader, the GLSL source files can be imported just like any other JS file.
* @return: N/A
*/
export function initShaders(gl) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, VERTEX_SHADER_SOURCE);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, FRAGMENT_SHADER_SOURCE);
  gl.compileShader(fragmentShader);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  /* As of September 2025 I started getting this warning in firefox:
      "WebGL warning: drawElementsInstanced: Drawing without vertex attrib 0 array enabled forces the browser to
      do expensive emulation work when running on desktop OpenGL platforms, for example on Mac. It is preferable
      to always draw with vertex attrib 0 array enabled, by using bindAttribLocation to bind some always-used
      attribute to location 0."
  * To solve this, it was recommended to use something common from the vertex shader (like position)
  * and set it to index 0 of the attribLocation. I am not an expert on how this works. I am guessing that
  * sometimes it was getting assigned index 0 and sometimes not, but by specifying index 0 below we can
  * guarantee get the performance improvement by putting it in index 0.
  */
  gl.bindAttribLocation(shaderProgram, 0, 'aVertexPosition');
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
    throw `Failed to compile fragment shader: ${gl.getShaderInfoLog(fragmentShader)}`;
  }

  gl.useProgram(shaderProgram);

  const vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  gl.enableVertexAttribArray(vertexPositionAttribute); // With the code above, this should be index 0

  const textureCoordAttribute = gl.getAttribLocation(shaderProgram, 'aTextureCoord');
  gl.enableVertexAttribArray(textureCoordAttribute);

  return { shaderProgram, vertexPositionAttribute, textureCoordAttribute };
}

export default { initShaders };
