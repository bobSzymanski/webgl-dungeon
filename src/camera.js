const glMatrix = require('./extern/gl-matrix.js');
const constants = require('./constants');

/* Be wary of the functions defined in gl-matrix! Many of them take the form of accepting the OUT
 * parameter, such that the argument of the function will be modified in the parent context.
 * For example, see UpdateCamera(); We call glMatrix.mat4.multiply(a, b, c), the first arg is the OUT
 * arg, so that value will be overwritten. Console log before and after to see what happens!
 */

const Camera = {
  cameraPosition: {},
  cameraRotation: {},
  upVector: {},
  targetVector: {},
  viewMatrix: {},
  leftRightRotation: 0.0,
  upDownRotation: 0.0,
  defaultRotationAmount: 0.1,
  defaultMovementIncrement: 0.1,


  // Camera Functions

  Initialize() {
    this.cameraRotation = glMatrix.mat4.create();
    this.viewMatrix = glMatrix.mat4.create();
    this.cameraPosition = glMatrix.vec3.fromValues(-3, -3, 3);

    this.upVector = glMatrix.vec3.fromValues(0, 0, 1);
    this.targetVector = glMatrix.vec3.fromValues(0, 1, 0);
  },

  UpdateCamera() {
    this.cameraRotation = glMatrix.mat4.create();
    const upDownRotationMatrix = glMatrix.mat4.create();
    const leftRightRotationMatrix = glMatrix.mat4.create();

    glMatrix.mat4.fromZRotation(leftRightRotationMatrix, this.leftRightRotation);
    glMatrix.mat4.fromXRotation(upDownRotationMatrix, this.upDownRotation);
    glMatrix.mat4.multiply(this.cameraRotation, leftRightRotationMatrix, upDownRotationMatrix);

    const rotatedTarget = glMatrix.vec3.create();
    glMatrix.vec3.transformMat4(rotatedTarget, this.targetVector, this.cameraRotation);
    glMatrix.vec3.add(rotatedTarget, rotatedTarget, this.cameraPosition);

    const rotatedUpVector = glMatrix.vec3.create();
    glMatrix.vec3.transformMat4(rotatedUpVector, this.upVector, this.cameraRotation);

    glMatrix.mat4.lookAt(this.viewMatrix, // OUT
      this.cameraPosition, // EYE
      rotatedTarget, // CENTER
      rotatedUpVector); // UP
  },

  RotateLeft() {
    this.leftRightRotation += this.defaultRotationAmount;
  },

  RotateRight() {
    this.leftRightRotation -= this.defaultRotationAmount;
  },

  RotateUp() {
    this.upDownRotation += this.defaultRotationAmount;
  },

  RotateDown() {
    this.upDownRotation -= this.defaultRotationAmount;
  },

  RaiseCamera() {
    this.cameraPosition[2] += this.defaultMovementIncrement;
  },

  LowerCamera() {
    this.cameraPosition[2] -= this.defaultMovementIncrement;
  },

  MoveForward() {
    const baseVector = glMatrix.vec3.fromValues(0, 1, 0);
    glMatrix.vec3.scale(baseVector, baseVector, this.defaultMovementIncrement); // scale movement by the increment factor.
    glMatrix.vec3.transformMat4(baseVector, baseVector, this.cameraRotation);

    // Since we only move in the X-Z plane, let's add components here individually ourselves.
    this.cameraPosition[0] += baseVector[0];
    this.cameraPosition[1] += baseVector[1];
  },

  MoveBackwards() {
    const baseVector = glMatrix.vec3.fromValues(0, 1, 0);
    glMatrix.vec3.scale(baseVector, baseVector, this.defaultMovementIncrement); // scale movement by the increment factor.
    glMatrix.vec3.transformMat4(baseVector, baseVector, this.cameraRotation);

    // Since we only move in the X-Z plane, let's add components here individually ourselves.
    this.cameraPosition[0] -= baseVector[0];
    this.cameraPosition[1] -= baseVector[1];
  },

  StrafeLeft() {
    const baseVector = glMatrix.vec3.fromValues(-1, 0, 0);
    glMatrix.vec3.scale(baseVector, baseVector, this.defaultMovementIncrement); // scale movement by the increment factor.
    glMatrix.vec3.transformMat4(baseVector, baseVector, this.cameraRotation);

    this.cameraPosition[0] += baseVector[0];
    this.cameraPosition[1] += baseVector[1];
  },

  StrafeRight() {
    const baseVector = glMatrix.vec3.fromValues(1, 0, 0);
    glMatrix.vec3.scale(baseVector, baseVector, this.defaultMovementIncrement); // scale movement by the increment factor.
    glMatrix.vec3.transformMat4(baseVector, baseVector, this.cameraRotation);
    this.cameraPosition[0] += baseVector[0];
    this.cameraPosition[1] += baseVector[1];
  },

  GetViewMatrix() {
    return this.viewMatrix;
  },

  GetPositionString() {
    return `X: ${this.cameraPosition[0].toFixed(3)}, Y: ${this.cameraPosition[1].toFixed(3)}, Z: ${this.cameraPosition[2].toFixed(3)}`; // eslint-disable-line
  },

  Action(value) { // eslint-disable-line
    switch (value) { // If value is a legit action, perform it!
      case constants.ROTATE_UP:
        this.RotateUp();
        break;
      case constants.ROTATE_DOWN:
        this.RotateDown();
        break;
      case constants.ROTATE_LEFT:
        this.RotateLeft();
        break;
      case constants.ROTATE_RIGHT:
        this.RotateRight();
        break;
      case constants.FORWARD:
        this.MoveForward();
        break;
      case constants.REVERSE:
        this.MoveBackwards();
        break;
      case constants.LEFT_STRAFE:
        this.StrafeLeft();
        break;
      case constants.RIGHT_STRAFE:
        this.StrafeRight();
        break;
      case constants.RAISE_CAM:
        this.RaiseCamera();
        break;
      case constants.LOWER_CAM:
        this.LowerCamera();
        break;
      default:
    }
  }
};

module.exports = Camera;
