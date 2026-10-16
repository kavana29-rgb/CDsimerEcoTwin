/**
 * CDsimerEcoTwin — Centralized Sustainability Intelligence & Optimization Engine
 * Phase 3: Mathematical models for Energy, Solar PV, Carbon, Water, Paper, 
 *          Biomedical Waste, Solar EV Mobility, Staff Environment, and Recommendations.
 */

export const SUSTAINABILITY_CONSTANTS = {
  // Grid electricity emissions factor (Central Electricity Authority / CEA India benchmark)
  DEFAULT_GRID_EMISSION_FACTOR: 0.70, // kg CO2e / kWh
  // Commercial healthcare electricity tariff in Karnataka
  DEFAULT_ELECTRICITY_TARIFF: 8.50, // INR / kWh
  // Commercial water tariff
  DEFAULT_WATER_TARIFF_PER_KL: 45.0, // INR / kL (1000 Litres)
  // Specific solar photovoltaic yield for Karnataka region (CDSIMER campus latitude)
  SOLAR_SPECIFIC_YIELD_KWH_PER_KWP: 4.4, // kWh / kWp / day
  // Proposed solar PV rooftop capacity (Layer B model)
  PROPOSED_SOLAR_CAPACITY_KWP: 25.0, // kWp
  // Baseline hospital administrative paper usage
  BASELINE_PAPER_SHEETS_PER_DAY: 1200, // sheets / day
  PAPER_COST_PER_SHEET: 0.60, // INR / sheet
  PAPER_SHEET_WEIGHT_KG: 0.005, // 5 grams per A4 sheet
  // Biomedical waste generation baseline
  BASELINE_BIOMEDICAL_WASTE_KG_PER_DAY: 35.0, // kg / day
  BASELINE_GENERAL_WASTE_KG_PER_DAY: 45.0, // kg / day
  // Clean mobility / EV charging parameters
  DEFAULT_EV_CHARGING_DEMAND_KWH_PER_DAY: 48.0, // kWh / day (~2 electric ambulances / fleet shuttles)
  DEFAULT_EV_SOLAR_ALLOCATION_PCT: 30.0, // % of solar yield allocated to EV mobility
};

/**
 * 1. Instantaneous Power & Daily Energy Calculations
 */
