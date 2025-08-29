// TODO: This import is a bit weird with newer versions of node & webpack, find proper implementation
// import { randomUUID } from 'crypto';

import bobMath from './bobMath.js';
import maps from './../content/maps/maps.js';
import monsterUtils from './monsterUtils.js';
import modelUtils from './modelUtils.js';
import textureHandler from './textureHandler.js';

let worldMonsterGroups = [];
const models = [];
let numTiles, mapDimension; // mapDimension * mapDimension = numTiles
let jsonBlob;

const playerPosition = [ 0, 0 ];
const minWallDistance = 0.20;
let bumpedIntoMonster = false;
let bumpedBattleIndex = 0;

// See content/walls.png for the mapping.
const norths = [ false, true, false, false,
 false, false, true, true, 
 true, false, false, true,
 true, true, false, true ];

const souths = [ false, false, true, false,
 false, false, true, false, 
 false, true, true, true,
 false, true, true, true ];

const easts = [ false, false, false, true,
 false, true, false, false, 
 true, true, false, false,
 true, true, true, true ];

const wests = [ false, false, false, false,
 true, true, false, true, 
 false, false, true, true,
 true, false, true, true ];

async function parseTiles(gl, mapName) {
  numTiles = jsonBlob.tiles.length; // Say this is 10,000 tiles, then 100x100
  mapDimension = Math.sqrt(numTiles); // this would be 100
  const currentCoord = [ 0, mapDimension -1 ];

  const wallOverrides = {
    textureSourceFile: jsonBlob.wallTextureSourceFile
  };

  const floorOverrides = {
    textureSourceFile: jsonBlob.floorTexture
  };

  const ceilingOverrides = {
    textureSourceFile: jsonBlob.ceilingTexture
  };

  // The heart of dungeon generation...
  for (var i = 0; i < numTiles; i++) {
    const tileValue = jsonBlob.tiles[i]; // This will be an integer between 0 and 15, inclusive.
    if (norths[tileValue]) {
      await addMapGeometry(gl, 'northWall', [currentCoord[0], currentCoord[1], 0], wallOverrides);
    }

    if (souths[tileValue]) {
      await addMapGeometry(gl, 'southWall', [currentCoord[0], currentCoord[1], 0], wallOverrides);
    }

    if (easts[tileValue]) {
      await addMapGeometry(gl, 'eastWall', [currentCoord[0], currentCoord[1], 0], wallOverrides);
    }

    if (wests[tileValue]) {
      await addMapGeometry(gl, 'westWall', [currentCoord[0], currentCoord[1], 0], wallOverrides);
    }

    await addMapGeometry(gl, 'floor', [currentCoord[0], currentCoord[1], 0], floorOverrides);

    if (jsonBlob.renderCeiling == true && jsonBlob.ceilingTexture) {
      await addMapGeometry(gl, 'ceiling', [currentCoord[0], currentCoord[1], 0], ceilingOverrides);
    }

    currentCoord[0] += 1; // Move to the next tile, 
    if (currentCoord[0] >= mapDimension) { // If we have finished the row,
      currentCoord[1] -= 1; // Go to the next row, DOWNWARDS
      currentCoord[0] = 0; // And start over on that new row.
    }
  }
}

// async function addBigFloor(gl) {
//   const overrides = {
//     textureSourceFile: jsonBlob.floorTexture,
//     vertices: [ 
//       0, mapDimension, 0,
//       mapDimension, mapDimension, 0,
//       mapDimension, 0, 0,
//       0, 0, 0
//     ],
//     indices: [
//       0,3,2, 0,2,1
//     ],
//     textureMap: [
//       0, 0, mapDimension, 0, mapDimension, mapDimension, 0, mapDimension
//     ]
//   };

//   const model = await modelUtils.createModel(gl, 'floor', overrides);
//   models.push(model);
// }

// async function addBigCeiling(gl) {
//   const overrides = {
//     textureSourceFile: jsonBlob.ceilingTexture,
//     vertices: [ 
//       0, mapDimension, 1,
//       mapDimension, mapDimension, 1,
//       mapDimension, 0, 1,
//       0, 0, 1
//     ],
//     indices: [
//       0,1,2, 0,2,3
//     ],
//     textureMap: [
//       0, mapDimension, mapDimension, mapDimension, mapDimension, 0, 0, 0
//     ]
//   }

