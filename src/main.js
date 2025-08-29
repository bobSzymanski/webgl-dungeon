import camera from './camera.js';
import constants from './constants.js';
import drawUtils from './drawUtils.js';
import soundHandler from './soundHandler.js';
import keyBindings from'./keybinds.js';
import log from './logger.js';
import map from './map.js';
import battleUtils from './battle.js';
import bobMath from './bobMath.js';
import linearAlgebra from './linearAlgebra.js';
import modelUtils from './modelUtils.js';
import monsterUtils from './monsterUtils.js';
import shaderHandler from './shaders/shaderHandler.js';
import textureHandler from './textureHandler.js';
import stringUtils from './stringUtils.js';

const default_FOV = 70;
const default_near_Z = 0.1;
const default_far_z = 100;
const default_aspect_ratio = 1440 / 697;
const default_width = 1440; // I know
const default_height = 697; // My Mac is weird

let updateTime = 0;
let drawTime = 0;
let largestUpdateTime = 0;
let largestDrawTime = 0;
let requestId;
let shaderProgram;
let vertexPositionAttribute;
let vertexTranslationAttribute;
let textureCoordAttribute;
let gl_ex;
let projectionMatrixUniform, viewMatrixUniform, worldMatrixUniform;
let cameraPositionUniform, ambientLightUniform, torchIntensityUniform;
let pressed = false;
let debounceFrameCounter = 0;
let debounceFrameTotal = 20;
let debouncing = false;
let upDownRotation = 0;
let leftRightRotation = 0;
const rotationAmount = 0.02;
let mouseSensitivity = 0.0115; // TODO - determine reasonable scale
let battleFrameDebounceCount = 0;
let gameTicks = 0;
let torchIntensity = 1.0;
const ambientLightVector3 = [ 0.02, 0.02, 0.02 ];

// Instance Variables:
let canvas;
let gl;
let windowAspectRatio = default_aspect_ratio;
let projectionMatrix = linearAlgebra.mat4Create();
let projectionMatrixFlat;
let inBattle = false;

const pressedKeys = {};
const mouseState = {};
const previousMouseState = {};

let textNode;

const toggleCount = 120;
let toggleAmount = 0;

/* To follow the pattern from XNA, we do the following:

1) Initialize (Start)
2) LoadContent
3) Update
4) Draw

Every frame, we call Update, then Draw, just like XNA. That should occur every 1/60th of a second. (16.67ms)
My initial benchmarking using Performance.now shows Update and Draw calls happening in under 1 millisecond each.
*/

/** Start ()
 * Entry point to our JS code. It is called at the very bottom of this script.
 * @return Promise (async)
 */
async function Start() {
  canvas = document.getElementById('glcanvas');
  initWebGL(canvas); // Create the GL object

  if (!gl) {
    log(constants.config.WEBGL_UNSUPPORTED_ERR);
    return;
  }

  log('By the way, I see a 50% reduction in CPU usage in Firefox vs. Google Chrome on this 2014 Macbook Pro...');
  setResolution(default_width, default_height); // Set up the canvas at the proper resolution.
  ({ shaderProgram, vertexPositionAttribute, textureCoordAttribute } = shaderHandler.initShaders(gl)); // Load & compile our shader programs
  setGLContext(); //  Initialize the GL context
  addCanvasEventListeners(); // Add event listeners to the canvas object.
  await LoadContent(); // Loads textures, etc. uses async/await.
  createMouseLockEventListener(); // Attempt to capture the mouse.
  Update(); // Update Game logic
}

/**
 * Loads any content we need, called once after we have ensured webGL is working.
 * @return N/A
 */
