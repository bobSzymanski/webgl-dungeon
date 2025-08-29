import log from './logger.js';
import heroes from './../content/heroes/heroes.js';

function createHero(heroName, heroClass) {
  const classObj = heroes.heroClasses.find((cl) => { return cl.name === heroClass; });
  if (!classObj) { 
    log(`No such class ${heroClass}, pick another.`);
  }

  // Clone the base hero stats:
  const heroCopy = structuredClone(classObj);

  // Initialize common stats:
  heroCopy.name = heroName;
  heroCopy.xp = 0;
  heroCopy.level = 1;

  return heroCopy;
}


