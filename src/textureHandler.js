import log from './logger.js';

const texturePool = [];

async function loadTextureFromFile(gl, imagePath) {
  return new Promise((success, failure) => {
    const binding = gl.createTexture();
    const img = new Image();
    // Always define onload func first, then set src property.
    img.onload = function () { // eslint-disable-line
      handleTextureLoaded(gl, img, binding);
      texturePool.push({
        textureSourceFile: imagePath, // Image.src gets transformed to a URL, so use the unmodified one here.
        textureBinding: binding
      });
      return success(binding);
    };

    img.onerror = function () { // eslint-disable-line
      log(`Error loading texture: ${img.src}`);
      return failure();
    };

    img.src = imagePath;
  });
}

function handleTextureLoaded(gl, image, textureBinding) {
  gl.bindTexture(gl.TEXTURE_2D, textureBinding);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

export async function getTextureBinding(gl, imagePath) {
  // If the texture pool has loaded the texture already, just return it
  const existingTextureMap = texturePool.find((tex) => {
    return tex.textureSourceFile == imagePath;
  });

  if (existingTextureMap) {
    log(`Returning texture binding ${imagePath} from cache!`);
    return existingTextureMap.textureBinding;
  }

  log(`Texture binding for ${imagePath} was not in cache, loading from file!`);
  const newBinding = await loadTextureFromFile(gl, imagePath)
  return newBinding;
} 

// TODO: Probably should add a function to unload textures, but in practice
// I would guess we will end up using < 256MB of textures

export default { getTextureBinding };