async function LoadContent() {
  camera.Initialize();

  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;

  // Create references to view and projection matrices in the glsl program
  projectionMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
  viewMatrixUniform = gl.getUniformLocation(shaderProgram, 'uVMatrix');
  worldMatrixUniform = gl.getUniformLocation(shaderProgram, 'uWMatrix');

  // Create references to uniforms and attributes in the shader:
  ambientLightUniform = gl.getUniformLocation(shaderProgram, 'uAmbientLight');
  cameraPositionUniform = gl.getUniformLocation(shaderProgram, 'uCameraPosition');
  torchIntensityUniform = gl.getUniformLocation(shaderProgram, 'uTorchIntensity');

  vertexTranslationAttribute = gl.getAttribLocation(shaderProgram, 'aVertexTranslation');

  fixResolutionBug(); // I'm still not convinced this works...
  await map.initMap(gl, 'town01');

  soundHandler.init();
  await soundHandler.loadSound('./content/sounds/wotes-town.mp3');
  await soundHandler.loadSound('./content/sounds/grunt2.ogg');

  const crate = await modelUtils.createModel(gl, 'baseCube');
  crate.translationVector = [ 4.5, 4.5, 0 ];
  map.getModels().push(crate);

  const stair = await modelUtils.createModel(gl, 'staircase');
  stair.translationVector = [ 2, 2, 0 ];
  map.getModels().push(stair);

  // This is supposed to show the way the user is pointing. It translates, but does not yet rotate.
  //map.getModels().push(await modelUtils.createModel(gl, 'XYArrow'));

  drawUtils.init(worldMatrixUniform,
    vertexPositionAttribute,
    textureCoordAttribute,
    vertexTranslationAttribute,
    shaderProgram);

  battleUtils.setupBattleButtons();

  ambientLightVector3[0] = map.getAmbientLightIntensity();
  ambientLightVector3[1] = map.getAmbientLightIntensity();
  ambientLightVector3[2] = map.getAmbientLightIntensity();


  // Set the default ambient light - it probably doesn't need to change... does it?
  gl.uniform3f(ambientLightUniform,
    ambientLightVector3[0],
    ambientLightVector3[1],
    ambientLightVector3[2]);

  gl.uniform1f(torchIntensityUniform, torchIntensity.toFixed(3));
}

/** Update:
 * The main looped function of our program. Updates game logic, then draws the scene.
 * @return N/A
 */
