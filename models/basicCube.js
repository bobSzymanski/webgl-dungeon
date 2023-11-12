// Basic Cube

const baseCube = {
	name: "woodCrate",
	textureSourceFile: "textures/crate.png",
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
	textureMap: [
		0, 1, 1, 1, 1, 0, 0, 0,
		0, 1, 1, 1, 1, 0, 0, 0,
		0, 1, 1, 1, 1, 0, 0, 0,
		0, 1, 1, 1, 1, 0, 0, 0,
		0, 1, 1, 1, 1, 0, 0, 0,
		0, 1, 1, 1, 1, 0, 0, 0,
	],
	vertexBuffer: {},
	indexBuffer: {},
	textureCoordBuffer: {},
	textureBinding: {},
	translationVector: {}
};

export default { baseCube };
