
const logLevel = 'default'; // TODO: Support config driven log-level

export function log(str) {
  console.log(str); // eslint-disable-line
}

export function debug(str) {
  if (logLevel == 'debug') {
    log(str);
  }
}

export default { 
  debug,
  log
};