export function calculateEnergyMetrics(rooms = [], options = {}) {
  const electricityTariff = options.electricityTariff ?? SUSTAINABILITY_CONSTANTS.DEFAULT_ELECTRICITY_TARIFF;
  const gridEmissionFactor = options.gridEmissionFactor ?? SUSTAINABILITY_CONSTANTS.DEFAULT_GRID_EMISSION_FACTOR;

  let totalInstantKw = 0;
  let totalLightingKw = 0;
  let totalHvacKw = 0;
  let totalEquipmentKw = 0;

  // Breakdown by Floor (GF, F1, F2, F3)
  const floorBreakdown = {
    GF: { floorId: 'GF', name: 'Ground Floor', powerKw: 0, dailyKwh: 0, lightingKw: 0, hvacKw: 0, roomsCount: 0 },
    F1: { floorId: 'F1', name: 'First Floor', powerKw: 0, dailyKwh: 0, lightingKw: 0, hvacKw: 0, roomsCount: 0 },
    F2: { floorId: 'F2', name: 'Second Floor', powerKw: 0, dailyKwh: 0, lightingKw: 0, hvacKw: 0, roomsCount: 0 },
    F3: { floorId: 'F3', name: 'Third Floor', powerKw: 0, dailyKwh: 0, lightingKw: 0, hvacKw: 0, roomsCount: 0 },
  };

  // Breakdown by Department Category
  const departmentBreakdown = {
    inpatient_wards: { name: 'Inpatient Wards (Level 2)', powerKw: 0, dailyKwh: 0, roomsCount: 0 },
    critical_surgical: { name: 'Critical Care & Surgical OTs', powerKw: 0, dailyKwh: 0, roomsCount: 0 },
    diagnostic_imaging: { name: 'Diagnostic Imaging & Pathology', powerKw: 0, dailyKwh: 0, roomsCount: 0 },
    outpatient_opd: { name: 'Outpatient Consultation (OPD)', powerKw: 0, dailyKwh: 0, roomsCount: 0 },
    support_utility: { name: 'Support, CSSD & Utility Hub', powerKw: 0, dailyKwh: 0, roomsCount: 0 },
  };

  rooms.forEach(room => {
    const lightKw = room.lightOn ? (room.lightKw || 0.6) : 0;
    const hvacMode = room.hvacMode || 'Running';
    const baseHvacKw = room.hvacKw || 1.8;
    const hvacKw = hvacMode === 'Running' ? baseHvacKw : hvacMode === 'Eco' ? baseHvacKw * 0.65 : hvacMode === 'Idle' ? baseHvacKw * 0.12 : 0;
    
    // Clinical equipment and plug load representation
    const equipKw = room.critical
      ? (room.type?.includes('ICU') ? 2.4 : room.type?.includes('Operation') ? 3.2 : 1.6)
      : (room.type?.includes('Laboratory') ? 1.4 : room.type?.includes('Dining') ? 1.8 : 0.4);

    const roomKw = lightKw + hvacKw + equipKw;
    const roomDailyKwh = roomKw * 24;

    totalInstantKw += roomKw;
    totalLightingKw += lightKw;
    totalHvacKw += hvacKw;
    totalEquipmentKw += equipKw;

    // Floor accumulation
    const fId = room.floorId;
    if (floorBreakdown[fId]) {
      floorBreakdown[fId].powerKw += roomKw;
      floorBreakdown[fId].dailyKwh += roomDailyKwh;
      floorBreakdown[fId].lightingKw += lightKw;
      floorBreakdown[fId].hvacKw += hvacKw;
      floorBreakdown[fId].roomsCount += 1;
    }

    // Department categorization
    const rType = room.type || '';
    const rDept = room.department || '';
    if (rType.includes('Ward') || rType.includes('Suite') && fId === 'F2') {
      departmentBreakdown.inpatient_wards.powerKw += roomKw;
      departmentBreakdown.inpatient_wards.dailyKwh += roomDailyKwh;
      departmentBreakdown.inpatient_wards.roomsCount += 1;
    } else if (room.critical || rType.includes('ICU') || rType.includes('Operation') || rType.includes('Resuscitation')) {
      departmentBreakdown.critical_surgical.powerKw += roomKw;
      departmentBreakdown.critical_surgical.dailyKwh += roomDailyKwh;
      departmentBreakdown.critical_surgical.roomsCount += 1;
    } else if (rType.includes('Diagnostic') || rType.includes('Laboratory') || rType.includes('Blood Bank')) {
      departmentBreakdown.diagnostic_imaging.powerKw += roomKw;
      departmentBreakdown.diagnostic_imaging.dailyKwh += roomDailyKwh;
      departmentBreakdown.diagnostic_imaging.roomsCount += 1;
    } else if (rType.includes('Consultation') || rDept.includes('Outpatient')) {
      departmentBreakdown.outpatient_opd.powerKw += roomKw;
      departmentBreakdown.outpatient_opd.dailyKwh += roomDailyKwh;
      departmentBreakdown.outpatient_opd.roomsCount += 1;
    } else {
      departmentBreakdown.support_utility.powerKw += roomKw;
      departmentBreakdown.support_utility.dailyKwh += roomDailyKwh;
      departmentBreakdown.support_utility.roomsCount += 1;
    }
  });

  const grossDailyKwh = totalInstantKw * 24;
  const estimatedDailyCost = grossDailyKwh * electricityTariff;
  const estimatedDailyCarbonKg = grossDailyKwh * gridEmissionFactor;

  return {
    totalInstantKw,
    totalLightingKw,
    totalHvacKw,
    totalEquipmentKw,
    grossDailyKwh,
    estimatedDailyCost,
    estimatedDailyCarbonKg,
    electricityTariff,
    gridEmissionFactor,
    floorBreakdown,
    departmentBreakdown,
  };
}

