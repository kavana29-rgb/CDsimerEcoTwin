import { architecturalFloors, allHospitalRooms } from './hospitalArchitectureData.js';

export { 
  architecturalFloors, 
  allHospitalRooms, 
  getRoomFurnitureType,
  initialIncidentAlerts,
  initialSimulatorPolicies,
  architecturalDefaults,
  calculateRoomPower,
  syncRoomOccupancy
} from './hospitalArchitectureData.js';

export const floors = architecturalFloors.map(f => ({
  id: f.id,
  code: f.code,
  name: f.name,
  short: f.short,
  plan: f.planImage,
  note: f.note,
  confidence: f.confidence,
  elevationY: f.elevationY,
  rooms: f.rooms,
  corridors: f.corridors,
  verticalCirculation: f.verticalCirculation,
  accessPoints: f.accessPoints,
}));

export const initialRooms = allHospitalRooms;

export const sustainabilityDefaults = {
  gridEmissionFactor: 0.70, // illustrative kg CO2e/kWh
  electricityRate: 8.5, // illustrative INR/kWh
  paperSheetsPerDay: 1200,
  biomedicalWasteKgPerDay: 35,
  waterLitresPerDay: 28000,
};

