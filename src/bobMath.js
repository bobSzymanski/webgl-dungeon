// bobMath.js: extra math functions that I make as needed.
import constants from './constants.js';

const ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
const EPSILON = 0.000001;

export function degreesToRadians(deg) {
  return deg * Math.PI / 180.0; // eslint-disable-line
}

function calculateCenterOfMass(vertices, position) {
  let minx = 0, miny = 0, minz = 0;
  let maxx = 0, maxy = 0, maxz = 0;
  for (var i = 0; i < vertices.length; i+= 3) {
    if (vertices[i] < minx) { minx = vertices[i]; }
    if (vertices[i] > maxx) { maxx = vertices[i]; }
  }

  for (var i = 1; i < vertices.length; i+= 3) {
    if (vertices[i] < miny) { miny = vertices[i]; }
    if (vertices[i] > maxy) { maxy = vertices[i]; }
  }

  for (var i = 2; i < vertices.length; i+= 3) {
    if (vertices[i] < minz) { minz = vertices[i]; }
    if (vertices[i] > maxz) { maxz = vertices[i]; }
  }

  // Now that we have the min and max in each direction, we can make the center of mass.
  // Note that we need to translate the center by the position of the model in 3d space.
  return [ ((maxx + minx) / 2) + position[0], ((maxy + miny) / 2) + position[1], ((maxz + minz) / 2) + position[2]];
}


/* 2025 note: not sure where I left off on this, where it was used, etc. I am refactoring other stuff
but make a note that this isn't exported and it's not expected to work from anywhere right now... */ 
function getModelCollisionDetails(vertices, position) {
  // Step 1: calculate Center Of Mass:
  let minx = 0, miny = 0, minz = 0;
  let maxx = 0, maxy = 0, maxz = 0;
  for (var i = 0; i < vertices.length; i+= 3) {
    if (vertices[i] < minx) { minx = vertices[i]; }
    if (vertices[i] > maxx) { maxx = vertices[i]; }
  }

  for (var i = 1; i < vertices.length; i+= 3) {
    if (vertices[i] < miny) { miny = vertices[i]; }
    if (vertices[i] > maxy) { maxy = vertices[i]; }
  }

  for (var i = 2; i < vertices.length; i+= 3) {
    if (vertices[i] < minz) { minz = vertices[i]; }
    if (vertices[i] > maxz) { maxz = vertices[i]; }
  }

  // Now that we have the min and max in each direction, we can make the center of mass.
  // Note that we need to translate the center by the position of the model in 3d space.
  const com = [ ((maxx + minx) / 2) + position[0], ((maxy + miny) / 2) + position[1], ((maxz + minz) / 2) + position[2]];

  return {
    xRadius: (maxx - minx) / 2, // Simply half the width of the model
    yRadius: (maxy - miny) / 2, // Same for Y, Z directions
    zRadius: (maxz - minz) / 2,
    com
  };
}

export function doesCameraCollideWithModel(cameraPosition, model) {
  if (!model.boundingBoxes) {
    console.log(`Warning: trying to collide model ${model.name} that has no bounding boxes!`);
    return true;
  }

  const com = calculateCenterOfMass(model.vertices, model.translationVector);
   if (Math.abs(cameraPosition[0] - com[0]) <= constants.config.HERO_BOUNDINGBOX_XRADIUS + model.xRadius) {
      //check the Y axis
      if (Math.abs(cameraPosition[1] - com[1]) <= constants.config.HERO_BOUNDINGBOX_YRADIUS + model.yRadius) {
          //check the Z axis
          if (Math.abs(cameraPosition[2] - com[2]) <= constants.config.HERO_BOUNDINGBOX_ZRADIUS + model.zRadius) {
             return true;
          }
      }
   }

     return false;
}

export default {
  calculateCenterOfMass,
  degreesToRadians,
  doesCameraCollideWithModel
};