//   const model = await modelUtils.createModel(gl, 'floor', overrides);
//   models.push(model);
// }

async function addMapGeometry(gl, name, coords, overrides) {
  const geom = await modelUtils.createModel(gl, name, overrides);
  geom.translationVector = [ coords[0], coords[1], coords[2] ];
  models.push(geom);
}

export async function initMap(gl, mapName) {
  models.length = 0;
  jsonBlob = structuredClone(maps[mapName]);

  // Load the "tiles" for the map
  // Load the floor geometry
  // Load the ceiling geometry
  // Load any extra map models -- objects, doors? 

  await parseTiles(gl, mapName);
  //await addBigFloor(gl); // This kind of feels like cheating, but
  //await addBigCeiling(gl); // These are both just 2 large triangles, each.
  await spawnMonsterGroups(gl); // For each monster group, spawn a worldMonster with the sprite of monster[0]
}

async function spawnMonsterGroups(gl) {
  const monsterObjects = [];
  for (var i = 0; i < jsonBlob.monsterGroups.length; i++) {
    const monsterGroup = structuredClone(jsonBlob.monsterGroups[i]); // Create an instance of that group.
    monsterGroup.id = self.crypto.randomUUID(); // Assign each monster group a unique ID so that we know how to reference it later.
    // For each monster group, take the first monster in its monster list and create a worldMonster out of it.
    monsterGroup.worldMonsterObject = await monsterUtils.createWorldMonster(gl, monsterGroup.names[0], monsterGroup.startingPosition);
    worldMonsterGroups.push(monsterGroup);
  }
}


// models is used for world geometry & objects
export function getModels() {
  return models;
}

export async function loadTextures(gl) {
  for (const model of models) {
    model.textureBinding = await textureHandler.getTextureBinding(gl, model.textureSourceFile);
  }
}
 
// If we break this down to its own function, we can return much more quickly
// when there are obstacles in our path
function canMoveXDirection(position, desiredXMovement) {
  if (desiredXMovement == 0) { return false; } // If not moving at all, don't do anything here.
  const coordX = Math.floor(position[0]);
  const coordY = Math.floor(position[1]);
  const coordZ = Math.floor(position[2]);
  const myTile = jsonBlob.tiles[(mapDimension * (mapDimension - coordY - 1)) + coordX];

  const xBuffer = desiredXMovement > 0 ? minWallDistance : -1 * minWallDistance;
  const finalDesiredXPosition = position[0] + desiredXMovement + xBuffer;
  const newCoordX = Math.floor(finalDesiredXPosition);
  const newTileIndex = (mapDimension * (mapDimension - coordY - 1)) + newCoordX;
  const newTile = jsonBlob.tiles[newTileIndex];

  if (finalDesiredXPosition <= 0) { return false; } // If we're moving outside the map, no.
  if (finalDesiredXPosition >= mapDimension) { return false; }

  if (desiredXMovement > 0) { // if we're moving to the right
    if (easts[myTile] || (coordX != newCoordX && wests[newTile])) { // if there is a wall in our tile, or if we're trying to move into a new tile with a west wall...
      if (finalDesiredXPosition >= Math.ceil(position[0]) - minWallDistance) { // If we're moving into the buffer space on our tile
        return false;
      }
    }
  }

  if (desiredXMovement < 0) { // if we're moving to the left
    if (wests[myTile] || (coordX != newCoordX && easts[newTile])) { // if there is a wall in our tile, or if we're trying to move into a new tile with an eastern wall...
      if (finalDesiredXPosition <= Math.floor(position[0]) + minWallDistance) { // If we're moving into the buffer space on our tile
        return false;
      }
    }
  }

  if (norths[newTile] || (newTileIndex - mapDimension >= 0 && souths[jsonBlob.tiles[newTileIndex - mapDimension]])) {
    if (position[1] - coordY > (1 - minWallDistance)) { 
      return false;
    }
  }

  if (souths[newTile] || (newTileIndex + mapDimension < mapDimension * mapDimension && norths[jsonBlob.tiles[newTileIndex + mapDimension]])) {
    if (position[1] - coordY < minWallDistance) { 
      return false;
    }
  }

  // Todo: Also respect tiles going the other way!
  if (collidesWithMonsterGroup([finalDesiredXPosition, position[1], position[2]])) { return false; }

  return true;
}

