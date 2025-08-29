import constants from './constants.js';
import bobMath from './bobMath.js';
import linearAlgebra from './linearAlgebra.js';

/* Be wary of the functions defined in gl-matrix/bobMath! Many of them take the form of accepting the OUT
 * parameter, such that the argument of the function will be modified in the parent context.
 * For example, see UpdateCamera(); We call glMatrix.mat4.multiply(a, b, c), the first arg is the OUT
 * arg, so that value will be overwritten. Console log before and after to see what happens!
 */

let cameraPosition = {};
let cameraRotation = {};
let forward = [ 0, 0, 0 ];
let upVector = {};
let targetVector = {};
let rotatedUpVector = [ 0, 0, 0 ];
let rotatedTarget = [ 0, 0, 0 ];
let viewMatrix = {};
let leftRightRotation = 0.0; // How much the camera is rotated, start at zero.
let upDownRotation = 0.0; // How much the camera is rotated, start at zero.
const defaultRotationAmount = 0.1; // How much the camera is rotated per-frame when turning.
const defaultMovementIncrement = 0.1; // How much the camera moves per-frame.
const minZ = 0.7; // roughly 2/3rds of a unit
const maxMovementPerFrame = 0.5;

// Internal functions:

function RotateLeft() {
  leftRightRotation += defaultRotationAmount;
}

function RotateRight() {
  leftRightRotation -= defaultRotationAmount;
}

function RotateUp() {
  upDownRotation += defaultRotationAmount;
}

function RotateDown() {
  upDownRotation -= defaultRotationAmount;
}

function RaiseCamera() {
  cameraPosition[2] += defaultMovementIncrement;
}

function LowerCamera() {
  cameraPosition[2] -= defaultMovementIncrement;
  if (cameraPosition[2] <= minZ) { cameraPosition[2] = minZ; }
}

function MoveForward(map) {
  forward = linearAlgebra.createVector3(0, 1, 0);
  linearAlgebra.vector3Scale(forward, forward, defaultMovementIncrement); // scale movement by the increment factor.
  linearAlgebra.vector3transformMat4(forward, forward, cameraRotation);

  const newPosition = map.getMovementCoordinates(cameraPosition, forward[0], forward[1]);

  // Since we only move in the X-Z plane, let's add components here individually ourselves.
  //cameraPosition[0] += forward[0];
  //cameraPosition[1] += forward[1];

  cameraPosition[0] = newPosition[0];
  cameraPosition[1] = newPosition[1];
}

function MoveBackwards(map) {
  const baseVector = linearAlgebra.createVector3(0, -1, 0);
  linearAlgebra.vector3Scale(baseVector, baseVector, defaultMovementIncrement); // scale movement by the increment factor.
  linearAlgebra.vector3transformMat4(baseVector, baseVector, cameraRotation);

  // Since we only move in the X-Z plane, let's add components here individually ourselves.
  const newPosition = map.getMovementCoordinates(cameraPosition, baseVector[0], baseVector[1]);
  //cameraPosition[0] += baseVector[0];
  //cameraPosition[1] += baseVector[1];

  cameraPosition[0] = newPosition[0];
  cameraPosition[1] = newPosition[1];
}

function StrafeLeft(map) {
  const baseVector = linearAlgebra.createVector3(-1, 0, 0);
  linearAlgebra.vector3Scale(baseVector, baseVector, defaultMovementIncrement); // scale movement by the increment factor.
  linearAlgebra.vector3transformMat4(baseVector, baseVector, cameraRotation);

  const newPosition = map.getMovementCoordinates(cameraPosition, baseVector[0], baseVector[1]);
  cameraPosition[0] = newPosition[0];
  cameraPosition[1] = newPosition[1];

  // cameraPosition[0] += baseVector[0];
  // cameraPosition[1] += baseVector[1];
}

function StrafeRight(map) {
  const baseVector = linearAlgebra.createVector3(1, 0, 0);
  linearAlgebra.vector3Scale(baseVector, baseVector, defaultMovementIncrement); // scale movement by the increment factor.
  linearAlgebra.vector3transformMat4(baseVector, baseVector, cameraRotation);
  // cameraPosition[0] += baseVector[0];
  // cameraPosition[1] += baseVector[1];
  const newPosition = map.getMovementCoordinates(cameraPosition, baseVector[0], baseVector[1]);
  cameraPosition[0] = newPosition[0];
  cameraPosition[1] = newPosition[1];
}

// External functions:

export function Initialize() {
  cameraRotation = linearAlgebra.mat4Create();
  viewMatrix = linearAlgebra.mat4Create();
  cameraPosition = linearAlgebra.createVector3(0.5, 0.5, 0.5); // This is just a random point in 3D space, to start.

  forward = linearAlgebra.createVector3(0, 1, 0);
  linearAlgebra.vector3Scale(forward, forward, defaultMovementIncrement); // scale movement by the increment factor.
  linearAlgebra.vector3transformMat4(forward, forward, cameraRotation);

  upVector = linearAlgebra.createVector3(0, 0, 1); // Up is the Z axis
  targetVector = linearAlgebra.createVector3(0, 1, 0); // Forward is (at the start) along the Y axis.
}

