// Basic Cube

const baseCube = {
	name: "woodCrate",
	textureSourceFile: "textures/six-faces.png",
	vertices: [
		//Front face
		0, 0, 0,
		1, 0, 0,
		1, 0, 1,
		0, 0, 1,

		//Top face
		0, 0, 1,
		1, 0, 1,
		1, 1, 1,
		0, 1, 1, 

		//Right face
		1, 0, 0,
		1, 1, 0,
		1, 1, 1,
		1, 0, 1,

		//Left face
		0, 1, 0, 
		0, 0, 0,
		0, 0, 1,
		0, 1, 1,

		//Bottom face
		0, 1, 0,
		1, 1, 0,
		1, 0, 0,
		0, 0, 0,

		//Back face
		1, 1, 0,
		0, 1, 0,
		0, 1, 1,
		1, 1, 1, 
	],
	indices: [
		0, 1, 2, 0, 2, 3,
		4, 5, 6, 4, 6, 7,
		8, 9, 10, 8, 10, 11,
		12, 13, 14, 12, 14, 15,
		16, 17, 18, 16, 18, 19,
		20, 21, 22, 20, 22, 23,
	],

	// This is a texture map for a single image, tiled across all faces:
	// textureMap: [
	// 	0, 1, 1, 1, 1, 0, 0, 0,
	// 	0, 1, 1, 1, 1, 0, 0, 0,
	// 	0, 1, 1, 1, 1, 0, 0, 0,
	// 	0, 1, 1, 1, 1, 0, 0, 0,
	// 	0, 1, 1, 1, 1, 0, 0, 0,
	// 	0, 1, 1, 1, 1, 0, 0, 0,
	// ],

	// This is the new texture map that uses a 2x4 grid of squares. Note that 2 squares end up unused,
	// because WebGL demands texture dimensions have a length of a power of 2.
	textureMap: [
		0, 0.25, 0.5, 0.25, 0.5, 0, 0, 0,
		0.5, 0.25, 1, 0.25, 1, 0, 0.5, 0,
		0, 0.5, 0.5, 0.5, 0.5, 0.25, 0, 0.25,
		0.5, 0.5, 1, 0.5, 1, 0.25, 0.5, 0.25,
		0, 0.75, 0.5, 0.75, 0.5, 0.5, 0, 0.5,
		0.5, 0.75, 1, 0.75, 1, 0.5, 0.5, 0.5,
	],
	vertexBuffer: {},
	indexBuffer: {},
	textureCoordBuffer: {},
	textureBinding: {},
	translationVector: {}
};

export default { baseCube };
