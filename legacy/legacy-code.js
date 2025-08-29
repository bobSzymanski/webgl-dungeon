function jitter() {
  // "jitter" the cubes by adding and subtracting a random offset to all cubes X,Y,Z positions
   models.forEach(model => {
    model.translationVector[0] += Math.random();
    model.translationVector[1] += Math.random();
    model.translationVector[2] += Math.random();

    model.translationVector[0] -= Math.random();
    model.translationVector[1] -= Math.random();
    model.translationVector[2] -= Math.random();
  });
}


  // Do this if you want to rotate a thing around for no reason:
  // modelUtils.rotateLeftRightByAmount(monsters[0].model, 0.02);
  //modelUtils.rotateUpDownByAmount(monsters[0].model, 0.02);