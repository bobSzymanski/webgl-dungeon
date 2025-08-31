
import cookies from './cookies.js';

/* user settings are primarily tied to cookies. If the user has opted out of cookies, the 
   settings can really only be applied to the current session. */ 

// TODO: Define all user controlled settings here:
const userOptions = {
  cookieConsent: false,
  brightness: 0
};

// It is expected that the min/max allowable values are determined by the caller - this simply does the action.
export function setValue(name, value) {
  userOptions[name] = value;
  cookies.setValue(name, value);
}

export function getValue(name) {
  const fromCookie = getCookie(name);
  if (fromCookie) { return fromCookie; };
  return userOptions[name];
}

export default {
  getValue,
  setValue
}