export function UpdateCamera() {
  /////// TODO: How much of this actually needs to happen every frame????
  cameraRotation = linearAlgebra.mat4Create();
  const upDownRotationMatrix = linearAlgebra.mat4Create();
  const leftRightRotationMatrix = linearAlgebra.mat4Create();

  // Don't let the camera look exactly straight up, or flip over.
  // 2 pi radians, divided by 4 is roughly 1.57, so 1.5 is fine.
  if (upDownRotation >= 1.5) { upDownRotation = 1.5; }
  if (upDownRotation <= -1.5) { upDownRotation = -1.5; }

  if (leftRightRotation >= 2 * Math.PI) { leftRightRotation -= 2 * Math.PI; }
  if (leftRightRotation <= -2 * Math.PI) { leftRightRotation += 2 * Math.PI; }

  linearAlgebra.mat4FromZRotation(leftRightRotationMatrix, leftRightRotation);
  linearAlgebra.mat4FromXRotation(upDownRotationMatrix, upDownRotation);
  linearAlgebra.mat4ScalarMultiply(cameraRotation, leftRightRotationMatrix, upDownRotationMatrix);

  rotatedTarget = linearAlgebra.createVector3(0, 0, 0);
  linearAlgebra.vector3transformMat4(rotatedTarget, targetVector, cameraRotation);
  linearAlgebra.vector3Add(rotatedTarget, rotatedTarget, cameraPosition);

  rotatedUpVector = linearAlgebra.createVector3();
  linearAlgebra.vector3transformMat4(rotatedUpVector, upVector, cameraRotation);

  forward = linearAlgebra.createVector3(0, 1, 0);
  linearAlgebra.vector3Scale(forward, forward, defaultMovementIncrement); // scale movement by the increment factor.
  linearAlgebra.vector3transformMat4(forward, forward, cameraRotation);

  linearAlgebra.mat4LookAt(viewMatrix, // OUT
    cameraPosition, // EYE
    rotatedTarget, // CENTER
    rotatedUpVector); // UP
}

// export function GetPositionString() {
//   return `X: ${cameraPosition[0].toFixed(3)}, Y: ${cameraPosition[1].toFixed(3)}, Z: ${cameraPosition[2].toFixed(3)}`; // eslint-disable-line
// }

export function GetPositionString() {
  return `X: ${Math.floor(cameraPosition[0])}, Y: ${Math.floor(cameraPosition[1])}, Z: ${Math.floor(cameraPosition[2])}`; // eslint-disable-line
}

export function GetRotatedTargetVectorString() {
  return `X: ${rotatedTarget[0].toFixed(3)}, Y: ${rotatedTarget[1].toFixed(3)}, Z: ${rotatedTarget[2].toFixed(3)}`; // eslint-disable-line
}

export function GetViewMatrix() {
  return viewMatrix;
}

export function Action(value, map) { // eslint-disable-line
  switch (value) { // If value is a legit action, perform it!
    case constants.config.ROTATE_UP:
      RotateUp();
      break;
    case constants.config.ROTATE_DOWN:
      RotateDown();
      break;
    case constants.config.ROTATE_LEFT:
      RotateLeft();
      break;
    case constants.config.ROTATE_RIGHT:
      RotateRight();
      break;
    case constants.config.FORWARD:
      MoveForward(map);
      break;
    case constants.config.REVERSE:
      MoveBackwards(map);
      break;
    case constants.config.LEFT_STRAFE:
      StrafeLeft(map);
      break;
    case constants.config.RIGHT_STRAFE:
      StrafeRight(map);
      break;
    case constants.config.RAISE_CAM:
      RaiseCamera(map);
      break;
    case constants.config.LOWER_CAM:
      LowerCamera(map);
      break;
    default:
  }
}

export function getPositionVector() {
  return cameraPosition;
}

export function getForwardVector() {
  return forward;
}

export function getUpVector() {
  return rotatedUpVector;
}

export function rotateLeftRightByAmount(amount) {
  leftRightRotation += amount;
}

export function rotateUpDownByAmount(amount) {
  upDownRotation += amount;
}

export function getLeftRightRotationAmount() {
  return leftRightRotation;
}

export function teleportToCoordinates(x, y, z) {
  cameraPosition = linearAlgebra.createVector3(x, y, z); // This is just a random point in 3D space, to start.
}

export default { Action, getLeftRightRotationAmount, GetPositionString, GetViewMatrix, Initialize, UpdateCamera, getUpVector, getPositionVector, getForwardVector, rotateLeftRightByAmount, rotateUpDownByAmount, teleportToCoordinates };
