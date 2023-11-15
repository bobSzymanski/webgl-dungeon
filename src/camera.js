import constants from './constants';
import glMatrix from './extern/gl-matrix.js';

/* Be wary of the functions defined in gl-matrix! Many of them take the form of accepting the OUT
 * parameter, such that the argument of the function will be modified in the parent context.
 * For example, see UpdateCamera(); We call glMatrix.mat4.multiply(a, b, c), the first arg is the OUT
 * arg, so that value will be overwritten. Console log before and after to see what happens!
 */

let cameraPosition = {};
let cameraRotation = {};
let upVector = {};
let targetVector = {};
let rotatedTarget = {};
let viewMatrix = {};
let leftRightRotation = 0.0; // How much the camera is rotated, start at zero.
let upDownRotation = 0.0; // How much the camera is rotated, start at zero.
const defaultRotationAmount = 0.1; // How much the camera is rotated per-frame when turning.
const defaultMovementIncrement = 0.1; // How much the camera moves per-frame.

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
}

function MoveForward() {
  const baseVector = glMatrix.vec3.fromValues(0, 1, 0);
  glMatrix.vec3.scale(baseVector, baseVector, defaultMovementIncrement); // scale movement by the increment factor.
  glMatrix.vec3.transformMat4(baseVector, baseVector, cameraRotation);

  // Since we only move in the X-Z plane, let's add components here individually ourselves.
  cameraPosition[0] += baseVector[0];
  cameraPosition[1] += baseVector[1];
}

function MoveBackwards() {
  const baseVector = glMatrix.vec3.fromValues(0, 1, 0);
  glMatrix.vec3.scale(baseVector, baseVector, defaultMovementIncrement); // scale movement by the increment factor.
  glMatrix.vec3.transformMat4(baseVector, baseVector, cameraRotation);

  // Since we only move in the X-Z plane, let's add components here individually ourselves.
  cameraPosition[0] -= baseVector[0];
  cameraPosition[1] -= baseVector[1];
}

function StrafeLeft() {
  const baseVector = glMatrix.vec3.fromValues(-1, 0, 0);
  glMatrix.vec3.scale(baseVector, baseVector, defaultMovementIncrement); // scale movement by the increment factor.
  glMatrix.vec3.transformMat4(baseVector, baseVector, cameraRotation);

  cameraPosition[0] += baseVector[0];
  cameraPosition[1] += baseVector[1];
}

function StrafeRight() {
  const baseVector = glMatrix.vec3.fromValues(1, 0, 0);
  glMatrix.vec3.scale(baseVector, baseVector, defaultMovementIncrement); // scale movement by the increment factor.
  glMatrix.vec3.transformMat4(baseVector, baseVector, cameraRotation);
  cameraPosition[0] += baseVector[0];
  cameraPosition[1] += baseVector[1];
}

// External functions:

export function Initialize() {
  cameraRotation = glMatrix.mat4.create();
  viewMatrix = glMatrix.mat4.create();
  cameraPosition = glMatrix.vec3.fromValues(0.5, 0.5, 3); // This is just a random point in 3D space, to start.

  upVector = glMatrix.vec3.fromValues(0, 0, 1); // Up is the Z axis
  targetVector = glMatrix.vec3.fromValues(0, 1, 0); // Forward is (at the start) along the Y axis.
}

export function UpdateCamera() {


  /////// TODO: How much of this actually needs to happen every frame????
  cameraRotation = glMatrix.mat4.create();
  const upDownRotationMatrix = glMatrix.mat4.create();
  const leftRightRotationMatrix = glMatrix.mat4.create();

  glMatrix.mat4.fromZRotation(leftRightRotationMatrix, leftRightRotation);
  glMatrix.mat4.fromXRotation(upDownRotationMatrix, upDownRotation);
  glMatrix.mat4.multiply(cameraRotation, leftRightRotationMatrix, upDownRotationMatrix);

  rotatedTarget = glMatrix.vec3.create();
  glMatrix.vec3.transformMat4(rotatedTarget, targetVector, cameraRotation);
  glMatrix.vec3.add(rotatedTarget, rotatedTarget, cameraPosition);

  const rotatedUpVector = glMatrix.vec3.create();
  glMatrix.vec3.transformMat4(rotatedUpVector, upVector, cameraRotation);

  glMatrix.mat4.lookAt(viewMatrix, // OUT
    cameraPosition, // EYE
    rotatedTarget, // CENTER
    rotatedUpVector); // UP
}

export function GetPositionString() {
  return `X: ${cameraPosition[0].toFixed(3)}, Y: ${cameraPosition[1].toFixed(3)}, Z: ${cameraPosition[2].toFixed(3)}`; // eslint-disable-line
}

export function GetRotatedTargetVectorString() {
  return `X: ${rotatedTarget[0].toFixed(3)}, Y: ${rotatedTarget[1].toFixed(3)}, Z: ${rotatedTarget[2].toFixed(3)}`; // eslint-disable-line
}

export function GetViewMatrix() {
  return viewMatrix;
}

export function Action(value) { // eslint-disable-line
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
      MoveForward();
      break;
    case constants.config.REVERSE:
      MoveBackwards();
      break;
    case constants.config.LEFT_STRAFE:
      StrafeLeft();
      break;
    case constants.config.RIGHT_STRAFE:
      StrafeRight();
      break;
    case constants.config.RAISE_CAM:
      RaiseCamera();
      break;
    case constants.config.LOWER_CAM:
      LowerCamera();
      break;
    default:
  }
}

export default { Action, GetPositionString, GetViewMatrix, Initialize, UpdateCamera };
