import basicModels from '../content/models/basicModels.js';
import bobMath from './bobMath.js';
import constants from './constants.js';
import linearAlgebra from './linearAlgebra.js';
import textureHandler from './textureHandler.js';

let frameCount = 0;
let maxFrames = 120;

function getLimitedRotation(rot) {
  // Since a circle is two Pi, if the model has rotated that far, remove that much so
  // that this number does not grow without bounds (even though it'll look render correctly as-is)
  if (rot >= 2 * Math.PI) {
    rot -= 2 * Math.PI;
  }

  if (rot<= -2 * Math.PI) {
    rot += 2 * Math.PI;
  }

  return rot;
}

function updateRotationMatrix(model) {
  // See this great answer: https://gamedev.stackexchange.com/a/59849
  // And note how the order of operations must actually be reversed. 
  model.rotationMatrix = linearAlgebra.mat4Create();

  const centerOfMass = bobMath.calculateCenterOfMass(model.vertices, model.translationVector);
  const inverseCenterOfMass = [-1 * centerOfMass[0], -1 * centerOfMass[1], -1 * centerOfMass[2]];

  let tempPosition = {};
  linearAlgebra.mat4ScalarTranslate(tempPosition, linearAlgebra.mat4Create(), centerOfMass);

  linearAlgebra.mat4RotateZScalar(tempPosition, tempPosition, model.leftRightRotation);
  linearAlgebra.mat4RotateXScalar(tempPosition, tempPosition, model.upDownRotation);

  linearAlgebra.mat4ScalarTranslate(model.rotationMatrix, tempPosition, inverseCenterOfMass);
}

export function rotateLeftRightByAmount(model, amount) {
  model.leftRightRotation += amount;
  model.leftRightRotation = getLimitedRotation(model.leftRightRotation);

  updateRotationMatrix(model);
}

export function rotateUpDownByAmount(model, amount) {
  model.upDownRotation += amount;
  model.upDownRotation = getLimitedRotation(model.upDownRotation);
  updateRotationMatrix(model);
}

export async function createModel(gl, name, overrides = {}) {
  let toAdd = structuredClone(basicModels[name]);
  toAdd = { ...toAdd, ...overrides };
  toAdd.translationVector = linearAlgebra.createVector3(0, 0, 0);
  toAdd.rotationMatrix = linearAlgebra.mat4Create();
  toAdd.leftRightRotation = 0;
  toAdd.upDownRotation = 0;
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

  toAdd.textureBinding = await textureHandler.getTextureBinding(gl, toAdd.textureSourceFile);
  return toAdd;
}


export function rotateToFaceCamera(gl, model, camera) {
  // By using a triangle, basically angle theta of the monster to us is tan^-1 (dx / dy) between the model and the camera.
  const cameraPosition = camera.getPositionVector();
  let amount = 0;

  /*
    Q: below, why do I add 0.5? 
    A: the camera is basically centered on a tile at x=0.5, but in order to have a sprite
       it takes up the whole width (1.0) of a tile. So the distance between it and us essentially
       gets shifted unintentionally with simple dx = model[x] - camera[x]
       The translationvector of the sprite already compensates for the Y direction to center the sprite
       within the tile coordinates at + 0.5y .
  */ 
  const dx = model.translationVector[0] - cameraPosition[0] + 0.5;
  const dy = model.translationVector[1] - cameraPosition[1];

  amount = -1 * Math.atan(dx / dy);

  // Good heavens this one took me forever to fix. Praise God it is solved.
  if (dy < 0) { // For some reason, if the camera is north of the object, add 180 degrees to the rotation amount.
    amount = Math.PI + amount;
  }

  model.leftRightRotation = amount;
  updateRotationMatrix(model);
}

export default { createModel, rotateToFaceCamera, rotateLeftRightByAmount, rotateUpDownByAmount  };
