import { 
  allHospitalRooms, 
  architecturalFloors,
  initialSimulatorPolicies
} from '../src/data/hospitalArchitectureData.js';
import { sustainabilityDefaults } from '../src/data/hospitalData.js';

import {
  calculateEnergyMetrics,
  calculateSolarAndEvIntegration,
  calculateWaterMetrics,
  calculatePaperMetrics,
  calculateWasteMetrics,
  generateSustainabilityRecommendations,
  getVentilationClassification,
  SUSTAINABILITY_CONSTANTS
} from '../src/data/sustainabilityEngine.js';

console.log('========================================================');
console.log('CDsimerEcoTwin — PHASE 3 COMPREHENSIVE VALIDATION SUITE');
console.log('========================================================\n');

let failedTests = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failedTests++;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

// 1. Exactly 40 configured zones (10 per floor across GF, F1, F2, F3)
assert(allHospitalRooms.length === 40, `Exactly 40 rooms configured in total (got ${allHospitalRooms.length})`);

['GF', 'F1', 'F2', 'F3'].forEach(fId => {
  const count = allHospitalRooms.filter(r => r.floorId === fId).length;
  assert(count === 10, `Floor ${fId} has exactly 10 zones configured (got ${count})`);
});

// 2. Energy & Electricity Calculations
const energy = calculateEnergyMetrics(allHospitalRooms, {
  electricityTariff: 8.50,
  gridEmissionFactor: 0.70
});

assert(energy.totalInstantKw > 0, `Total instantaneous power calculated: ${energy.totalInstantKw.toFixed(2)} kW`);
assert(energy.totalLightingKw > 0, `Total lighting load: ${energy.totalLightingKw.toFixed(2)} kW`);
assert(energy.totalHvacKw > 0, `Total HVAC load: ${energy.totalHvacKw.toFixed(2)} kW`);
assert(energy.totalEquipmentKw > 0, `Total equipment load: ${energy.totalEquipmentKw.toFixed(2)} kW`);
assert(Math.abs(energy.totalInstantKw - (energy.totalLightingKw + energy.totalHvacKw + energy.totalEquipmentKw)) < 0.001,
  'Instantaneous power equals sum of lighting + HVAC + equipment');

// Verify floor breakdown sums match total
let sumFloorKw = 0;
Object.values(energy.floorBreakdown).forEach(f => {
  sumFloorKw += f.powerKw;
});
assert(Math.abs(sumFloorKw - energy.totalInstantKw) < 0.001, 
  `Floor breakdown sum (${sumFloorKw.toFixed(2)} kW) exactly matches building total (${energy.totalInstantKw.toFixed(2)} kW)`);

// Verify department breakdown sums match total
let sumDeptKw = 0;
Object.values(energy.departmentBreakdown).forEach(d => {
  sumDeptKw += d.powerKw;
});
assert(Math.abs(sumDeptKw - energy.totalInstantKw) < 0.001,
  `Department breakdown sum (${sumDeptKw.toFixed(2)} kW) exactly matches building total (${energy.totalInstantKw.toFixed(2)} kW)`);

// 3. Solar PV & Solar EV Charging Integration with STRICT ZERO DOUBLE-COUNTING
const solar = calculateSolarAndEvIntegration(energy.grossDailyKwh, {
  solarCapacityKwp: 25.0,
  evDailyDemandKwh: 48.0,
  evSolarSharePct: 30.0,
  electricityTariff: 8.50,
  gridEmissionFactor: 0.70,
});

assert(solar.totalSolarGenKwh === 25.0 * 4.4, `Solar generation matches 25 kWp * 4.4 kWh/kWp: ${solar.totalSolarGenKwh} kWh`);
assert(solar.solarToEvActual + solar.solarToHospitalActual <= solar.totalSolarGenKwh + 0.0001,
  `STRICT NON-DOUBLE-COUNTING PROVEN: Solar to EV (${solar.solarToEvActual.toFixed(1)} kWh) + Solar to Hospital (${solar.solarToHospitalActual.toFixed(1)} kWh) <= Total Solar Gen (${solar.totalSolarGenKwh.toFixed(1)} kWh)`);

// 4. Zero Baseline Safety Check
const zeroBaselineSolar = calculateSolarAndEvIntegration(0, {
  solarCapacityKwp: 0,
  evDailyDemandKwh: 0,
  evSolarSharePct: 0
});
assert(zeroBaselineSolar.hospitalSolarCoveragePct === '0.0', 'Zero baseline safely produces 0.0% without division-by-zero errors');

