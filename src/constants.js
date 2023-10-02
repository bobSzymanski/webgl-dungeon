module.exports = {
  
  COLOR_CORNFLOWER_BLUE: {
    r: 0.392,
    g: 0.584,
    b: 0.929,
    a: 1.0
  },
  WEBGL_UNSUPPORTED_ERR: 'Error initializing WebGL! Please esure your browser is compatible.',
  WEBGL_CREATION_ERR: 'Error creating WebGL device!',
  WEBGL_CANVAS_CONTEXT: 'webgl', //'experimental-webgl',

  // Default key bindings:
  ASCII_W: 87,
  ASCII_S: 83,
  ASCII_A: 65,
  ASCII_D: 68,
  ASCII_L: 76,
  ASCII_UP: 38,
  ASCII_DOWN: 40,
  ASCII_LEFT: 37,
  ASCII_RIGHT: 39,
  ASCII_SPACE: 32,
  ASCII_LSHIFT: 16,
  ASCII_ESCAPE: 27,

  // Camera Actions:

  ROTATE_UP: 'ROTATE_UP',
  ROTATE_DOWN: 'ROTATE_DOWN',
  ROTATE_LEFT: 'ROTATE_LEFT',
  ROTATE_RIGHT: 'ROTATE_RIGHT',

  FORWARD: 'FORWARD',
  REVERSE: 'REVERSE',
  LEFT_STRAFE: 'LEFT_STRAFE',
  RIGHT_STRAFE: 'RIGHT_STRAFE',

  RAISE_CAM: 'RAISE_CAM',
  LOWER_CAM: 'LOWER_CAM',

  // General Actions:
  REFRESH: 'REFRESH',

  // Engine Actions:
  EXIT: 'EXIT',

  // Action types:
  CAMERA_ACTION: 'CAMERA_ACTION',
  GENERAL_KEYBINDING: 'GENERAL',
  ENGINE_KEYBINDS: 'ENGINE'
};
