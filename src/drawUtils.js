
let worldMatrixUniform, vertexPositionAttribute, vertexTranslationAttribute, textureCoordAttribute, shaderProgram;

export function init(w, v, t, vt, s) {
  worldMatrixUniform = w;
  vertexPositionAttribute = v;
  textureCoordAttribute = t;
  vertexTranslationAttribute = vt;
  shaderProgram = s;
}

export function drawSprite(gl, sprite) {

}

export function drawModel(gl, model) {
  // Bind the vertex, index, and texture coordinate data
  gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.textureCoordBuffer);
  gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);

  if (!model.translationVector) {
    console.log('uh oh');
  }

  // Pass translation vector to the shader:
  gl.vertexAttrib3f(vertexTranslationAttribute,
    model.translationVector[0],
    model.translationVector[1],
    model.translationVector[2]);

  // Bind the current texture data
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, model.textureBinding);
  gl.uniform1i(gl.getUniformLocation(shaderProgram, 'uSampler'), 0);

  // Bind the objects rotational matrix:
  gl.uniformMatrix4fv(worldMatrixUniform, false, model.rotationMatrix);

  // Draw the model.
  gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
}

export default { drawModel, drawSprite, init };
