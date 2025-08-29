import modelUtils from './modelUtils.js';
import monsters from './../content/monsters/monsters.js';

const modelName = 'worldMonsterSprite';

export async function createWorldMonster(gl, name, position, overrides = {}) { // TODO, will this ever use overrides??? why should it
  const rootMonster = monsters.list.find((monster) => { return monster.name == name; });
  let monster = structuredClone(rootMonster);
  monster = { ...monster, ...overrides };

  const textureMap = [
    monster.modelTextureCoordMinX, monster.modelTextureCoordMinY, 
    monster.modelTextureCoordMaxX, monster.modelTextureCoordMinY, 
    monster.modelTextureCoordMaxX, monster.modelTextureCoordMaxY, 
    monster.modelTextureCoordMinX, monster.modelTextureCoordMaxY,
    monster.modelTextureCoordMinX, monster.modelTextureCoordMinY, 
    monster.modelTextureCoordMaxX, monster.modelTextureCoordMinY, 
    monster.modelTextureCoordMaxX, monster.modelTextureCoordMaxY, 
    monster.modelTextureCoordMinX, monster.modelTextureCoordMaxY
  ];

  // right here we somehow need to calculate and then override
  // the texture coordinates based on the stuff stored in monsters.js for this particular sprite.
  const modelOverrides = {
    textureSourceFile: monster.textureSourceFile,
    textureMap
  }

  monster.model = await modelUtils.createModel(gl, modelName, modelOverrides);
  monster.model.translationVector[0] = position[0];
  monster.model.translationVector[1] = position[1];
  monster.model.translationVector[2] = position[2];

  return monster;
}

export default { createWorldMonster };
