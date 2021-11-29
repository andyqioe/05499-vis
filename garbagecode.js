for (let x = 0; x < amount; x++) {
   for (let y = 0; y < amount; y++) {
     for (let z = 0; z < amount; z++) {
       mesh.getMatrixAt(i, matrix);
       /* dummy.position.set(offset - x, offset - y, offset - z);
       dummy.rotation.y =
         Math.sin(x / 4 + time) +
         Math.sin(y / 4 + time) +
         Math.sin(z / 4 + time);
       dummy.rotation.z = dummy.rotation.y * 2;
            
       dummy.updateMatrix(); */

       /* Decompose matrix, update positioning, and reupdate */
       let a = generateRandomIndex();

       matrix.decompose(position, quaternion, scale);
       scale.y *= a;
       scale.x *= a;
       scale.z *= a;
       matrix.compose(position, quaternion, scale);
       mesh.setColorAt(i, pickColor());
       mesh.setMatrixAt(i, matrix);
       i++;
     }
   }
 }


 /* ****************************************************************************
 * pickColor
 *
 *
 * converts social reputation to colorindex
 */
function pickColor(i, state) {
  let val = state[i]["reputation"]
	/* Bad rep */
	if (0 <= val && val < 0.125) {
		return colorArray[0]
	}
	/* Kinda-bad rep */
	else if (0.125 <= val && val < 0.375) {
		return colorArray[1]
	}
	/* neutral rep */
	else if (0.375 <= val && val < 0.625) {
		return colorArray[2]
	}
	/* Good rep */
	else if (0.625 <= val && val < 0.875) {
		return colorArray[3]
	}
	/* Perfect rep */
	else if (0.875 <= val && val <= 1) {
		return colorArray[4]
	}
}