/**
 * 2. Solar PV & Solar EV Charging Integration with Strict Non-Double-Counting
 */
export function calculateSolarAndEvIntegration(grossHospitalKwh, options = {}) {
  const solarCapacityKwp = Math.max(0, options.solarCapacityKwp ?? SUSTAINABILITY_CONSTANTS.PROPOSED_SOLAR_CAPACITY_KWP);
  const specificYield = options.specificYield ?? SUSTAINABILITY_CONSTANTS.SOLAR_SPECIFIC_YIELD_KWH_PER_KWP;
  const evDailyDemandKwh = Math.max(0, options.evDailyDemandKwh ?? SUSTAINABILITY_CONSTANTS.DEFAULT_EV_CHARGING_DEMAND_KWH_PER_DAY);
  const evSolarSharePct = Math.min(100, Math.max(0, options.evSolarSharePct ?? SUSTAINABILITY_CONSTANTS.DEFAULT_EV_SOLAR_ALLOCATION_PCT));
  const electricityTariff = options.electricityTariff ?? SUSTAINABILITY_CONSTANTS.DEFAULT_ELECTRICITY_TARIFF;
  const gridEmissionFactor = options.gridEmissionFactor ?? SUSTAINABILITY_CONSTANTS.DEFAULT_GRID_EMISSION_FACTOR;

  // Total daily solar generation
  const totalSolarGenKwh = solarCapacityKwp * specificYield;

  // 1. Portion of solar dedicated to EV mobility
  const solarToEvRequested = totalSolarGenKwh * (evSolarSharePct / 100);
  const solarToEvActual = Math.min(evDailyDemandKwh, solarToEvRequested);

  // 2. Remaining solar generation dedicated to hospital building demand
  // STRICT NON-DOUBLE-COUNTING: Only the remaining solar is allocated to the hospital
  const remainingSolarForHospital = Math.max(0, totalSolarGenKwh - solarToEvActual);
  const solarToHospitalActual = Math.min(grossHospitalKwh, remainingSolarForHospital);

  // 3. Surplus clean energy (if generation exceeds both EV and hospital)
  const surplusCleanSolarExportKwh = Math.max(0, remainingSolarForHospital - solarToHospitalActual);

  // 4. Net grid draw for hospital and EV
  const netHospitalGridKwh = Math.max(0, grossHospitalKwh - solarToHospitalActual);
  const netEvGridKwh = Math.max(0, evDailyDemandKwh - solarToEvActual);
  const totalNetGridKwh = netHospitalGridKwh + netEvGridKwh;

  // 5. Total avoided grid electricity
  const totalAvoidedGridKwh = solarToHospitalActual + solarToEvActual;
  const totalAvoidedCostDaily = totalAvoidedGridKwh * electricityTariff;
  const totalAvoidedCostAnnual = totalAvoidedCostDaily * 365;
  const totalAvoidedCarbonKgDaily = totalAvoidedGridKwh * gridEmissionFactor;

  // Solar contribution percentage of hospital demand
  const hospitalSolarCoveragePct = grossHospitalKwh > 0
    ? ((solarToHospitalActual / grossHospitalKwh) * 100).toFixed(1)
    : '0.0';

  // EV solar coverage percentage
  const evSolarCoveragePct = evDailyDemandKwh > 0
    ? ((solarToEvActual / evDailyDemandKwh) * 100).toFixed(1)
    : '0.0';

  return {
    solarCapacityKwp,
    specificYield,
    totalSolarGenKwh,
    evDailyDemandKwh,
    evSolarSharePct,
    solarToEvActual,
    solarToHospitalActual,
    surplusCleanSolarExportKwh,
    netHospitalGridKwh,
    netEvGridKwh,
    totalNetGridKwh,
    totalAvoidedGridKwh,
    totalAvoidedCostDaily,
    totalAvoidedCostAnnual,
    totalAvoidedCarbonKgDaily,
    hospitalSolarCoveragePct,
    evSolarCoveragePct,
  };
}

