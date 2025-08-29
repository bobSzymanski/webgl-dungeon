/* Vertex shader
   This is an incredibly simple vertex shader, basically used to apply ambient lighting. 
   We currently do not have any directional lighting (although there are some unused vec3's here)
*/

precision mediump float;

// Attributes: stuff that changes per-vertex.
attribute mediump vec3 aVertexPosition;
attribute mediump vec2 aTextureCoord;
attribute mediump vec3 aVertexTranslation;

// Uniforms: stuff that is the same for all vertices.
uniform mediump float uTorchIntensity;
uniform mediump vec3 uAmbientLight;
uniform mediump vec3 uCameraPosition;
uniform mediump mat4 uVMatrix;
uniform mediump mat4 uPMatrix;
uniform mediump mat4 uWMatrix;

// The following variables get calculated here, then spit out to the fragment shader:
varying mediump vec2 vTextureCoord;
varying mediump vec3 vLighting;

float minTorchIntensity = 0.15;

void main(void) {
  mediump vec3 translatedPosition = aVertexPosition + aVertexTranslation;
  gl_Position = uPMatrix * uVMatrix * uWMatrix * vec4(translatedPosition, 1.0);
  vTextureCoord = aTextureCoord; // This gets passed to the fragment shader.
  float cameraVertexDistance = length(uCameraPosition - translatedPosition);
  float distance = abs(cameraVertexDistance);
  float intensity = uTorchIntensity / (1.0 +  (distance * distance));
  if (intensity < minTorchIntensity) {
    intensity = minTorchIntensity;
  }

  mediump vec3 light = uAmbientLight + vec3(intensity, intensity, intensity);
  vLighting = light; // This gets passed to the fragment shader.
}
