
attribute highp vec3 aVertexPosition;
attribute highp vec2 aTextureCoord;
uniform highp mat4 uMVMatrix;
uniform highp mat4 uPMatrix;
varying highp vec2 vTextureCoord;
varying highp vec3 vLighting;

void main(void) {
	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
	vTextureCoord = aTextureCoord;
	highp vec3 ambientLight = vec3(0.6, 0.6, 0.6);
	highp vec3 directionalLightColor = vec3(0.5, 0.5, 0.75);
	highp vec3 directionalVector = vec3(0.85, 0.8, 0.75);
	vLighting = ambientLight;
}