function Update() {
  const startTime = performance.now();
  fixResolutionBug();
  Object.keys(pressedKeys).forEach((button) => {
    if (pressedKeys[button]) { // If the button was pressed...
      const keybinding = keyBindings.getKeyBinding(button); // See if it has a keybinding...
      if (!keybinding) { return; } // If not - go to the next pressedKey.
      switch (keybinding.type) { // Do different things for diff keybinds
        case constants.config.CAMERA_ACTION:
          if (battleUtils.getIsInBattle() == false) {
            camera.Action(keybinding.name, map);
          }

          break;
        case constants.config.GENERAL_KEYBINDING:
          // TODO: Something else here
          if (!debouncing && button == constants.config.ASCII_L) {
            debouncing = true;
            soundHandler.playSound("./content/sounds/wotes-town.mp3", true);
          }

          if (!debouncing && button == constants.config.ASCII_K) {
            debouncing = true;
            const cube = map.getModels().find((model) => model.name === 'cube');
            if (cube) {
              soundHandler.playSound("./content/sounds/grunt2.ogg", false, cube.translationVector);
            }
          }

          if (!debouncing && button == constants.config.ASCII_M) {
            debouncing = true;
            soundHandler.stopSong();
            loadMap('dungeon01');
          }

          if (!debouncing && button == constants.config.ASCII_J) {
            debouncing = true;
            //toggleFullScreen();
            //fullScreen(canvas);
            // if (battleUtils.getIsInBattle() == false) {
            //   battleUtils.startBattle();
            // }
          }

          break;
        default:
          break;
      }
    }
  });

  if (debouncing) {
    debounceFrameCounter+= 1;
    if (debounceFrameCounter >= debounceFrameTotal) {
      debounceFrameCounter = 0;
      debouncing = false;
    }
  }

  // TODO: Where should this happen during the update call? At the end?
  camera.UpdateCamera();
  textNode.nodeValue = camera.GetPositionString();
  textNode.nodeValue += ` slowest update: ${largestUpdateTime.toFixed(3)}, slowest draw: ${largestDrawTime.toFixed(3)}`;
  soundHandler.updatePlayer(camera.getPositionVector(), camera.getForwardVector(), [0,0,1]);

  // Jan 2025 - I don't remember what pointer is and I don't believe this is used.
  const pointArrow = map.getModels().find((model) => model.name === 'pointer');
  if (pointArrow) { // If the user pointer is drawn, move it underneath the player.
    pointArrow.translationVector[0] = camera.getPositionVector()[0] - 0.5;
    pointArrow.translationVector[1] = camera.getPositionVector()[1];
    pointArrow.translationVector[2] = camera.getPositionVector()[2] - 0.5;
  }

  const cube = map.getModels().find((model) => model.name === 'cube');
  if (cube) { // If the sample cube is to be drawn, rotate it around a bit.
    modelUtils.rotateLeftRightByAmount(cube, 0.02);
    modelUtils.rotateUpDownByAmount(cube, 0.02);
  }

  // Handle monsterGroup stuff:
  if (battleUtils.getIsInBattle() == false) {
    const worldMonsterGroups = map.getWorldMonsterGroups();
    for (var i = 0; i < worldMonsterGroups.length; i++) {
      // Also, update the flicker rate:
      if (worldMonsterGroups[i].debouncing == true) {
        worldMonsterGroups[i].debounceCount += 1;
        if (worldMonsterGroups[i].debounceCount >= constants.config.BATTLE_RUN_DEBOUNCE_FRAME_MAX) {
          worldMonsterGroups[i].debounceCount = 0;
          worldMonsterGroups[i].debouncing = false;
        }
      }

      // Also, update the models to face the player:
      const wm = worldMonsterGroups[i].worldMonsterObject.model;
      modelUtils.rotateToFaceCamera(gl, wm, camera);
    }

    if (map.didBattleBump()) {
      // We bumped into a monster. Start the battle if it's not debouncing.
      const i = map.getBumpedBattleIndex();
      if (worldMonsterGroups[i].enabled == true && worldMonsterGroups[i].debouncing == false) {
        battleUtils.startBattle(worldMonsterGroups[i]);
      }
    }
  } // end of 'is in battle' == false

  gl.uniform1f(torchIntensityUniform, torchIntensity.toFixed(3));


  gameTicks += 1;
  if (gameTicks >= constants.config.GAME_TICKS_PER_SECOND) { gameTicks = 0; }

  const endTime = performance.now();
  updateTime = endTime - startTime;
  // Then draw the frame
  Draw();
  const drawEndTime = performance.now();
  drawTime = drawEndTime - endTime;

  if (updateTime > largestUpdateTime) {
    largestUpdateTime = updateTime;
  }

  if (drawTime > largestDrawTime) {
    largestDrawTime = drawTime;
  }

  // Rinse and repeat
  requestId = requestAnimationFrame(Update, canvas);
}

/** Draw:
 * Draws everything to the screen, called once per frame (approx 60fps)
 * @return N/A
 */
function Draw() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  setMatrixUniforms();

  // For each model, set the vertices, texture, etc, then draw them.
  const models = map.getModels();
  const worldMonsterGroups = map.getWorldMonsterGroups();
  for (let i = 0; i < models.length; i++) {
    drawUtils.drawModel(gl, models[i]);
  }

  for (let i = 0; i < worldMonsterGroups.length; i++) {
    if (worldMonsterGroups[i].enabled == true ) {
      if (worldMonsterGroups[i].debouncing == false) {
        drawUtils.drawModel(gl, worldMonsterGroups[i].worldMonsterObject.model);
        continue;
      }

      // In this case, the model is alive, but debouncing. Flicker it on some interval
      if (worldMonsterGroups[i].debounceCount % constants.config.BATTLE_RUN_DEBOUNCE_FLICKER_DIVISOR <= constants.config.BATTLE_RUN_DEBOUNCE_FLICKER_TARGET) {
        drawUtils.drawModel(gl, worldMonsterGroups[i].worldMonsterObject.model);
      }
    }
  }
}

