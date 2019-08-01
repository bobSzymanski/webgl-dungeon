const constants = require('./constants');

var keybinds = [
	{ name: constants.ROTATE_UP, key: constants.ASCII_UP },
	{ name: constants.ROTATE_DOWN, key: constants.ASCII_DOWN },
	{ name: constants.ROTATE_LEFT, key: constants.ASCII_LEFT },
	{ name: constants.ROTATE_RIGHT, key: constants.ASCII_RIGHT },
	{ name: constants.FORWARD, key: constants.ASCII_W },
	{ name: constants.REVERSE, key: constants.ASCII_S },
	{ name: constants.LEFT_STRAFE, key: constants.ASCII_A },
	{ name: constants.RIGHT_STRAFE, key: constants.ASCII_D },
	{ name: constants.RAISE_CAM, key: constants.ASCII_SPACE },
	{ name: constants.LOWER_CAM, key: constants.ASCII_LSHIFT }
];

export function setBinding(binding, newKey) {
	legit = keybinds.map((obj) => {
		if (obj.name === binding) { // If the binding exists...
			obj.key = newKey; // Set its associated key to newKey
		}
		return obj;
	});
};

export function getKeyBinding(keyPress) {
	let bind = keybinds.find((obj) => {
		return obj.key == keyPress;
	});

	if (bind && bind.name) { return bind.name; }
	return undefined;
}

export default { setBinding, getKeyBinding };
