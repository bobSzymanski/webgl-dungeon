import axios from 'axios';

let context;
let mainVolume;
const soundBank = [];
const orientation = [];
let currentBGM = null;

export async function loadSound(name) {
  // If the soundbank has loaded this sound, ignore this function.
  const loaded = soundBank.find((sound) => { return sound.name == name });
  if (loaded) { return Promise.resolve(false); }

  const params = {
    url: name,
    method: 'get',
    responseType: 'arraybuffer'
  }

  const res = await axios.request(params);
  const decoded = await context.decodeAudioData(res.data);
  soundBank.push({ name, buffer: decoded });
  return Promise.resolve(true);
}

// In firefox, context.listener.positionX is undefined
export function setPosition(sound, position) {

}
 
// Could maybe do some logic here to cut off futher sounds
// or calculate walls inbetween player and source???
export function playSound(name, doesLoop = false, position = null) {
  const bufferObject = soundBank.find((s) => { return s.name == name });
  if (bufferObject) {
    // Now, we have to create the audioBufferSource because it cannot be reused.
    const newSound = {}; 
    newSound.audioBufferSource = context.createBufferSource();
    newSound.volume = context.createGain();
    newSound.audioBufferSource.connect(newSound.volume);
    newSound.audioBufferSource.loop = doesLoop;
    newSound.audioBufferSource.buffer = bufferObject.buffer;

    if (position) {
      newSound.pannerNode = context.createPanner();
      //newSound.panner.setOrientation(orientation[0], orientation[1], orientation[2]);
      newSound.volume.connect(newSound.pannerNode);
      newSound.pannerNode.connect(mainVolume);

      // This feature not yet implemented on firefox, at least for me..
      if (typeof newSound.pannerNode.positionX != 'undefined') {
        newSound.pannerNode.positionX.value = position[0];
        newSound.pannerNode.positionY.value = position[1];
        newSound.pannerNode.positionZ.value = position[2];
      } else {
        newSound.pannerNode.setPosition(position[0], position[1], position[2]);
      }
    } else {
      newSound.volume.connect(mainVolume);
    }

    if (doesLoop) { // If it's a song that loops, it may be stopped. Set it to the current BGM.
      // But if something is already playing, stop it. Try to avoid this though. 
      // I don't know how well web audio handles starting and stopping songs this quickly.
      if (currentBGM) { 
        currentBGM.audioBufferSource.stop();
      }

      currentBGM = newSound;
    }
  
    newSound.audioBufferSource.start(mainVolume.currentTime);
  }
}

export function stopSong() {
  if (currentBGM) {
    currentBGM.audioBufferSource.stop();
    currentBGM = null;
  }
}

export function init() {
  // Detect if the audio context is supported.
  window.AudioContext = (
    window.AudioContext ||
    window.webkitAudioContext ||
    null
  );

  if (!AudioContext) {
    log('Could not establish audio context for this browser!');
    return;
  }

  context = new AudioContext();
  mainVolume = context.createGain();

  // Connect the main volume node to the context destination.
  mainVolume.connect(context.destination);
}

export function updatePlayer(positionVector, facingVector, upVector) {
  if (typeof context.listener.positionX != 'undefined' &&
    typeof context.listener.forwardX != 'undefined' && 
    typeof context.listener.upX != 'undefined') {
    context.listener.positionX.value = positionVector[0];
    context.listener.positionY.value = positionVector[1];
    context.listener.positionZ.value = positionVector[2];

    context.listener.forwardX.value = facingVector[0];
    context.listener.forwardY.value = facingVector[1];
    context.listener.forwardZ.value = facingVector[2];

    context.listener.upX.value = upVector[0];
    context.listener.upY.value = upVector[1];
    context.listener.upZ.value = upVector[2];
    return;
  }

  context.listener.setPosition(positionVector[0], positionVector[1], positionVector[2]);
  context.listener.setOrientation(facingVector[0], facingVector[1], facingVector[2], upVector[0], upVector[1], upVector[2]);
}

export default { init, loadSound, playSound, stopSong, updatePlayer };