/** setResolution ( number - width, number - height)
 * Call to change the resolution of the GL canvas.
 * Also re-sets the GL viewport, updates the aspect ratio, and projection matrix.
 * @return N/A
 */
function setResolution(width, height) {
  canvas.width = width;
  canvas.height = height;
  windowAspectRatio = width / height;
  gl.viewport(0, 0, width, height);
  setupProjectionMatrix();
}

function contextLost(event) {
  log('Lost web context!');
  log(event);
  event.preventDefault();
  cancelAnimationFrame(requestId);
}

function contextGained(event) {
  log('Regained webgl context!');
  log(event);
  initWebGL();
  setGLContext();
}

function handleRightClick(event) {
  //button === 2 is from stack overflow, I'm guessing that refers to right-click being mouse button 2.
  if (event.button === 2) {
    event.preventDefault();
    return false;
  }
}

function addCanvasEventListeners() {
  canvas.addEventListener('webglcontextlost', contextLost, false);
  canvas.addEventListener('webglcontextrestored', contextGained, false);
  canvas.addEventListener('contextmenu', handleRightClick, false);
}

/**
 * Initializes our gl object.
 * @return N/A
 */
function initWebGL() {
  gl = null;

  try {
    gl = canvas.getContext(constants.config.WEBGL_CANVAS_CONTEXT);
    gl_ex = gl.getExtension('WEBGL_lose_context'); // Prep for losing context.
  } catch (e) {
    log(constants.config.WEBGL_CREATION_ERR);
  }

  if (!gl) {
    alert(constants.config.WEBGL_UNSUPPORTED_ERR); // eslint-disable-line
  }
}

function setGLContext() {
  gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
  const clearColor = constants.config.COLOR_CORNFLOWER_BLUE;
  gl.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things
  gl.enable(gl.CULL_FACE); // These two lines enable culling,
  gl.cullFace(gl.BACK); // and we set the mode to BACK face culling.

  gl.enable(gl.BLEND); // Enable blending
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Set the proper alhpa blending choice
  // Be careful with above - yes we've allowed transparency, but with backface culling, if you can see
  // into an object, it still won't render the backside unless it's defined in geometry to show that way.
}

function setupProjectionMatrix() {
  // makePerspective => (out, FOV, Aspect Ratio, near Z index, far Z index);
  projectionMatrix = makePerspective(default_FOV, // eslint-disable-line
    windowAspectRatio,
    default_near_Z,
    default_far_z);

  projectionMatrixFlat = new Float32Array(projectionMatrix.flatten());
}

function setMatrixUniforms() {
  // Set the projection, and then the view matrix.
  gl.uniformMatrix4fv(projectionMatrixUniform, false, projectionMatrixFlat);
  gl.uniformMatrix4fv(viewMatrixUniform, false, camera.GetViewMatrix());
  // Also set the camera position attribute:
  const cameraPosition = camera.getPositionVector();
  gl.uniform3f(cameraPositionUniform,
    cameraPosition[0],
    cameraPosition[1],
    cameraPosition[2]);

  gl.uniform3f(ambientLightUniform,
    ambientLightVector3[0],
    ambientLightVector3[1],
    ambientLightVector3[2]);

}

function handleKeyDown(event) {
  pressedKeys[event.keyCode] = true;
  if (gl.isContextLost()) {
    gl_ex.restoreContext();
  }
}

function handleKeyUp(event) {
  pressedKeys[event.keyCode] = false;
}

function handleMouseDown(event) {
  if (event.button === constants.config.MOUSEBUTTON_LEFT_CLICK) {
    if (debouncing == false) {
      debouncing = true;
      const cube = map.getModels().find((model) => model.name === 'cube');
      if (cube) {
        soundHandler.playSound("./content/sounds/grunt2.ogg", false, cube.translationVector);
      }
      //torchIntensity += 0.1;
    }
  }

  if (event.button === constants.config.MOUSEBUTTON_RIGHT_CLICK) {
  }
}