/**
 * 3. Water Management & Efficiency Calculations
 */
export function calculateWaterMetrics(rooms = [], options = {}) {
  const waterTariffPerKL = options.waterTariffPerKL ?? SUSTAINABILITY_CONSTANTS.DEFAULT_WATER_TARIFF_PER_KL;
  const lowFlowReductionPct = options.lowFlowReductionPct ?? 0; // 0% or 25%

  let totalBaselineLph = 0;
  let totalOccupiedBeds = 0;
  let totalPeople = 0;

  const floorWater = {
    GF: { floorId: 'GF', name: 'Ground Floor', dailyLitres: 0 },
    F1: { floorId: 'F1', name: 'First Floor', dailyLitres: 0 },
    F2: { floorId: 'F2', name: 'Second Floor', dailyLitres: 0 },
    F3: { floorId: 'F3', name: 'Third Floor', dailyLitres: 0 },
  };

  const highConsumerZones = [];

  rooms.forEach(room => {
    const lph = room.waterLph || 0;
    const dailyL = lph * 24;
    totalBaselineLph += lph;
    totalOccupiedBeds += room.occupiedBeds || 0;
    totalPeople += room.people || 0;

    if (floorWater[room.floorId]) {
      floorWater[room.floorId].dailyLitres += dailyL;
    }

    if (lph >= 18) {
      highConsumerZones.push({
        id: room.id,
        name: room.name,
        floorId: room.floorId,
        rateLph: lph,
        dailyL,
        reason: room.type?.includes('Dialysis') ? 'Hemodialysis RO Process Loop'
          : room.type?.includes('Sterile') ? 'High-Pressure Steam Autoclaves'
          : room.type?.includes('Dining') ? 'Food Service & Scullery'
          : 'High Flow Clinical Annex'
      });
    }
  });

  const baselineDailyLitres = totalBaselineLph * 24;
  const optimizedDailyLitres = baselineDailyLitres * (1 - lowFlowReductionPct / 100);
  const savedDailyLitres = Math.max(0, baselineDailyLitres - optimizedDailyLitres);

  const baselineDailyCost = (baselineDailyLitres / 1000) * waterTariffPerKL;
  const optimizedDailyCost = (optimizedDailyLitres / 1000) * waterTariffPerKL;
  const savedDailyCost = Math.max(0, baselineDailyCost - optimizedDailyCost);

  // Intensity Metrics
  const litresPerBedDay = totalOccupiedBeds > 0
    ? (baselineDailyLitres / totalOccupiedBeds).toFixed(1)
    : '0.0';
  const litresPerPersonDay = totalPeople > 0
    ? (baselineDailyLitres / totalPeople).toFixed(1)
    : '0.0';

  return {
    baselineDailyLitres,
    optimizedDailyLitres,
    savedDailyLitres,
    savedMonthlyLitres: savedDailyLitres * 30,
    savedAnnualLitres: savedDailyLitres * 365,
    baselineDailyCost,
    optimizedDailyCost,
    savedDailyCost,
    savedAnnualCost: savedDailyCost * 365,
    litresPerBedDay,
    litresPerPersonDay,
    totalOccupiedBeds,
    totalPeople,
    floorWater,
    highConsumerZones,
    waterTariffPerKL,
  };
}

/**
 * 4. Paper Consumption & Digital Workflow Reduction
 */