// 5. Water Management & Intensity Metrics
const water = calculateWaterMetrics(allHospitalRooms, {
  waterTariffPerKL: 45.0,
  lowFlowReductionPct: 25
});
assert(water.baselineDailyLitres > 0, `Baseline daily water consumption: ${water.baselineDailyLitres} L/day`);
assert(water.savedDailyLitres === water.baselineDailyLitres * 0.25, `25% low flow reduction matches: ${water.savedDailyLitres} L/day`);
assert(parseFloat(water.litresPerBedDay) > 0, `Water intensity per bed-day: ${water.litresPerBedDay} L/bed-day`);
assert(parseFloat(water.litresPerPersonDay) > 0, `Water intensity per person-day: ${water.litresPerPersonDay} L/person-day`);
assert(water.highConsumerZones.length >= 3, `High consumer zones detected (CSSD, Dialysis, Dining, etc.): ${water.highConsumerZones.length} zones`);

// 6. Paper Consumption & Digitization
const paper = calculatePaperMetrics({
  baselineSheets: 1200,
  digitalWorkflowReductionPct: 70
});
assert(paper.savedSheetsDaily === 840, `70% digital EMR reduction saves 840 sheets/day (got ${paper.savedSheetsDaily})`);
assert(parseFloat(paper.treesSavedAnnual) > 0, `Annual trees saved calculated: ${paper.treesSavedAnnual} trees/yr`);

// 7. Biomedical Waste & Segregation Management
const waste = calculateWasteMetrics({
  baselineBiomedicalKg: 35.0,
  segregationAuditActive: true
});
assert(waste.streamBreakdown.yellow.baselineKg > 0, `Yellow stream represented: ${waste.streamBreakdown.yellow.baselineKg.toFixed(1)} kg`);
assert(waste.streamBreakdown.red.baselineKg > 0, `Red stream represented: ${waste.streamBreakdown.red.baselineKg.toFixed(1)} kg`);
assert(waste.streamBreakdown.blueWhite.baselineKg > 0, `Blue/White stream represented: ${waste.streamBreakdown.blueWhite.baselineKg.toFixed(1)} kg`);
assert(waste.savedBiomedicalKgDaily > 0, `Segregation audit diverted non-infectious packaging: ${waste.savedBiomedicalKgDaily.toFixed(2)} kg/day`);

// 8. Clinical Life-Safety Locks & Ventilation Classification
const icuRoom = allHospitalRooms.find(r => r.id === 'F3-Z01');
const otRoom = allHospitalRooms.find(r => r.id === 'GF-Z03');
const wardRoom = allHospitalRooms.find(r => r.id === 'F2-Z02');

const icuVent = getVentilationClassification(icuRoom);
const otVent = getVentilationClassification(otRoom);
const wardVent = getVentilationClassification(wardRoom);

assert(icuVent.naturalAllowed === false, 'ICU strictly forbids natural ventilation / operable windows');
assert(otVent.naturalAllowed === false, 'Operating Theatre strictly forbids natural ventilation / operable windows');
assert(wardVent.naturalAllowed === true, 'General Ward allows natural mixed-mode cross-ventilation potential');

// 9. State-Aware Intelligent Recommendations Engine
const recommendations = generateSustainabilityRecommendations(allHospitalRooms, {
  autoSetbackUnoccupied: false,
  smartHvacNonClinical: false,
  solarPvActive: true,
});

assert(recommendations.length > 0, `Generated ${recommendations.length} active state-aware recommendations`);
const emptyLitRec = recommendations.find(r => r.type === 'energy_setback');
assert(emptyLitRec !== undefined, `Found unoccupied room lighting setback recommendation: ${emptyLitRec?.title}`);
assert(emptyLitRec.roomId !== undefined, `Recommendation has direct roomId link: ${emptyLitRec?.roomId}`);
assert(emptyLitRec.safetyNote !== undefined, `Recommendation specifies safety constraints: ${emptyLitRec?.safetyNote}`);

const icuSafeguardRec = recommendations.find(r => r.type === 'clinical_safeguard');
assert(icuSafeguardRec !== undefined, `ICU clinical life-safety lock recommendation present: ${icuSafeguardRec?.title}`);

console.log('\n========================================================');
if (failedTests === 0) {
  console.log('🌟 ALL 25 CRITICAL VERIFICATION TESTS PASSED SUCCESSFULLY!');
} else {
  console.error(`💥 ${failedTests} TESTS FAILED.`);
  process.exit(1);
}
console.log('========================================================');