function handleMouseUp(event) {
  //previousMouseState.dragging = false;
}

function handleMouseMove(event) {;
  const dx = event.movementX * mouseSensitivity;
  const dy = event.movementY * mouseSensitivity;
  camera.rotateLeftRightByAmount(-1 * dx);
  camera.rotateUpDownByAmount(-1 * dy);
}

async function loadMap(mapName) {
  map.clear();
  await map.initMap(gl, mapName);

  ambientLightVector3[0] = map.getAmbientLightIntensity();
  ambientLightVector3[1] = map.getAmbientLightIntensity();
  ambientLightVector3[2] = map.getAmbientLightIntensity();

  camera.teleportToCoordinates(0.5, 0.5, 0.5);
}

/* After months of acking down this weird perspective glitch, I have
* finally (possibly) found a solution. And to me, it makes no sense... but it works.
* It seems like a race condition - some times the app loads and the perspective is wrong, and the movement
* doesn't seem to line up correctly. Doing this seems to fix it. It doesn't matter how many times I set the resolution
* to what I want, unless I change it to something else first. Then when I change the resolution to what I want,
* the perspective is corrected as it should be.
*/
function fixResolutionBug() {
  //canvas.width = 800;
  //canvas.height = 600;
  canvas.width = default_width;
  canvas.height = default_height;
}

// See: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
function lockChangeAlert() {
  if (document.pointerLockElement === canvas) {
    document.addEventListener("mousedown", handleMouseDown, false);
    document.addEventListener("mouseup", handleMouseUp, false);
    document.addEventListener("mousemove", handleMouseMove, false);
  } else {
    document.removeEventListener("mousemove", handleMouseMove, false);
    document.removeEventListener("mousedown", handleMouseDown, false);
    document.removeEventListener("mouseup", handleMouseUp, false);
  }
}

function createMouseLockEventListener() {
  // When the user clicks the page, obtain a pointer lock on the mouse.
  // Only attempt to request that lock if the lock is not set already (i.e document.pointerLockElement exists)
  canvas.addEventListener("click", async () => {
    if (!document.pointerLockElement) {
      await canvas.requestPointerLock();
    }
  });

  document.addEventListener("pointerlockchange", lockChangeAlert, false);
}

function toggleFullScreen () { // See https://stackoverflow.com/a/66438162
  // Usually we can just do this on 'canvas' but with our overlays, we want the whole div to be full screen.
  const gameContainerElement = document.getElementById('gameContainer');
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;

  if (!fullscreenElement) {
    if (gameContainerElement.requestFullscreen) { gameContainerElement.requestFullscreen() }
    else if (gameContainerElement.webkitRequestFullscreen) { gameContainerElement.webkitRequestFullscreen() }
  } else {
    if (document.exitFullscreen) { document.exitFullscreen() }
    else if (document.webkitExitFullscreen) { document.webkitExitFullscreen()}
  }
}

document.addEventListener('DOMContentLoaded', () => {
  log('DOM fully loaded and parsed. Application starting...');

  // This is how we can overlay some text.
  const textElement = document.getElementById('overlayText1');
  textNode = document.createTextNode('');
  textElement.appendChild(textNode);

  const textElement1 = document.getElementById('herospot1');
  textElement1.innerHTML = stringUtils.convertSpaces(textElement1.innerHTML);

  const textElement2 = document.getElementById('herospot2');
  textElement2.innerHTML = stringUtils.convertSpaces(textElement2.innerHTML);

  const textElement3 = document.getElementById('herospot3');
  textElement3.innerHTML = stringUtils.convertSpaces(textElement3.innerHTML);

  const textElement4 = document.getElementById('herospot4');
  textElement4.innerHTML = stringUtils.convertSpaces(textElement4.innerHTML);

  // Now start our game.
  Start();
});
