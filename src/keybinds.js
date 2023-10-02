const constants = require('./constants');

/* keybinds have 3 properties:
 name - describes what the keybind does
 key - the default key that it is bound to
 type - the category of the action, (i.e camera movement, player input, game control, etc)
 */ 

let keybinds = [
  { name: constants.ROTATE_UP, key: constants.ASCII_UP, type: constants.CAMERA_ACTION },
  { name: constants.ROTATE_DOWN, key: constants.ASCII_DOWN, type: constants.CAMERA_ACTION  },
  { name: constants.ROTATE_LEFT, key: constants.ASCII_LEFT, type: constants.CAMERA_ACTION  },
  { name: constants.ROTATE_RIGHT, key: constants.ASCII_RIGHT, type: constants.CAMERA_ACTION  },
  { name: constants.FORWARD, key: constants.ASCII_W, type: constants.CAMERA_ACTION  },
  { name: constants.REVERSE, key: constants.ASCII_S, type: constants.CAMERA_ACTION  },
  { name: constants.LEFT_STRAFE, key: constants.ASCII_A, type: constants.CAMERA_ACTION  },
  { name: constants.RIGHT_STRAFE, key: constants.ASCII_D, type: constants.CAMERA_ACTION  },
  { name: constants.RAISE_CAM, key: constants.ASCII_SPACE, type: constants.CAMERA_ACTION  },
  { name: constants.LOWER_CAM, key: constants.ASCII_LSHIFT, type: constants.CAMERA_ACTION  },
  { name: constants.REFRESH, key: constants.ASCII_L, type: constants.GENERAL_KEYBINDING  },
  { name: constants.EXIT, key: constants.ASCII_ESCAPE, type: constants.ENGINE_KEYBINDS  },
];

export function setBinding(binding, newKey) {
  const legit = keybinds.map((obj) => {
    if (obj.name === binding) { // If the binding exists...
      Object.assign(obj, { key: newKey }); // Set its associated key to newKey
    }
    return obj;
  });

  keybinds = legit;
}

export function getKeyBinding(keyPress) {
  const bind = keybinds.find((obj) => {
    return obj.key == keyPress; // eslint-disable-line
  });

  if (bind) { return bind; }
  return undefined;
}

export function getKeyBindingName(keyPress) {
  const bind = keybinds.find((obj) => {
    return obj.key == keyPress; // eslint-disable-line
  });

  if (bind && bind.name) { return bind.name; }
  return undefined;
}

export default { setBinding, getKeyBinding };