export function calculatePaperMetrics(options = {}) {
  const baselineSheets = Math.max(0, options.baselineSheets ?? SUSTAINABILITY_CONSTANTS.BASELINE_PAPER_SHEETS_PER_DAY);
  const digitalWorkflowReductionPct = options.digitalWorkflowReductionPct ?? 0; // e.g. 70%
  const costPerSheet = options.costPerSheet ?? SUSTAINABILITY_CONSTANTS.PAPER_COST_PER_SHEET;
  const weightPerSheetKg = SUSTAINABILITY_CONSTANTS.PAPER_SHEET_WEIGHT_KG;

  const optimizedSheets = baselineSheets * (1 - digitalWorkflowReductionPct / 100);
  const savedSheetsDaily = Math.max(0, baselineSheets - optimizedSheets);
  const savedSheetsAnnual = savedSheetsDaily * 365;

  const baselineCostDaily = baselineSheets * costPerSheet;
  const optimizedCostDaily = optimizedSheets * costPerSheet;
  const savedCostDaily = Math.max(0, baselineCostDaily - optimizedCostDaily);
  const savedCostAnnual = savedCostDaily * 365;

  const savedWeightKgDaily = savedSheetsDaily * weightPerSheetKg;
  const savedWeightKgAnnual = savedWeightKgDaily * 365;
  // Standard environmental metric: ~16 reams (8,000 sheets) = 1 tree
  const treesSavedAnnual = (savedSheetsAnnual / 8000).toFixed(1);

  return {
    baselineSheets,
    optimizedSheets,
    savedSheetsDaily,
    savedSheetsAnnual,
    baselineCostDaily,
    optimizedCostDaily,
    savedCostDaily,
    savedCostAnnual,
    savedWeightKgDaily,
    savedWeightKgAnnual,
    treesSavedAnnual,
    digitalWorkflowReductionPct,
  };
}

/**
 * 5. Biomedical Waste & Circular Segregation Management
 */
export function calculateWasteMetrics(options = {}) {
  const baselineBiomedicalKg = Math.max(0, options.baselineBiomedicalKg ?? SUSTAINABILITY_CONSTANTS.BASELINE_BIOMEDICAL_WASTE_KG_PER_DAY);
  const baselineGeneralKg = Math.max(0, options.baselineGeneralKg ?? SUSTAINABILITY_CONSTANTS.BASELINE_GENERAL_WASTE_KG_PER_DAY);
  const segregationAuditActive = options.segregationAuditActive ?? false;

  // Breakdown by Biomedical Color Stream (Standard Indian Biomedical Waste Rules)
  // Yellow (Anatomical/Soiled), Red (Contaminated Plastics), Blue/White (Sharps/Glass)
  const streamBreakdown = {
    yellow: { label: 'Yellow (Anatomical & Soiled Linens)', baselineKg: baselineBiomedicalKg * 0.48, treatment: 'High-Temperature Incineration / Bio-Digestion' },
    red: { label: 'Red (Contaminated Recyclable Plastics)', baselineKg: baselineBiomedicalKg * 0.32, treatment: 'Autoclaving + Plastic Granulation' },
    blueWhite: { label: 'Blue / White (Vials & Metal Sharps)', baselineKg: baselineBiomedicalKg * 0.20, treatment: 'Autoclave Disinfection + Encapsulation' },
  };

  // Segregation optimization diverts non-contaminated packaging plastics out of the Yellow stream
  const optimizationReductionPct = segregationAuditActive ? 14.0 : 0.0;
  const optimizedBiomedicalKg = baselineBiomedicalKg * (1 - optimizationReductionPct / 100);
  const savedBiomedicalKgDaily = Math.max(0, baselineBiomedicalKg - optimizedBiomedicalKg);

  return {
    baselineBiomedicalKg,
    baselineGeneralKg,
    optimizedBiomedicalKg,
    savedBiomedicalKgDaily,
    savedBiomedicalKgAnnual: savedBiomedicalKgDaily * 365,
    streamBreakdown,
    segregationAuditActive,
    optimizationReductionPct,
  };
}

/**
 * 6. HVAC & Ventilation Environmental Indicators
 */
