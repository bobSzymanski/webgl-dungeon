/* Vertex shader
   This is an incredibly simple vertex shader, basically used to apply ambient lighting. 
   We currently do not have any directional lighting (although there are some unused vec3's here)
*/ 

attribute highp vec3 aVertexPosition;
attribute highp vec2 aTextureCoord;
uniform highp vec3 aVertexTranslation;
uniform highp mat4 uMVMatrix;
uniform highp mat4 uPMatrix;
varying highp vec2 vTextureCoord;
varying highp vec3 vLighting;

void main(void) {
	highp vec3 translatedPosition = aVertexPosition + aVertexTranslation;
	gl_Position = uPMatrix * uMVMatrix * vec4(translatedPosition, 1.0);
	vTextureCoord = aTextureCoord;
	highp vec3 ambientLight = vec3(0.6, 0.6, 0.6);
	highp vec3 directionalLightColor = vec3(0.5, 0.5, 0.75);
	highp vec3 directionalVector = vec3(0.85, 0.8, 0.75);
	vLighting = ambientLight;
}
