import constants from './constants.js';

/* keybinds have 3 properties:
 name - describes what the keybind does
 key - the default key that it is bound to
 type - the category of the action, (i.e camera movement, player input, game control, etc)
 */ 

let keybinds = [
  { name: constants.config.ROTATE_UP, key: constants.config.ASCII_UP, type: constants.config.CAMERA_ACTION },
  { name: constants.config.ROTATE_DOWN, key: constants.config.ASCII_DOWN, type: constants.config.CAMERA_ACTION  },
  { name: constants.config.ROTATE_LEFT, key: constants.config.ASCII_LEFT, type: constants.config.CAMERA_ACTION  },
  { name: constants.config.ROTATE_RIGHT, key: constants.config.ASCII_RIGHT, type: constants.config.CAMERA_ACTION  },
  { name: constants.config.FORWARD, key: constants.config.ASCII_W, type: constants.config.CAMERA_ACTION  },
  { name: constants.config.REVERSE, key: constants.config.ASCII_S, type: constants.config.CAMERA_ACTION  },
  { name: constants.config.LEFT_STRAFE, key: constants.config.ASCII_A, type: constants.config.CAMERA_ACTION  },
  { name: constants.config.RIGHT_STRAFE, key: constants.config.ASCII_D, type: constants.config.CAMERA_ACTION  },
  { name: constants.config.RAISE_CAM, key: constants.config.ASCII_SPACE, type: constants.config.CAMERA_ACTION  },
  { name: constants.config.LOWER_CAM, key: constants.config.ASCII_LSHIFT, type: constants.config.CAMERA_ACTION  },
  { name: constants.config.REFRESH, key: constants.config.ASCII_L, type: constants.config.GENERAL_KEYBINDING  },
  { name: constants.config.TESTACTION1, key: constants.config.ASCII_K, type: constants.config.GENERAL_KEYBINDING  },
  { name: constants.config.TESTACTION2, key: constants.config.ASCII_M, type: constants.config.GENERAL_KEYBINDING  },
  { name: constants.config.TESTACTION3, key: constants.config.ASCII_J, type: constants.config.GENERAL_KEYBINDING  },
  { name: constants.config.INCREMENT_VALUE, key: constants.config.ASCII_EQUALS, type: constants.config.GENERAL_KEYBINDING  },
  { name: constants.config.DECREMENT_VALUE, key: constants.config.ASCII_MINUS, type: constants.config.GENERAL_KEYBINDING  },
  { name: constants.config.EXIT, key: constants.config.ASCII_ESCAPE, type: constants.config.ENGINE_KEYBINDS  }
];

export function setBinding(binding, newKey) {
  const legit = keybinds.map((obj) => {
    if (obj.name === binding) { // If the binding exists..
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
