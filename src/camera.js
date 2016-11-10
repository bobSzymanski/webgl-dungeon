//camera.js

module.exports = {
	
// Instance Variables

	_rotationMatrix: {},
	_cameraPosition: {},
	_viewMatrix: {},
	_leftRightRotation: 0.0,
	_upDownRotation: 0.0,


// Camera Functions

	Initialize: function(){
		_rotationMatrix = Matrix.I(4);
		_viewMatrix = Matrix.I(4);


		_viewMatrix = _viewMatrix.x(Matrix.Translation($V([0, 0, -6])).ensure4x4());
		console.log("Camera initialized successfully!");
	},
	UpdateCamera: function(){

	},
	Rotate: function(angle, v){
		var inRadians = angle * Math.PI / 180.0;
		var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
		_viewMatrix = _viewMatrix.x(m);
	},
	RotateLeft: function(){

	},
	RotateRight: function(){

	},
	RotateUp: function(){

	},
	RotateDown: function(){

	},
	RaiseCamera: function(){

	},
	LowerCamera: function(){

	}, 
	MoveForward: function(){

	},
	MoveBackwards: function(){

	},
	StrafeLeft: function(){

	}, 
	StrafeRight: function(){

	},
	SetPosition: function(newPosition){

	},
	GetViewMatrix: function(){
		return _viewMatrix;
	},
	GetPosition: function(){

	}

};