export function getVentilationClassification(room) {
  const rType = room.type || '';
  const rDept = room.department || '';

  if (room.critical || rType.includes('ICU') || rType.includes('Operation') || rType.includes('Resuscitation') || rType.includes('Sterile')) {
    return {
      type: 'controlled_clinical',
      badge: 'Controlled Clinical Ventilation',
      achTarget: '15 - 20 ACH',
      pressure: 'Positive Pressure (HEPA Class 100/10,000)',
      windowPolicy: 'STRICT RESTRICTION: Operable windows prohibited in sterile clean zone to prevent airborne sepsis.',
      naturalAllowed: false,
    };
  }

  if (rType.includes('Diagnostic') || rType.includes('Laboratory') || rType.includes('Emergency')) {
    return {
      type: 'mechanical_conditioned',
      badge: 'Mechanical Air Handling (AHU)',
      achTarget: '6 - 8 ACH',
      pressure: 'Neutral to Negative Pressure Exhaust',
      windowPolicy: 'Sealed climate envelope for diagnostic equipment calibration and radiation shielding.',
      naturalAllowed: false,
    };
  }

  if (rType.includes('Ward') || rType.includes('Consultation') || rType.includes('Public') || rType.includes('Dining') || rType.includes('Lounge')) {
    return {
      type: 'natural_ventilation_potential',
      badge: 'Natural & Mixed-Mode Ventilation',
      achTarget: '4 - 6 ACH',
      pressure: 'Ambient Air Balance',
      windowPolicy: 'Perimeter facade windows provide natural cross-breeze potential during favorable weather.',
      naturalAllowed: true,
    };
  }

  return {
    type: 'utility_exhaust',
    badge: 'Mechanical Extraction',
    achTarget: '10 - 12 ACH',
    pressure: 'Negative Pressure Exhaust',
    windowPolicy: 'Mechanical exhaust riser prevents vapor and odor migration.',
    naturalAllowed: false,
  };
}

/**
 * 7. State-Aware Intelligent Recommendations Engine
 */
