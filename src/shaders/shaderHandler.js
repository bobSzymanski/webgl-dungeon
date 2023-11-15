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

  const vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  gl.enableVertexAttribArray(vertexPositionAttribute);

  const textureCoordAttribute = gl.getAttribLocation(shaderProgram, 'aTextureCoord');
  gl.enableVertexAttribArray(textureCoordAttribute);

  return { shaderProgram, vertexPositionAttribute, textureCoordAttribute };
}

export default { initShaders };
