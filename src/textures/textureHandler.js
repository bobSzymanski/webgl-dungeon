
/** loadTextureForModel:
 * loads the texture file as described in the model
 * @return N/A
 */
export async function loadTextureForModel(gl, model) {
  return new Promise((success, failure) => {
    Object.assign(model, { textureBinding: gl.createTexture() });
    const img = new Image();
    // Always define onload func first, then set src property.
    img.onload = function () { // eslint-disable-line
      handleTextureLoaded(gl, img, model.textureBinding, model);
      return success();
    };

    img.onerror = function () { // eslint-disable-line
      log(`Error loading texture: ${img.src}`);
      return failure();
    };

    img.src = model.textureSourceFile;
  });
}

function handleTextureLoaded(gl, image, texture, model) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);

  Object.assign(model, { textureBinding: texture });
}

export default { loadTextureForModel };