function canMoveYDirection(position, desiredYMovement) {
  if (desiredYMovement == 0) { return false; } // If not moving at all, don't do anything here.
  const coordX = Math.floor(position[0]);
  const coordY = Math.floor(position[1]);
  const coordZ = Math.floor(position[2]);
  const myTile = jsonBlob.tiles[(mapDimension * (mapDimension - coordY - 1)) + coordX];

  const yBuffer = desiredYMovement > 0 ? minWallDistance : -1 * minWallDistance;
  const finalDesiredYPosition = position[1] + desiredYMovement + yBuffer;
  const newCoordY = Math.floor(finalDesiredYPosition);
  const newTileIndex = (mapDimension * (mapDimension - newCoordY - 1)) + coordX;
  const newTile = jsonBlob.tiles[newTileIndex];

  if (finalDesiredYPosition <= 0) { return false; } // If we're moving outside the map, no.
  if (finalDesiredYPosition >= mapDimension) { return false; }

  if (desiredYMovement > 0) { // if we're moving forwards
    if (norths[myTile] || (coordY != newCoordY && souths[newTile])) { // if there is a wall in our tile, or if we're trying to move into a new tile with a south wall...
      if (finalDesiredYPosition >= Math.ceil(position[1]) - minWallDistance) { // If we're moving into the buffer space on our tile
        return false;
      }
    }
  }

  if (desiredYMovement < 0) { // if we're moving backwards
    if (souths[myTile] || (coordY != newCoordY && norths[newTile])) { // if there is a wall in our tile, or if we're trying to move into a new tile with a north wall...
      if (finalDesiredYPosition <= Math.floor(position[1]) + minWallDistance) { // If we're moving into the buffer space on our tile
        return false;
      }
    }
  }

  if (easts[newTile] || (coordX + 1 < mapDimension && wests[jsonBlob.tiles[newTileIndex + 1]])) {
    if (position[0] - coordX > (1 - minWallDistance)) { 
      return false;
    }
  }

  if (wests[newTile] || (coordX > 0 && easts[jsonBlob.tiles[newTileIndex - 1]])) {
    if (position[0] - coordX < minWallDistance) {
      return false;
    }
  }

  if (collidesWithMonsterGroup([position[0], finalDesiredYPosition, position[2]])) { return false; }

  return true;
}

function checkNearbyTiles(desiredPosition) {
  const xCoord = Math.floor(desiredPosition[0]);
  const yCoord = Math.floor(desiredPosition[1]);

  if (xCoord < mapDimension) { // There's a tile to the right. ceh

  }

}

export function getMovementCoordinates(position, desiredXMovement, desiredYMovement) {
  const newPosition = [ position[0], position[1], position[2] ];
  if (canMoveXDirection(position, desiredXMovement)) { newPosition[0] += desiredXMovement; }
  if (canMoveYDirection(position, desiredYMovement)) { newPosition[1] += desiredYMovement; }

  return newPosition;
}

function collidesWithMonsterGroup(newCameraPosition) {
  // For each monster group, check its collision bounding box versus the new desired coordinate.
  for (var i = 0; i < worldMonsterGroups.length; i++) {
    if (bobMath.doesCameraCollideWithModel(newCameraPosition, worldMonsterGroups[i].worldMonsterObject.model)) {
      bumpedIntoMonster = true;
      bumpedBattleIndex = i;
      return true; 
    }
  }

  return false;
}

export function getWorldMonsterGroups() {
  return worldMonsterGroups;
}

export function destroyMonsterGroup(group) {
  worldMonsterGroups = worldMonsterGroups.filter((m) => { return m.id != group.id });
}

export function didBattleBump() {
  if (bumpedIntoMonster) { 
    bumpedIntoMonster = false;
    return true;
  }

  return false;
}

export function getBumpedBattleIndex() {
  return bumpedBattleIndex;
}

export function getAmbientLightIntensity() {
  return jsonBlob.globalAmbientLight;
}

export function clear() {
  jsonBlob = {};
  worldMonsterGroups = [];
  models.length = 0;
  numTiles = 0;
  mapDimension = 0;
  bumpedIntoMonster = false;
  bumpedBattleIndex = 0;
}

export default { clear, destroyMonsterGroup, didBattleBump, getAmbientLightIntensity, getBumpedBattleIndex, getMovementCoordinates, getWorldMonsterGroups, initMap, getModels, loadTextures };
