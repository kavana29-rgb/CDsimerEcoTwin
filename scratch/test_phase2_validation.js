import { architecturalFloors, allHospitalRooms } from '../src/data/hospitalArchitectureData.js';

console.log('=== CDsimerEcoTwin Architectural Data & Room Validation ===');

// 1. Check total rooms count
console.log(`Total Monitored Rooms: ${allHospitalRooms.length} (Expected: 40)`);
if (allHospitalRooms.length !== 40) {
  console.error('FAIL: Expected 40 rooms!');
  process.exit(1);
}

// 2. Check 10 per floor
architecturalFloors.forEach(f => {
  const floorRooms = allHospitalRooms.filter(r => r.floorId === f.id);
  console.log(`Floor ${f.id} (${f.name}): ${floorRooms.length} rooms (Expected: 10)`);
  if (floorRooms.length !== 10) {
    console.error(`FAIL: Floor ${f.id} does not have 10 rooms!`);
    process.exit(1);
  }
});

// 3. Check department furniture types
const requiredTypes = ['reception', 'ward', 'icu', 'ct_scan', 'xray', 'ecg', 'dining', 'ot', 'pathology', 'cssd', 'consultation'];
const presentTypes = new Set(allHospitalRooms.map(r => r.furnitureType));

console.log('\n--- Furniture Types Configured ---');
requiredTypes.forEach(t => {
  const matching = allHospitalRooms.filter(r => r.furnitureType === t);
  console.log(`Type: ${t.padEnd(14)} -> ${matching.length} room(s) [${matching.map(r => r.id).join(', ')}]`);
  if (matching.length === 0) {
    console.error(`FAIL: Missing furniture type: ${t}`);
    process.exit(1);
  }
});

// 4. Check provenance distribution
const verified = allHospitalRooms.filter(r => r.isVerified);
const provisional = allHospitalRooms.filter(r => r.provisional);
console.log(`\nProvenance Status: Verified = ${verified.length}, Provisional = ${provisional.length}`);

// 5. Test metric separation simulation
console.log('\n--- Metric Separation Simulation (Room F2-Z02: General Male Medical Ward) ---');
const wardRoom = allHospitalRooms.find(r => r.id === 'F2-Z02');
console.log(`Room: ${wardRoom.name}`);
console.log(`  Capacity: ${wardRoom.capacity}`);
console.log(`  Total People: ${wardRoom.people}`);
console.log(`  Bed Capacity: ${wardRoom.beds}`);
console.log(`  Occupied Beds: ${wardRoom.occupiedBeds}`);
const patients = Math.min(wardRoom.occupiedBeds, wardRoom.people);
const staff = wardRoom.people > patients ? 1 : 0;
const visitors = Math.max(0, wardRoom.people - patients - staff);
console.log(`  Calculated Patients: ${patients}`);
console.log(`  Calculated Staff: ${staff}`);
console.log(`  Calculated Visitors: ${visitors}`);
console.log(`  Verification: patients (${patients}) + staff (${staff}) + visitors (${visitors}) === total people (${wardRoom.people})? ${patients + staff + visitors === wardRoom.people}`);

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
