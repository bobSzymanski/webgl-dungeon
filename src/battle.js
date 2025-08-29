// import { randomUUID } from 'crypto';
import monsters from './../content/monsters/monsters.js';
import map from './map.js';

let battleMonsters = [];
let in_battle = false;
let savedMonsterGroup = {};

function formatStatusText() {
  // Somehow we need hero stats here, but:
  const hero1 = { 
    name: 'BIGZEE',
    class: 'PROTECTOR',
    currentHP: 50,
    maxHP: 50,
    currentMP: 0,
    maxMP: 0,
    afflictions: []
  };

  const hero2 = { 
    name: 'HOGAR',
    class: 'DOCTOR',
    currentHP: 30,
    maxHP: 30,
    currentMP: 0,
    maxMP: 0,
    afflictions: []
  };

  const hero3 = { 
    name: 'STABBY',
    class: 'THIEF',
    currentHP: 30,
    maxHP: 30,
    currentMP: 0,
    maxMP: 0,
    afflictions: []
  };

  const hero4 = { 
    name: 'BERTOMUS',
    class: 'WIZARD',
    currentHP: 20,
    maxHP: 20,
    currentMP: 50,
    maxMP: 50,
    afflictions: []
  };
}

export function startBattle(monsterGroup) {
  if (in_battle) { return; }
  savedMonsterGroup = monsterGroup;
  // This probably needs to be async
  //Somehow obtain config being a list of monster names.
  in_battle = true;
  battleMonsters = [];

    
  // For each monster string name, create monster objects and add them to the battleMonsters list.
  for (var i = 0; i < savedMonsterGroup.names.length; i++) {
    const rootMonster = monsters.list.find((item) => { return item.name == savedMonsterGroup.names[i]; });
    const monsterInstance = structuredClone(rootMonster);
    battleMonsters.push(monsterInstance);
  }

  // Now for each battleMonster, add them to the battlefield via HTML / CSS elements.
  for (var i = 0; i < battleMonsters.length; i++) {
    addMonster(battleMonsters[i]);
  }

  // Toggle the UI overlay to show, and release the cursor lock so the user can click buttons.
  const overlay = document.getElementById('battleoverlay');
  overlay.style.display = 'grid';
  document.exitPointerLock();
}

function addMonster(mons) {
  const monsterElement = document.createElement('img');
  monsterElement.id = self.crypto.randomUUID(); // randomUUID();
  monsterElement.src = '/content/textures/pixel.png'; //mons.textureSourceFile;
  monsterElement.className = 'monster';
  // Now after setting the class name, define the pixel area that the sprite occupies....
  // we can also edit: background: url('/content/textures/monsters/01.png') 0 0;
  // left, width, and the above coordinates should allow picking of the monster sprite from the sheet

  monsterElement.style.background = `url('${mons.textureSourceFile}')`;
  monsterElement.style.backgroundPosition = `${-1 * mons.spriteTextureCoordX}px ${-1 * mons.spriteTextureCoordY}px`;
  monsterElement.style.width = `${mons.spriteWidth}px`;
  monsterElement.style.height = `${mons.spriteHeight}px`;
  monsterElement.style.marginTop = '5%'; //TODO: Does the monster need to define this or is this fine as a universal const?
  monsterElement.style.scale = mons.textureScale;
  document.getElementById('monsterarea').appendChild(monsterElement);
  mons.element = monsterElement;
}

function attackMonster(mons, amount) {
  mons.currentHP -= amount;
  mons.element.style.scale -= (mons.currentHP / mons.maxHP);
  if (mons.currentHP <= 0) {
    killMonster(mons);
    updateState(); // If there are no monsters left, end the battle.
  }
}

export function stopBattle() {
  if (!in_battle) { return; }
  in_battle = false;
  const overlay = document.getElementById('battleoverlay');
  const monsterArea = document.getElementById('monsterarea');

  // Remove all children elements from the monster area
  while (monsterArea.firstChild) {
    monsterArea.removeChild(monsterArea.lastChild);
  }

  // If we did not run away, remove the monsters from the map, too.
  if (battleMonsters.length <= 0) {
    map.destroyMonsterGroup(savedMonsterGroup);
  } else {
    savedMonsterGroup.debouncing = true;
  }

  // These should be the last things we do:
  battleMonsters = [];
  savedMonsterGroup = [];
  overlay.style.display = 'none';
}

export function getIsInBattle() {
  return in_battle;
}

function battleAttackButtonClicked(event) {
  const randomIndex = Math.floor(Math.random() * battleMonsters.length);
  attackMonster(battleMonsters[randomIndex], 10);
}

function battleSkillsButtonClicked(event) {

}

function battleSpecialButtonClicked(event) {

}

function battleMagicButtonClicked(event) {

}

function battleItemButtonClicked(event) {

}

function battleRunButtonClicked(event) {
  stopBattle();
}

export function setupBattleButtons() {
  const attackElement = document.getElementById('attackbutton');
  attackElement.addEventListener('click', battleAttackButtonClicked);

  const skillsElement = document.getElementById('skillbutton');
  skillsElement.addEventListener('click', battleSkillsButtonClicked);

  const specialElement = document.getElementById('specialbutton');
  specialElement.addEventListener('click', battleSpecialButtonClicked);

  const magicElement = document.getElementById('magicbutton');
  magicElement.addEventListener('click', battleMagicButtonClicked);

  const itemElement = document.getElementById('itembutton');
  itemElement.addEventListener('click', battleItemButtonClicked);

  const runElement = document.getElementById('runbutton');
  runElement.addEventListener('click', battleRunButtonClicked);
}

function updateState() {
  if (in_battle) {
    if (battleMonsters.length <= 0) {
      stopBattle();
    }
  }
}

function killMonster(monsterX) { // TODO: This should probably do more...
  battleMonsters = battleMonsters.filter((mo) => { return mo.element.id != monsterX.element.id; });
  const monsterAreaElement = document.getElementById('monsterarea');
  monsterAreaElement.removeChild(monsterX.element);
}

export default { getIsInBattle, setupBattleButtons, startBattle, stopBattle };
