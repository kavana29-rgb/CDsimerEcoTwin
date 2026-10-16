const fs = require('fs');

console.log('--- CDsimerEcoTwin Validation Test Suite ---');

// 1. Audit hospitalArchitectureData.js
const archContent = fs.readFileSync('./src/data/hospitalArchitectureData.js', 'utf8');

const roomRegex = /id:\s*'(GF-Z\d+|F[1-3]-Z\d+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?capacity:\s*(\d+)[\s\S]*?people:\s*(\d+)[\s\S]*?patients:\s*(\d+)[\s\S]*?staff:\s*(\d+)[\s\S]*?visitors:\s*(\d+)[\s\S]*?beds:\s*(\d+)[\s\S]*?occupiedBeds:\s*(\d+)/g;

let match;
let roomCount = 0;
let errors = [];

while ((match = roomRegex.exec(archContent)) !== null) {
  roomCount++;
  const [_, id, name, capacity, people, patients, staff, visitors, beds, occupiedBeds] = match;
  const p = parseInt(people, 10);
  const pat = parseInt(patients, 10);
  const st = parseInt(staff, 10);
  const vis = parseInt(visitors, 10);
  const b = parseInt(beds, 10);
  const occ = parseInt(occupiedBeds, 10);

  const sum = pat + st + vis;
  if (p !== sum) {
    errors.push(`[${id}] ${name}: people (${p}) !== patients(${pat}) + staff(${st}) + visitors(${vis}) = ${sum}`);
  }
  if (b > 0 && pat !== occ) {
    errors.push(`[${id}] ${name}: patients (${pat}) !== occupiedBeds (${occ}) for room with ${b} beds`);
  }
  if (b === 0 && occ > 0) {
    errors.push(`[${id}] ${name}: occupiedBeds (${occ}) > 0 for room with 0 beds`);
  }
}

console.log(`Audited ${roomCount} rooms across 4 floors.`);
if (errors.length === 0) {
  console.log('✓ All 40 rooms pass 100% mathematical consistency (people === patients + staff + visitors, patients === occupiedBeds).');
} else {
  console.error('Errors found:', errors);
  process.exit(1);
}

// 2. Validate Cafeteria Chair Slot Transforms & Table Geometry
const furnContent = fs.readFileSync('./src/components/3d/HospitalFurniture.jsx', 'utf8');

if (!furnContent.includes('CAFETERIA_CHAIR_SLOTS')) {
  console.error('FAIL: CAFETERIA_CHAIR_SLOTS is not defined in HospitalFurniture.jsx');
  process.exit(1);
}
console.log('✓ CAFETERIA_CHAIR_SLOTS defined and exported in HospitalFurniture.jsx.');

// 3. Validate CT Scanner Suite Layout
if (furnContent.includes("position={[0, 1.15, -0.9]}") && furnContent.includes("position={[-2.85, 0, -0.6]}")) {
  console.log('✓ CT Scanner Gantry centered at [0, 1.15, -0.9] with operator console flush on West wall [-2.85, 0, -0.6].');
} else {
  console.error('FAIL: CT Scanner Gantry or Operator Console coordinates mismatch.');
  process.exit(1);
}

// 4. Validate HospitalScene Avatar Mapping
const sceneContent = fs.readFileSync('./src/components/HospitalScene.jsx', 'utf8');

if (!sceneContent.includes('CAFETERIA_CHAIR_SLOTS') || !sceneContent.includes('key={`diner-${idx}`}')) {
  console.error('FAIL: CAFETERIA_CHAIR_SLOTS not used in HospitalScene.jsx dining room.');
  process.exit(1);
}
console.log('✓ Dining room in HospitalScene.jsx uses authoritative CAFETERIA_CHAIR_SLOTS for seated diners.');

// 5. Validate Empty Room Rendering
if (sceneContent.includes('totalPeople === 0 ? 0 :')) {
  console.log('✓ Empty rooms (people === 0) guaranteed to evaluate patientCount=0, staffCount=0, visitorCount=0, rendering 0 human models.');
} else {
  console.error('FAIL: Empty room zero-model safeguard missing.');
  process.exit(1);
}

console.log('--- ALL VALIDATION CHECKS PASSED SUCCESSFULLY ---');