export function generateSustainabilityRecommendations(rooms = [], policies = {}) {
  const recommendations = [];

  // Rule 1: Unoccupied non-critical zone with lights ON
  const emptyLitRooms = rooms.filter(r => r.people === 0 && r.lightOn && !r.critical);
  emptyLitRooms.slice(0, 4).forEach(r => {
    recommendations.push({
      id: `rec-light-${r.id}`,
      type: 'energy_setback',
      priority: 'High',
      roomId: r.id,
      roomName: r.name,
      floorId: r.floorId,
      floorName: r.floorName,
      title: `Unoccupied Zone Lighting Setback Available (${r.id})`,
      condition: `0 occupants detected in ${r.name} while primary lighting is active (${r.lightKw.toFixed(2)} kW).`,
      explanation: 'Operating lighting in unoccupied non-clinical zones generates avoidable electrical draw and excess chiller cooling burden.',
      proposedAction: 'Manually switch off primary lighting or enable automated occupancy setbacks.',
      projectedImpact: `Saves ${(r.lightKw * 24).toFixed(1)} kWh/day (₹${(r.lightKw * 24 * 8.5).toFixed(0)}/day)`,
      actionType: 'TOGGLE_LIGHT',
      safetyNote: 'Zone classified as non-critical. Manual shutdown verified compliant with safety protocols.',
    });
  });

  // Rule 2: Unoccupied non-critical zone with HVAC Running
  const emptyHvacRunning = rooms.filter(r => r.people === 0 && r.hvacMode === 'Running' && !r.critical);
  emptyHvacRunning.slice(0, 3).forEach(r => {
    recommendations.push({
      id: `rec-hvac-${r.id}`,
      type: 'hvac_efficiency',
      priority: 'Medium',
      roomId: r.id,
      roomName: r.name,
      floorId: r.floorId,
      floorName: r.floorName,
      title: `HVAC Eco Setback Opportunity (${r.id})`,
      condition: `${r.name} is currently empty, but HVAC mode is set to 'Running' (100% capacity: ${r.hvacKw.toFixed(1)} kW).`,
      explanation: 'Switching unoccupied non-clinical zones to Eco mode allows a 2°C temperature float, reducing thermal load by 35%.',
      proposedAction: 'Adjust HVAC operating mode to Eco or Idle during periods of zero occupancy.',
      projectedImpact: `Saves ${(r.hvacKw * 0.35 * 24).toFixed(1)} kWh/day`,
      actionType: 'SET_HVAC_ECO',
      safetyNote: 'Thermal float applies exclusively to non-clinical spaces; critical surgical and ICU HVAC remain unaffected.',
    });
  });

  // Rule 3: High occupant density in Reception / Waiting
  const highOccupancyWaiting = rooms.filter(r => r.id === 'GF-Z01' && r.people >= 10);
  if (highOccupancyWaiting.length > 0) {
    const r = highOccupancyWaiting[0];
    recommendations.push({
      id: `rec-iaq-GF-Z01`,
      type: 'iaq_fresh_air',
      priority: 'Medium',
      roomId: r.id,
      roomName: r.name,
      floorId: r.floorId,
      floorName: r.floorName,
      title: 'Elevated Triage Concourse Occupancy — Fresh Air Damper Review',
      condition: `Peak occupant volume (${r.people} people) in Ground Floor Reception Concourse.`,
      explanation: 'Sustained occupant density in public intake atriums elevates ambient CO2. Increasing fresh air intake dampers maintains healthy indoor air quality.',
      proposedAction: 'Open mechanical fresh air intake dampers to 35% and inspect natural cross-ventilation portals.',
      projectedImpact: 'Maintains ambient CO2 concentration below 650 ppm target.',
      actionType: 'NAVIGATE_ROOM',
      safetyNote: 'Public concourse area only. Controlled clinical zones remain under isolated pressure barriers.',
    });
  }

  // Rule 4: Critical Care Zone Security Check
  const icuZone = rooms.find(r => r.id === 'F3-Z01');
  if (icuZone) {
    recommendations.push({
      id: 'rec-sec-F3-Z01',
      type: 'clinical_safeguard',
      priority: 'Informational',
      roomId: icuZone.id,
      roomName: icuZone.name,
      floorId: icuZone.floorId,
      floorName: icuZone.floorName,
      title: 'Critical Care ICU Power & Environmental Protection Active',
      condition: 'F3-Z01 configured with uninterruptible power supply (UPS) and positive-pressure HEPA isolation.',
      explanation: 'Digital twin clinical safeguards prevent automated energy setback rules from altering lighting or ventilation in acute care environments.',
      proposedAction: 'Maintain continuous clinical telemetry monitoring.',
      projectedImpact: 'Guaranteed 100% clinical safety and power compliance.',
      actionType: 'NONE',
      safetyNote: 'Clinical engineering lock engaged. Energy conservation rules bypassed for life safety.',
    });
  }

  // Rule 5: Potable Water Efficiency / Low-Flow Plumbing
  if (policies.lowFlowPlumbing) {
    recommendations.push({
      id: 'rec-water-saving',
      type: 'water_conservation',
      priority: 'Informational',
      roomId: 'FACILITY',
      roomName: 'Hospital Hydraulic Infrastructure',
      floorId: 'ALL',
      floorName: 'Building Wide',
      title: 'Low-Flow Aerator Fixtures & Water Stewardship Active',
      condition: 'Low-flow aerator fittings and sensor valves simulated across hospital washrooms and scrub sinks.',
      explanation: 'Reduces continuous potable water intake by 25% without impacting surgical hand-scrub or infection control standards.',
      proposedAction: 'Monitor automated fixture telemetry to maintain steady pressure and continuous sanitization.',
      projectedImpact: 'Saves ~2,100 Litres of potable water daily (~₹34,000 annual utility savings).',
      actionType: 'NONE',
      safetyNote: 'Clinical scrub bays maintain required high-velocity disinfectant rinse cycles.',
    });
  }

  return recommendations;
}
