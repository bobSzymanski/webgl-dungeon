
function round(number) {
  return parseFloat(number.toFixed(3));
}

function generateStairVertices(stairTotal) {
  const maxHeight = 0.8;
  const inverse = 1 - maxHeight;
  let vertices = [];
  let indices = [];
  let textureMap = [];

  for (var i = 0; i <= stairTotal; i++) {
    /// =====
    // Left side face:
    /// =====
    vertices.push(0);
    vertices.push(0);
    vertices.push(round(maxHeight * (i / stairTotal)));
  }

  for (var i = 0; i < stairTotal; i++) {
    // On the right hand side, there are two vertices
    const xCoord = 1 - (i / stairTotal);
    const minZ = (maxHeight * (i / stairTotal));
    const maxZ = (maxHeight * ((i + 1) / stairTotal));
    vertices.push(round(xCoord));
    vertices.push(0);
    vertices.push(round(minZ));

    vertices.push(round(xCoord));
    vertices.push(0);
    vertices.push(round(maxZ));
  }

  const firstLoopVertsLength = vertices.length / 3;

  for (var i = 0; i <= stairTotal; i++) {
    /// =====
    // Right side face: (basically y = 1 and mirrored)
    /// =====
    vertices.push(0);
    vertices.push(1);
    vertices.push(round(maxHeight * (i / stairTotal)));
  }

  for (var i = 0; i < stairTotal; i++) {
    const xCoord = 1 - (i / stairTotal);
    const minZ = (maxHeight * (i / stairTotal));
    const maxZ = (maxHeight * ((i + 1) / stairTotal));
    vertices.push(round(xCoord));
    vertices.push(1);
    vertices.push(round(minZ));

    vertices.push(round(xCoord));
    vertices.push(1);
    vertices.push(round(maxZ));
  }


  // two verts per loop * 5 loops = 10 verts added. 10 + 6 = 16;


  for (var i = 0; i < stairTotal; i++) {
    //for each stair, there are 2 triangles
    // so we should push 6 indices per stair.
    indices.push(i);
    indices.push((2 * i) + stairTotal + 1);
    indices.push((2 * i) + stairTotal + 2);

    indices.push(i);
    indices.push((2 * i) + stairTotal + 2);
    indices.push(i + 1);
  }

  var offset = 1;
  for (var i = firstLoopVertsLength; i < firstLoopVertsLength + stairTotal; i++) {
    indices.push(i);
    indices.push(i + 1);
    indices.push(i + stairTotal + offset + 1);

    indices.push(i);
    indices.push(i + stairTotal + offset + 1);
    indices.push(i + stairTotal + offset);
    offset += 1;
  }

  // Number of tex coords in this case are (vertices.length / 3) with 2 coords each vertex.
  // the second half is mirrored. 
  for (var i = 0; i < (vertices.length / 3); i++) {

    if (i < vertices.length / 6) {
      textureMap.push(round(vertices[i * 3])); //x texture coord
                                      // ADD 2 here, it's in the XZ plane!!
      textureMap.push(round(1 - vertices[(3 * i) + 2])); //y texture coord
    } else {
      textureMap.push(round(1 - vertices[i * 3])); //x texture coord
                                      // ADD 2 here, it's in the XZ plane!!
      textureMap.push(round(1 - vertices[(3 * i) + 2])); //y texture coord
    }
  }


  // Add the back side wall (basically, an east wall translated to the west wall position.)
  const newOffset = vertices.length / 3;
  const newVerts = [
    0, 1, maxHeight,
    0, 0, maxHeight,
    0, 0, 0,
    0, 1, 0
  ];

  const newInds = [
    newOffset, newOffset + 2, newOffset + 1, newOffset, newOffset + 3, newOffset + 2
  ];

  const newTexMap = [
    0, 0, 1, 0, 1, 1, 0, 1
  ];

  vertices = vertices.concat(newVerts);
  indices = indices.concat(newInds);
  textureMap = textureMap.concat(newTexMap);

  // Now for the heavy lifting, the front face of the stairs....
  const frontFaceIndex = vertices.length / 3; // store the index where we started adding new stuff

  for (var i = 0; i < stairTotal; i++) {
    vertices.push(round(1 - (i / stairTotal)));
    vertices.push(0);
    vertices.push(round(maxHeight * (i / stairTotal)));

    vertices.push(round(1 - (i / stairTotal)));
    vertices.push(1);
    vertices.push(round(maxHeight * (i / stairTotal)));

    vertices.push(round(1 - (i / stairTotal)));
    vertices.push(0);
    vertices.push(round(maxHeight * ((i + 1) / stairTotal)));

    vertices.push(round(1 - (i / stairTotal)));
    vertices.push(1);
    vertices.push(round(maxHeight * ((i + 1) / stairTotal)));
  }

  // 0 1 3, 0, 3, 2
  for (var i = 0; i < stairTotal; i ++) {
    indices.push(frontFaceIndex + (4 * i));
    indices.push(frontFaceIndex + (4 * i) + 1);
    indices.push(frontFaceIndex + (4 * i) + 3);

    indices.push(frontFaceIndex + (4 * i));
    indices.push(frontFaceIndex + (4 * i) + 3);
    indices.push(frontFaceIndex + (4 * i) + 2);
  }

  for (var i = frontFaceIndex; i < (vertices.length / 3); i++) {
    textureMap.push(round(vertices[(i * 3) + 1])); //x texture coord is the Y position on this face...
                                    // ADD 2 here, it's in the XZ plane!!
    textureMap.push(round(1 - vertices[(3 * i) + 2])); //y texture coord
  }

  let savedVertexIndexCountBeforeTop = vertices.length / 3;

  for (var i = 0; i < stairTotal; i++) {
    vertices.push(round(1 - (i / stairTotal)));
    vertices.push(0);
    vertices.push(round(maxHeight * ((i + 1) / stairTotal)));

    vertices.push(round(1 - (i / stairTotal)));
    vertices.push(1);
    vertices.push(round(maxHeight * ((i + 1) / stairTotal)));

    vertices.push(round(1 - ((i + 1) / stairTotal)));
    vertices.push(1);
    vertices.push(round(maxHeight * ((i + 1) / stairTotal)));

    vertices.push(round(1 - ((i + 1) / stairTotal)));
    vertices.push(0);
    vertices.push(round(maxHeight * ((i + 1) / stairTotal)));
  }

  let offsetInds = 0;
  for (var i = 0; i < stairTotal; i++) {
    indices.push(savedVertexIndexCountBeforeTop + offsetInds);
    indices.push(savedVertexIndexCountBeforeTop + offsetInds + 1);
    indices.push(savedVertexIndexCountBeforeTop + offsetInds + 2);

    indices.push(savedVertexIndexCountBeforeTop + offsetInds);
    indices.push(savedVertexIndexCountBeforeTop + offsetInds + 2);
    indices.push(savedVertexIndexCountBeforeTop + offsetInds + 3);
    offsetInds += 4;
  }

  for (var i = savedVertexIndexCountBeforeTop; i < (vertices.length / 3); i++) {
    textureMap.push(vertices[(3 * i) + 1]);
    textureMap.push(vertices[(3 * i)]);
  }

  console.log('vertices: [');
  for (var i = 0; i < vertices.length; i+= 3) {
    console.log(`${vertices[i]}, ${vertices[i + 1]}, ${vertices[i+2]},`);
  }
  console.log('],');


  console.log('indices: [');
  for (var i = 0; i < indices.length; i+= 3) {
    console.log(`${indices[i]}, ${indices[i + 1]}, ${indices[i+2]},`);
  }
  console.log('],');

  console.log('textureMap: [');
  for (var i = 0; i < textureMap.length; i+= 2) {
    console.log(`${textureMap[i]}, ${textureMap[i + 1]},`);
  }

  console.log('],');


  const numIndices = indices.length;
  const numVertices = vertices.length / 3;
  const numTriangles = numIndices / 3;
  const numSquares = numTriangles / 2;
  const expectedNumTexCoordPairs = numVertices;
  const actualNumTexCoordPairs = textureMap.length / 2;

  console.log(`Num vertices: ${numVertices}`);
  console.log(`Num indices: ${numIndices}`);
  console.log(`num triangles: ${numTriangles}`);
  console.log(`num squares: ${numSquares}`);
  console.log(`expected num text coord pairs: ${expectedNumTexCoordPairs}`);
  console.log(`actual num text coord pairs: ${actualNumTexCoordPairs}`);
}


generateStairVertices(5);


