//import 'fs';

const fs = require('fs');
const fileName = 'levelScale.txt'

// const array = [];
// for (var i = 0; i < 100; i++) {
// 	array[i] = Math.floor(Math.random() * 16);
// }

// csv = fs.writeFileSync(fileName, array.toString());
// console.log('Done');





// const xp = 30;

// const array = [];
// array.push(xp);

// for (var i = 1; i < 50; i++) {
// 	const amount = array[i - 1];
// 	const multiple = amount * 1.5;
// 	array.push(Math.floor(multiple));
// }

// const csv = fs.writeFileSync(fileName, array.toString());
// console.log('Done');




const levels = [];
const multiple = 4;
const divisor = 5;
const minOffset = 3;
function getXPForLevel(level) {
	return Math.floor((multiple * (level * level * level)) / divisor);
}

//levels.push(baseXP);

for (var i = minOffset; i < 50 + minOffset; i++) {
	levels.push(getXPForLevel(i));
}

const csv = fs.writeFileSync(fileName, levels.toString());
console.log('Done');
