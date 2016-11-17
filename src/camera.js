//camera.js

// Instance Variables

var glMatrix = require("./gl-matrix.js");
/* Be wary of the functions defined in gl-matrix! Many of them take the form of accepting the OUT 
 * parameter, such that the argument of the function will be modified in the parent context.
 * For example, see UpdateCamera(); We call glMatrix.mat4.multiply(a, b, c), the first arg is the OUT 
 * arg, so that value will be overwritten. Console log before and after to see what happens!
 */ 
var Camera = {
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

	Initialize: function() {
		this.cameraRotation = glMatrix.mat4.create();
		this.viewMatrix = glMatrix.mat4.create();
		this.cameraPosition = glMatrix.vec3.fromValues(-3, -3, 3);

		this.upVector = glMatrix.vec3.fromValues(0, 0, 1);
		this.targetVector = glMatrix.vec3.fromValues(0, 1, 0);
	},

	UpdateCamera: function() {

		this.cameraRotation = glMatrix.mat4.create();
		var upDownRotationMatrix = glMatrix.mat4.create();
		var leftRightRotationMatrix = glMatrix.mat4.create();

		glMatrix.mat4.fromZRotation(leftRightRotationMatrix, this.leftRightRotation);
		glMatrix.mat4.fromXRotation(upDownRotationMatrix, this.upDownRotation);
		glMatrix.mat4.multiply(this.cameraRotation, leftRightRotationMatrix, upDownRotationMatrix);

		var rotatedTarget = glMatrix.vec3.create();
		glMatrix.vec3.transformMat4(rotatedTarget, this.targetVector, this.cameraRotation);
		glMatrix.vec3.add(rotatedTarget, rotatedTarget, this.cameraPosition);

		var rotatedUpVector = glMatrix.vec3.create();
		glMatrix.vec3.transformMat4(rotatedUpVector, this.upVector, this.cameraRotation);

		glMatrix.mat4.lookAt(this.viewMatrix, //OUT
			this.cameraPosition, //EYE
			rotatedTarget, //CENTER
			rotatedUpVector); //UP
	},

	RotateLeft: function() {
		this.leftRightRotation += this.defaultRotationAmount;
	},

	RotateRight: function(){
		this.leftRightRotation -= this.defaultRotationAmount;
	},

	RotateUp: function(){
		this.upDownRotation += this.defaultRotationAmount;
	},

	RotateDown: function(){
		this.upDownRotation -= this.defaultRotationAmount;
	},

	RaiseCamera: function(){
		this.cameraPosition[2] += this.defaultMovementIncrement;
	},

	LowerCamera: function(){
		this.cameraPosition[2] -= this.defaultMovementIncrement;
	},

	MoveForward: function(){
		var baseVector = glMatrix.vec3.fromValues(0, 1, 0);
		glMatrix.vec3.scale(baseVector, baseVector, this.defaultMovementIncrement); //scale movement by the increment factor.
		glMatrix.vec3.transformMat4(baseVector, baseVector, this.cameraRotation);

		//Since we only move in the X-Z plane, let's add components here individually ourselves.
		this.cameraPosition[0] += baseVector[0];
		this.cameraPosition[1] += baseVector[1];
	},

	MoveBackwards: function(){
		var baseVector = glMatrix.vec3.fromValues(0, 1, 0);
		glMatrix.vec3.scale(baseVector, baseVector, this.defaultMovementIncrement); //scale movement by the increment factor.
		glMatrix.vec3.transformMat4(baseVector, baseVector, this.cameraRotation);

		//Since we only move in the X-Z plane, let's add components here individually ourselves.
		this.cameraPosition[0] -= baseVector[0];
		this.cameraPosition[1] -= baseVector[1];
	},

	StrafeLeft: function(){
		var baseVector = glMatrix.vec3.fromValues(-1, 0, 0);
		glMatrix.vec3.scale(baseVector, baseVector, this.defaultMovementIncrement); //scale movement by the increment factor.
		glMatrix.vec3.transformMat4(baseVector, baseVector, this.cameraRotation);
		
		this.cameraPosition[0] += baseVector[0];
		this.cameraPosition[1] += baseVector[1];
	}, 

	StrafeRight: function(){
		var baseVector = glMatrix.vec3.fromValues(1, 0, 0);
		glMatrix.vec3.scale(baseVector, baseVector, this.defaultMovementIncrement); //scale movement by the increment factor.
		glMatrix.vec3.transformMat4(baseVector, baseVector, this.cameraRotation);
		this.cameraPosition[0] += baseVector[0];
		this.cameraPosition[1] += baseVector[1];
	},

	GetViewMatrix: function() {
		return this.viewMatrix;
	},

	GetPositionString: function(){
		return "X: " + this.cameraPosition[0].toFixed(3) + ", Y: " + this.cameraPosition[1].toFixed(3) + ", Z: " + this.cameraPosition[2].toFixed(3);
	},

};

module.exports = Camera;
	