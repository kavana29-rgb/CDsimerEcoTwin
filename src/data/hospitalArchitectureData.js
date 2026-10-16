/**
 * CDsimerEcoTwin — Centralized Architectural Data Model
 * 40 Monitored Zones Configuration (Exactly 10 per Floor: GF, F1, F2, F3)
 * 
 * Based on CDSIMER physical campus display floor-plans and GreenTwin AI interaction standards.
 * 
 * Coordinate Convention (3D meter scale within 32m x 14m footprint):
 *   X: Lateral axis (-16.0m West wing to +16.0m East wing, 0 = Central portico axis)
 *   Y: Elevation above ground (GF=0.8m, F1=2.8m, F2=4.8m, F3=6.8m)
 *   Z: Depth axis (+Z = South / Front facade, -Z = North / Rear facade)
 */

export const architecturalFloors = [
  {
    id: 'GF',
    code: 'GF',
    short: 'L0',
    aliases: ['GF', 'Ground', 'L0'],
    name: 'GROUND FLOOR (L0)',
    levelIndex: 0,
    elevationY: 0.8,
    slabThickness: 0.22,
    ceilingHeight: 1.8,
    planImage: '/references/floor-plans/ground-floor.jpeg',
    note: 'Emergency trauma, reception atrium, OPD consultation suites, radiology imaging, central pharmacy, and building services.',
    confidence: 'Verified — entrance portico, emergency ramp intake, elevator core, and radiology shielding matches campus layout.',
    footprint: { width: 32.0, depth: 14.0 },
    accessPoints: [
      { id: 'GF-ACC-01', name: 'Main Portico Colonnade Entrance', type: 'Primary Public Entrance', position: [0, 0.1, 7.0], width: 3.2, isVerified: true },
      { id: 'GF-ACC-02', name: 'Emergency & Ambulance Intake Ramp', type: 'Emergency Access', position: [-16.0, 0.1, 3.8], width: 2.8, isVerified: true },
      { id: 'GF-ACC-03', name: 'East Service & Goods Dock', type: 'Service Egress', position: [16.0, 0.1, -3.8], width: 2.0, isVerified: true },
    ],
    verticalCirculation: [
      { id: 'GF-LIFT-01', name: 'Central Bed & Passenger Lifts', type: 'Elevator Bank', position: [0, 0.1, -4.5], dimensions: [3.4, 2.2], servesFloors: ['GF', 'F1', 'F2', 'F3'], isVerified: true },
      { id: 'GF-STR-01', name: 'West Wing Fire Staircase', type: 'Enclosed Stairwell', position: [-8.2, 0.1, -4.5], dimensions: [2.8, 3.2], servesFloors: ['GF', 'F1', 'F2', 'F3'], isVerified: true },
      { id: 'GF-STR-02', name: 'East Wing Public Staircase', type: 'Enclosed Stairwell', position: [8.2, 0.1, -4.5], dimensions: [2.8, 3.2], servesFloors: ['GF', 'F1', 'F2', 'F3'], isVerified: true },
    ],
    corridors: [
      { id: 'GF-CORR-01', name: 'Ground Spine Corridor', from: [-15.0, 0, 0.0], to: [15.0, 0, 0.0], width: 2.4, length: 30.0 },
      { id: 'GF-CORR-02', name: 'Entrance Portico Concourse', from: [0.0, 0, 6.0], to: [0.0, 0, 0.0], width: 3.6, length: 6.0 },
    ],
    rooms: [
      {
        id: 'GF-Z01',
        name: 'Main Reception & Waiting Lounge',
        provisionalLabel: 'Reception & Triage Concourse',
        department: 'Administration & Public Access',
        type: 'Public Concourse',
        position: [0.0, 0.8, 3.8],
        dimensions: [7.2, 4.2],
        bounds: { minX: -3.6, maxX: 3.6, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [0.0, 0.8, 1.7],
        capacity: 30,
        people: 8,
        patients: 0,
        staff: 3,
        visitors: 5,
        beds: 0,
        occupiedBeds: 0,
        isVerified: true,
        provisional: false,
        critical: false,
        notes: 'Located directly inside the classical colonnade entrance. Patient registration counters and visitor queue area.',
      },
      {
        id: 'GF-Z02',
        name: 'Emergency Lobby & Triage Bay',
        provisionalLabel: 'Emergency Trauma Care',
        department: 'Emergency & Trauma Services',
        type: 'Acute Clinical Care',
        position: [-12.2, 0.8, 3.8],
        dimensions: [5.2, 4.2],
        bounds: { minX: -14.8, maxX: -9.6, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [-12.2, 0.8, 1.7],
        capacity: 14,
        people: 6,
        patients: 3,
        staff: 2,
        visitors: 1,
        beds: 4,
        occupiedBeds: 3,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'West wing ground floor ambulance arrival portal. Immediate clinical triage, vital signs monitor, and crash cart.',
      },
      {
        id: 'GF-Z03',
        name: 'Emergency ICU & Resuscitation Suite',
        provisionalLabel: 'Emergency Resuscitation ICU',
        department: 'Emergency & Trauma Services',
        type: 'Critical Care Unit',
        position: [-6.6, 0.8, 3.8],
        dimensions: [5.0, 4.2],
        bounds: { minX: -9.1, maxX: -4.1, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [-6.6, 0.8, 1.7],
        capacity: 8,
        people: 4,
        patients: 2,
        staff: 2,
        visitors: 0,
        beds: 3,
        occupiedBeds: 2,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Acute resuscitation with invasive ventilators, cardiac defibs, and uninterruptible power supply (UPS).',
      },
      {
        id: 'GF-Z04',
        name: 'X-Ray & Fluoroscopy Diagnostics',
        provisionalLabel: 'Radiology / Digital X-Ray',
        department: 'Radiology & Imaging Sciences',
        type: 'Diagnostic Imaging',
        position: [6.6, 0.8, 3.8],
        dimensions: [5.0, 4.2],
        bounds: { minX: 4.1, maxX: 9.1, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [6.6, 0.8, 1.7],
        capacity: 6,
        people: 2,
        patients: 1,
        staff: 1,
        visitors: 0,
        beds: 1,
        occupiedBeds: 1,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Lead-lined radiation shielded room with digital radiography bucky table and control console.',
      },
      {
        id: 'GF-Z05',
        name: 'Computed Tomography (CT) Scan Suite',
        provisionalLabel: 'CT Scan & Control Room',
        department: 'Radiology & Imaging Sciences',
        type: 'Diagnostic Imaging',
        position: [12.2, 0.8, 3.8],
        dimensions: [5.2, 4.2],
        bounds: { minX: 9.6, maxX: 14.8, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [12.2, 0.8, 1.7],
        capacity: 6,
        people: 3,
        patients: 1,
        staff: 1,
        visitors: 1,
        beds: 1,
        occupiedBeds: 1,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Multi-slice CT gantry with specialized HVAC chiller cooling and high peak electrical draw.',
      },
      {
        id: 'GF-Z06',
        name: 'OPD Consultation Suite A (General Medicine)',
        provisionalLabel: 'OPD Consultation Wing A',
        department: 'Outpatient Clinical Department',
        type: 'Consultation Suite',
        position: [-12.2, 0.8, -3.8],
        dimensions: [5.2, 4.2],
        bounds: { minX: -14.8, maxX: -9.6, minZ: -5.9, maxZ: -1.7 },
        doorPosition: [-12.2, 0.8, -1.7],
        capacity: 8,
        people: 4,
        patients: 1,
        staff: 1,
        visitors: 2,
        beds: 1,
        occupiedBeds: 1,
        isVerified: false,
        provisional: true,
        critical: false,
        notes: 'General physician examination chamber with examination couch and diagnostic desktop.',
      },
      {
        id: 'GF-Z07',
        name: 'OPD Consultation Suite B (Pediatrics & Ortho)',
        provisionalLabel: 'OPD Consultation Wing B',
        department: 'Outpatient Clinical Department',
        type: 'Consultation Suite',
        position: [-6.6, 0.8, -3.8],
        dimensions: [5.0, 4.2],
        bounds: { minX: -9.1, maxX: -4.1, minZ: -5.9, maxZ: -1.7 },
        doorPosition: [-6.6, 0.8, -1.7],
        capacity: 8,
        people: 0,
        patients: 0,
        staff: 0,
        visitors: 0,
        beds: 1,
        occupiedBeds: 0,
        isVerified: false,
        provisional: true,
        critical: false,
        notes: 'Specialist clinical chambers for pediatric screening and orthopedic initial assessment.',
      },
      {
        id: 'GF-Z08',
        name: 'Central Pharmacy & Dispensary',
        provisionalLabel: 'Hospital Pharmacy Store',
        department: 'Pharmacy & Clinical Supplies',
        type: 'Dispensary',
        position: [0.0, 0.8, -3.8],
        dimensions: [4.6, 3.6],
        bounds: { minX: -2.3, maxX: 2.3, minZ: -5.6, maxZ: -2.0 },
        doorPosition: [0.0, 0.8, -2.0],
        capacity: 10,
        people: 4,
        patients: 0,
        staff: 2,
        visitors: 2,
        beds: 0,
        occupiedBeds: 0,
        isVerified: true,
        provisional: false,
        critical: false,
        notes: 'Dispensing counters, computerized formulary inventory, and 24/7 cold-chain vaccine refrigeration.',
      },
      {
        id: 'GF-Z09',
        name: 'Hospital Dining & Cafeteria',
        provisionalLabel: 'Staff & Visitor Cafeteria',
        department: 'Dietary & Facility Services',
        type: 'Dining Facility',
        position: [6.6, 0.8, -3.8],
        dimensions: [5.0, 4.2],
        bounds: { minX: 4.1, maxX: 9.1, minZ: -5.9, maxZ: -1.7 },
        doorPosition: [6.6, 0.8, -1.7],
        capacity: 24,
        people: 10,
        patients: 0,
        staff: 2,
        visitors: 8,
        beds: 0,
        occupiedBeds: 0,
        isVerified: false,
        provisional: true,
        critical: false,
        notes: 'Food service area with commercial induction heating, waste sorting station, and water dispensers.',
      },
      {
        id: 'GF-Z10',
        name: 'Medical Gas Manifold & Electrical Utility Hub',
        provisionalLabel: 'Plant & Medical Gas Utility',
        department: 'Engineering & Biomedical Infrastructure',
        type: 'Utility Plant',
        position: [12.2, 0.8, -3.8],
        dimensions: [5.2, 4.2],
        bounds: { minX: 9.6, maxX: 14.8, minZ: -5.9, maxZ: -1.7 },
        doorPosition: [12.2, 0.8, -1.7],
        capacity: 4,
        people: 2,
        patients: 0,
        staff: 2,
        visitors: 0,
        beds: 0,
        occupiedBeds: 0,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Oxygen pipeline manifolds, medical air compressors, vacuum pumps, and electrical main switchboards.',
      },
    ],
  },
  {
    id: 'F1',
    code: 'F1',
    short: 'L1',
    aliases: ['FF', 'F1', 'First', 'L1'],
    name: 'FIRST FLOOR (L1)',
    levelIndex: 1,
    elevationY: 2.8,
    slabThickness: 0.22,
    ceilingHeight: 1.8,
    planImage: '/references/floor-plans/first-floor.jpeg',
    note: 'Diagnostic pathology, blood bank, cardiology testing, hemodialysis unit, and clinical administrative registries.',
    confidence: 'Verified — laboratory corridors, patient testing chambers, and central mezzanine walkway identified.',
    footprint: { width: 32.0, depth: 14.0 },
    verticalCirculation: [
      { id: 'F1-LIFT-01', name: 'Central Bed & Passenger Lifts', type: 'Elevator Bank', position: [0, 2.1, -4.5], dimensions: [3.4, 2.2], servesFloors: ['GF', 'F1', 'F2', 'F3'], isVerified: true },
      { id: 'F1-STR-01', name: 'West Wing Fire Staircase', type: 'Enclosed Stairwell', position: [-8.2, 2.1, -4.5], dimensions: [2.8, 3.2], servesFloors: ['GF', 'F1', 'F2', 'F3'], isVerified: true },
      { id: 'F1-STR-02', name: 'East Wing Public Staircase', type: 'Enclosed Stairwell', position: [8.2, 2.1, -4.5], dimensions: [2.8, 3.2], servesFloors: ['GF', 'F1', 'F2', 'F3'], isVerified: true },
    ],
    corridors: [
      { id: 'F1-CORR-01', name: 'First Floor Diagnostic Spine', from: [-15.0, 0, 0.0], to: [15.0, 0, 0.0], width: 2.4, length: 30.0 },
    ],
    rooms: [
      {
        id: 'F1-Z01',
        name: 'Central Diagnostic Pathology Lab',
        provisionalLabel: 'Clinical Pathology & Hematology',
        department: 'Diagnostic & Laboratory Services',
        type: 'Laboratory',
        position: [0.0, 2.8, 3.8],
        dimensions: [7.2, 4.2],
        bounds: { minX: -3.6, maxX: 3.6, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [0.0, 2.8, 1.7],
        capacity: 12,
        people: 5,
        patients: 0,
        staff: 4,
        visitors: 1,
        beds: 0,
        occupiedBeds: 0,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Automated biochemistry analyzers, centrifuges, bio-safety cabinets, and reagent storage freezers.',
      },
      {
        id: 'F1-Z02',
        name: 'ECG / Echo Heart Station & TMT',
        provisionalLabel: 'Cardiology Non-Invasive Lab',
        department: 'Cardiology Services',
        type: 'Clinical Diagnostic',
        position: [-12.2, 2.8, 3.8],
        dimensions: [5.2, 4.2],
        bounds: { minX: -14.8, maxX: -9.6, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [-12.2, 2.8, 1.7],
        capacity: 6,
        people: 2,
        patients: 1,
        staff: 1,
        visitors: 0,
        beds: 2,
        occupiedBeds: 1,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Echocardiography station, 12-lead digital ECG recording, and treadmill exercise test bay.',
      },
      {
        id: 'F1-Z03',
        name: 'Specialist Consultation Suites (Cardio & Chest)',
        provisionalLabel: 'Cardiology & Pulmonology OPD',
        department: 'Specialist Clinical OPD',
        type: 'Consultation Suite',
        position: [-6.6, 2.8, 3.8],
        dimensions: [5.0, 4.2],
        bounds: { minX: -9.1, maxX: -4.1, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [-6.6, 2.8, 1.7],
        capacity: 8,
        people: 3,
        patients: 1,
        staff: 1,
        visitors: 1,
        beds: 1,
        occupiedBeds: 1,
        isVerified: false,
        provisional: true,
        critical: false,
        notes: 'Consultation chambers for cardiologists and pulmonologists with spirometry testing setup.',
      },
      {
        id: 'F1-Z04',
        name: 'Ultrasound & Color Doppler Suite',
        provisionalLabel: 'Ultrasound Imaging Suite',
        department: 'Radiology & Imaging Sciences',
        type: 'Diagnostic Imaging',
        position: [6.6, 2.8, 3.8],
        dimensions: [5.0, 4.2],
        bounds: { minX: 4.1, maxX: 9.1, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [6.6, 2.8, 1.7],
        capacity: 6,
        people: 2,
        patients: 1,
        staff: 1,
        visitors: 0,
        beds: 1,
        occupiedBeds: 1,
        isVerified: true,
        provisional: false,
        critical: false,
        notes: 'High-resolution abdominal and obstetric ultrasound with vascular Doppler capability.',
      },
      {
        id: 'F1-Z05',
        name: 'Blood Bank & Component Transfusion Unit',
        provisionalLabel: 'Blood Bank & Component Lab',
        department: 'Transfusion Medicine',
        type: 'Blood Bank Suite',
        position: [12.2, 2.8, 3.8],
        dimensions: [5.2, 4.2],
        bounds: { minX: 9.6, maxX: 14.8, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [12.2, 2.8, 1.7],
        capacity: 10,
        people: 4,
        patients: 1,
        staff: 2,
        visitors: 1,
        beds: 2,
        occupiedBeds: 1,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Whole-blood donor couches, refrigerated centrifuge, plasma freezers, and platelet agitators.',
      },
      {
        id: 'F1-Z06',
        name: 'Renal Diagnostics & Nephrology Chamber',
        provisionalLabel: 'Nephrology Consultation',
        department: 'Nephrology Department',
        type: 'Consultation Suite',
        position: [-12.2, 2.8, -3.8],
        dimensions: [5.2, 4.2],
        bounds: { minX: -14.8, maxX: -9.6, minZ: -5.9, maxZ: -1.7 },
        doorPosition: [-12.2, 2.8, -1.7],
        capacity: 6,
        people: 2,
        patients: 0,
        staff: 1,
        visitors: 1,
        beds: 1,
        occupiedBeds: 0,
        isVerified: false,
        provisional: true,
        critical: false,
        notes: 'Consultation and clearance evaluation room for chronic kidney disease patients.',
      },
      {
        id: 'F1-Z07',
        name: 'Hemodialysis Unit (Daycare Bay)',
        provisionalLabel: 'Renal Dialysis Daycare',
        department: 'Nephrology & Dialysis Services',
        type: 'Dialysis Unit',
        position: [-6.6, 2.8, -3.8],
        dimensions: [5.0, 4.2],
        bounds: { minX: -9.1, maxX: -4.1, minZ: -5.9, maxZ: -1.7 },
        doorPosition: [-6.6, 2.8, -1.7],
        capacity: 8,
        people: 5,
        patients: 3,
        staff: 2,
        visitors: 0,
        beds: 4,
        occupiedBeds: 3,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Hemodialysis stations with treated reverse osmosis (RO) clinical water loop and effluent drainage.',
      },
      {
        id: 'F1-Z08',
        name: 'Medical Records & Digital Health Registry',
        provisionalLabel: 'Hospital Records / Admin',
        department: 'Hospital Administration',
        type: 'Administrative Office',
        position: [0.0, 2.8, -3.8],
        dimensions: [4.6, 3.6],
        bounds: { minX: -2.3, maxX: 2.3, minZ: -5.6, maxZ: -2.0 },
        doorPosition: [0.0, 2.8, -2.0],
        capacity: 6,
        people: 2,
        patients: 0,
        staff: 2,
        visitors: 0,
        beds: 0,
        occupiedBeds: 0,
        isVerified: false,
        provisional: true,
        critical: false,
        notes: 'Health informatics terminal, electronic medical record (EMR) server rack, and paper digitization scanner.',
      },
      {
        id: 'F1-Z09',
        name: 'Doctors & Clinical Staff Lounge',
        provisionalLabel: 'Medical Staff Common Room',
        department: 'Staff Amenities',
        type: 'Staff Lounge',
        position: [6.6, 2.8, -3.8],
        dimensions: [5.0, 4.2],
        bounds: { minX: 4.1, maxX: 9.1, minZ: -5.9, maxZ: -1.7 },
        doorPosition: [6.6, 2.8, -1.7],
        capacity: 12,
        people: 4,
        patients: 0,
        staff: 4,
        visitors: 0,
        beds: 0,
        occupiedBeds: 0,
        isVerified: false,
        provisional: true,
        critical: false,
        notes: 'Resting lounge for on-duty medical officers, conference table, lockers, and beverage station.',
      },
      {
        id: 'F1-Z10',
        name: 'Daycare Endoscopy & Minor Procedure Suite',
        provisionalLabel: 'Daycare Minor OT / Endoscopy',
        department: 'Daycare Surgery',
        type: 'Procedure Suite',
        position: [12.2, 2.8, -3.8],
        dimensions: [5.2, 4.2],
        bounds: { minX: 9.6, maxX: 14.8, minZ: -5.9, maxZ: -1.7 },
        doorPosition: [12.2, 2.8, -1.7],
        capacity: 6,
        people: 2,
        patients: 1,
        staff: 1,
        visitors: 0,
        beds: 2,
        occupiedBeds: 1,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Gastroscopy and colonoscopy video tower with dedicated instrument disinfector and recovery bays.',
      },
    ],
  },
  {
    id: 'F2',
    code: 'F2',
    short: 'L2',
    aliases: ['SF', 'F2', 'Second', 'L2'],
    name: 'SECOND FLOOR (L2)',
    levelIndex: 2,
    elevationY: 4.8,
    slabThickness: 0.22,
    ceilingHeight: 1.8,
    planImage: '/references/floor-plans/second-floor.jpeg',
    note: 'Inpatient wards, central nursing station, private patient suites, and post-operative step-down care.',
    confidence: 'Verified — repetitive patient bed layouts, central nursing observation post, and sanitary blocks visible.',
    footprint: { width: 32.0, depth: 14.0 },
    verticalCirculation: [
      { id: 'F2-LIFT-01', name: 'Central Bed & Passenger Lifts', type: 'Elevator Bank', position: [0, 4.1, -4.5], dimensions: [3.4, 2.2], servesFloors: ['GF', 'F1', 'F2', 'F3'], isVerified: true },
      { id: 'F2-STR-01', name: 'West Wing Fire Staircase', type: 'Enclosed Stairwell', position: [-8.2, 4.1, -4.5], dimensions: [2.8, 3.2], servesFloors: ['GF', 'F1', 'F2', 'F3'], isVerified: true },
      { id: 'F2-STR-02', name: 'East Wing Public Staircase', type: 'Enclosed Stairwell', position: [8.2, 4.1, -4.5], dimensions: [2.8, 3.2], servesFloors: ['GF', 'F1', 'F2', 'F3'], isVerified: true },
    ],
    corridors: [
      { id: 'F2-CORR-01', name: 'Second Floor Inpatient Spine', from: [-15.0, 0, 0.0], to: [15.0, 0, 0.0], width: 2.6, length: 30.0 },
    ],
    rooms: [
      {
        id: 'F2-Z01',
        name: 'Central Nursing Station & Care Coordination Hub',
        provisionalLabel: 'Central Floor Nursing Station',
        department: 'Nursing & Patient Care',
        type: 'Staff Station',
        position: [0.0, 4.8, 3.8],
        dimensions: [7.2, 4.2],
        bounds: { minX: -3.6, maxX: 3.6, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [0.0, 4.8, 1.7],
        capacity: 10,
        people: 5,
        patients: 0,
        staff: 5,
        visitors: 0,
        beds: 0,
        occupiedBeds: 0,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: '24-hour central telemetry display, nurse call intercom master station, and emergency medication cart.',
      },
      {
        id: 'F2-Z02',
        name: 'General Male Medical Ward (Bay A)',
        provisionalLabel: 'Male Medical Ward',
        department: 'Inpatient Medicine',
        type: 'Multi-Bed Ward',
        position: [-12.2, 4.8, 3.8],
        dimensions: [5.2, 4.2],
        bounds: { minX: -14.8, maxX: -9.6, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [-12.2, 4.8, 1.7],
        capacity: 10,
        people: 6,
        patients: 3,
        staff: 1,
        visitors: 2,
        beds: 4,
        occupiedBeds: 3,
        isVerified: true,
        provisional: false,
        critical: false,
        notes: 'Six-bed acute medical recovery bay with piped medical oxygen, bedside call bells, and curtains.',
      },
      {
        id: 'F2-Z03',
        name: 'General Male Surgical Ward (Bay B)',
        provisionalLabel: 'Male Surgical Ward',
        department: 'Inpatient Surgery',
        type: 'Multi-Bed Ward',
        position: [-6.6, 4.8, 3.8],
        dimensions: [5.0, 4.2],
        bounds: { minX: -9.1, maxX: -4.1, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [-6.6, 4.8, 1.7],
        capacity: 8,
        people: 5,
        patients: 3,
        staff: 1,
        visitors: 1,
        beds: 4,
        occupiedBeds: 3,
        isVerified: true,
        provisional: false,
        critical: false,
        notes: 'Inpatient post-operative beds with vacuum suction lines, dressing trolleys, and mobile IV poles.',
      },
      {
        id: 'F2-Z04',
        name: 'General Female Medical Ward (Bay C)',
        provisionalLabel: 'Female Medical Ward',
        department: 'Inpatient Medicine',
        type: 'Multi-Bed Ward',
        position: [6.6, 4.8, 3.8],
        dimensions: [5.0, 4.2],
        bounds: { minX: 4.1, maxX: 9.1, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [6.6, 4.8, 1.7],
        capacity: 10,
        people: 6,
        patients: 3,
        staff: 1,
        visitors: 2,
        beds: 4,
        occupiedBeds: 3,
        isVerified: true,
        provisional: false,
        critical: false,
        notes: 'Six-bed inpatient medical unit with natural perimeter daylight and nurse monitoring access.',
      },
      {
        id: 'F2-Z05',
        name: 'General Female Surgical Ward (Bay D)',
        provisionalLabel: 'Female Surgical Ward',
        department: 'Inpatient Surgery',
        type: 'Multi-Bed Ward',
        position: [12.2, 4.8, 3.8],
        dimensions: [5.2, 4.2],
        bounds: { minX: 9.6, maxX: 14.8, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [12.2, 4.8, 1.7],
        capacity: 8,
        people: 5,
        patients: 2,
        staff: 1,
        visitors: 2,
        beds: 4,
        occupiedBeds: 2,
        isVerified: true,
        provisional: false,
        critical: false,
        notes: 'Inpatient surgical recovery ward with dedicated sanitary annex and clinical waste segregation.',
      },
      {
        id: 'F2-Z06',
        name: 'Private Patient Suites (Wing West)',
        provisionalLabel: 'Single Private Patient Rooms',
        department: 'Inpatient Services',
        type: 'Private Suite',
        position: [-12.2, 4.8, -3.8],
        dimensions: [5.2, 4.2],
        bounds: { minX: -14.8, maxX: -9.6, minZ: -5.9, maxZ: -1.7 },
        doorPosition: [-12.2, 4.8, -1.7],
        capacity: 4,
        people: 3,
        patients: 2,
        staff: 1,
        visitors: 0,
        beds: 2,
        occupiedBeds: 2,
        isVerified: true,
        provisional: false,
        critical: false,
        notes: 'Individual patient suites with motorized hospital beds, attendant cot, and independent HVAC control.',
      },
      {
        id: 'F2-Z07',
        name: 'Semi-Private Patient Suites (Wing West)',
        provisionalLabel: 'Semi-Private Patient Suites',
        department: 'Inpatient Services',
        type: 'Semi-Private Ward',
        position: [-6.6, 4.8, -3.8],
        dimensions: [5.0, 4.2],
        bounds: { minX: -9.1, maxX: -4.1, minZ: -5.9, maxZ: -1.7 },
        doorPosition: [-6.6, 4.8, -1.7],
        capacity: 6,
        people: 4,
        patients: 2,
        staff: 1,
        visitors: 1,
        beds: 2,
        occupiedBeds: 2,
        isVerified: false,
        provisional: true,
        critical: false,
        notes: 'Two-room divided semi-private layout sharing an en-suite accessible washroom.',
      },
      {
        id: 'F2-Z08',
        name: 'Floor Medicine Dispensary & Utility Station',
        provisionalLabel: 'Clean Utility & Floor Pharmacy',
        department: 'Clinical Support',
        type: 'Clean Utility',
        position: [0.0, 4.8, -3.8],
        dimensions: [4.6, 3.6],
        bounds: { minX: -2.3, maxX: 2.3, minZ: -5.6, maxZ: -2.0 },
        doorPosition: [0.0, 4.8, -2.0],
        capacity: 4,
        people: 2,
        patients: 0,
        staff: 2,
        visitors: 0,
        beds: 0,
        occupiedBeds: 0,
        isVerified: false,
        provisional: true,
        critical: false,
        notes: 'Floor-level clean linen storage, IV fluids stock, and automated medicine dispensing cabinet.',
      },
      {
        id: 'F2-Z09',
        name: 'Healthcare & Post-Operative Unit (PACU Step-Down)',
        provisionalLabel: 'Post-Anesthesia Step-Down Care',
        department: 'Post-Surgical Care',
        type: 'Step-Down Unit',
        position: [6.6, 4.8, -3.8],
        dimensions: [5.0, 4.2],
        bounds: { minX: 4.1, maxX: 9.1, minZ: -5.9, maxZ: -1.7 },
        doorPosition: [6.6, 4.8, -1.7],
        capacity: 8,
        people: 4,
        patients: 2,
        staff: 1,
        visitors: 1,
        beds: 3,
        occupiedBeds: 2,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Continuous cardiac and pulse oximetry monitoring for patients transitioning from surgical suites.',
      },
      {
        id: 'F2-Z10',
        name: 'Private Patient Suites (Wing East)',
        provisionalLabel: 'Executive Private Rooms',
        department: 'Inpatient Services',
        type: 'Private Suite',
        position: [12.2, 4.8, -3.8],
        dimensions: [5.2, 4.2],
        bounds: { minX: 9.6, maxX: 14.8, minZ: -5.9, maxZ: -1.7 },
        doorPosition: [12.2, 4.8, -1.7],
        capacity: 4,
        people: 2,
        patients: 1,
        staff: 1,
        visitors: 0,
        beds: 2,
        occupiedBeds: 1,
        isVerified: false,
        provisional: true,
        critical: false,
        notes: 'East wing private recovery rooms with smart environmental sensors and natural ventilation.',
      },
    ],
  },
  {
    id: 'F3',
    code: 'F3',
    short: 'L3',
    aliases: ['TF', 'F3', 'Third', 'L3'],
    name: 'THIRD FLOOR (L3)',
    levelIndex: 3,
    elevationY: 6.8,
    slabThickness: 0.22,
    ceilingHeight: 1.8,
    planImage: '/references/floor-plans/third-floor.jpeg',
    note: 'Central critical-care ICU, major operation theatre suites, neonatal ICU, cardiac care, and sterile supply.',
    confidence: 'Verified — airlocks, positive-pressure clean zones, autoclave suites, and surgical barrier layout visible.',
    footprint: { width: 32.0, depth: 14.0 },
    verticalCirculation: [
      { id: 'F3-LIFT-01', name: 'Central Bed & Passenger Lifts', type: 'Elevator Bank', position: [0, 6.1, -4.5], dimensions: [3.4, 2.2], servesFloors: ['GF', 'F1', 'F2', 'F3'], isVerified: true },
      { id: 'F3-STR-01', name: 'West Wing Fire Staircase', type: 'Enclosed Stairwell', position: [-8.2, 6.1, -4.5], dimensions: [2.8, 3.2], servesFloors: ['GF', 'F1', 'F2', 'F3'], isVerified: true },
      { id: 'F3-STR-02', name: 'East Wing Public Staircase', type: 'Enclosed Stairwell', position: [8.2, 6.1, -4.5], dimensions: [2.8, 3.2], servesFloors: ['GF', 'F1', 'F2', 'F3'], isVerified: true },
    ],
    corridors: [
      { id: 'F3-CORR-01', name: 'Third Floor Sterile Clinical Spine', from: [-15.0, 0, 0.0], to: [15.0, 0, 0.0], width: 2.6, length: 30.0 },
    ],
    rooms: [
      {
        id: 'F3-Z01',
        name: 'Central Critical-Care ICU (Intensive Care Module A)',
        provisionalLabel: 'Central Critical Care ICU',
        department: 'Critical Care Medicine',
        type: 'Intensive Care Unit',
        position: [0.0, 6.8, 3.8],
        dimensions: [7.2, 4.2],
        bounds: { minX: -3.6, maxX: 3.6, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [0.0, 6.8, 1.7],
        capacity: 10,
        people: 6,
        patients: 3,
        staff: 2,
        visitors: 1,
        beds: 4,
        occupiedBeds: 3,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Positive pressure HEPA-filtered clean environment. Dual emergency UPS circuit lines and isolated ventilation.',
      },
      {
        id: 'F3-Z02',
        name: 'Major Operating Theatre Suite (OT-1 General & Ortho)',
        provisionalLabel: 'Major Operation Theatre 1',
        department: 'Surgical Operations',
        type: 'Operation Suite',
        position: [-12.2, 6.8, 3.8],
        dimensions: [5.2, 4.2],
        bounds: { minX: -14.8, maxX: -9.6, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [-12.2, 6.8, 1.7],
        capacity: 10,
        people: 6,
        patients: 1,
        staff: 5,
        visitors: 0,
        beds: 1,
        occupiedBeds: 1,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Laminar air flow ceiling plenum, dual shadowless surgical light domes, C-arm imaging, and anesthesia cart.',
      },
      {
        id: 'F3-Z03',
        name: 'Major Operating Theatre Suite (OT-2 Neuro & Laparoscopy)',
        provisionalLabel: 'Major Operation Theatre 2',
        department: 'Surgical Operations',
        type: 'Operation Suite',
        position: [-6.6, 6.8, 3.8],
        dimensions: [5.0, 4.2],
        bounds: { minX: -9.1, maxX: -4.1, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [-6.6, 6.8, 1.7],
        capacity: 10,
        people: 5,
        patients: 1,
        staff: 4,
        visitors: 0,
        beds: 1,
        occupiedBeds: 1,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Equipped for minimally invasive laparoscopic and neurosurgical operations with surgical microscope.',
      },
      {
        id: 'F3-Z04',
        name: 'Neonatal & Pediatric ICU (NICU/PICU)',
        provisionalLabel: 'NICU / Pediatric Critical Care',
        department: 'Pediatric Critical Care',
        type: 'Specialized ICU',
        position: [6.6, 6.8, 3.8],
        dimensions: [5.0, 4.2],
        bounds: { minX: 4.1, maxX: 9.1, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [6.6, 6.8, 1.7],
        capacity: 8,
        people: 4,
        patients: 2,
        staff: 2,
        visitors: 0,
        beds: 3,
        occupiedBeds: 2,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Infant incubators, radiant warmers, phototherapy lights, and precision micro-infusion syringe pumps.',
      },
      {
        id: 'F3-Z05',
        name: 'Cardiac Intensive Care Unit (ICCU / CCU)',
        provisionalLabel: 'Cardiovascular Care Unit',
        department: 'Cardiovascular Critical Care',
        type: 'Intensive Care Unit',
        position: [12.2, 6.8, 3.8],
        dimensions: [5.2, 4.2],
        bounds: { minX: 9.6, maxX: 14.8, minZ: 1.7, maxZ: 5.9 },
        doorPosition: [12.2, 6.8, 1.7],
        capacity: 8,
        people: 5,
        patients: 3,
        staff: 1,
        visitors: 1,
        beds: 4,
        occupiedBeds: 3,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Dedicated cardiac care beds with intra-aortic balloon pump (IABP) capability and bedside echocardiography.',
      },
      {
        id: 'F3-Z06',
        name: 'Central Sterile Supply Department (CSSD Pack & Decon)',
        provisionalLabel: 'CSSD Decontamination Area',
        department: 'Sterile Processing Services',
        type: 'Sterile Service Suite',
        position: [-12.2, 6.8, -3.8],
        dimensions: [5.2, 4.2],
        bounds: { minX: -14.8, maxX: -9.6, minZ: -5.9, maxZ: -1.7 },
        doorPosition: [-12.2, 6.8, -1.7],
        capacity: 6,
        people: 3,
        patients: 0,
        staff: 3,
        visitors: 0,
        beds: 0,
        occupiedBeds: 0,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Ultrasonic surgical instrument washers, pass-through chemical decontamination sinks, and drying ovens.',
      },
      {
        id: 'F3-Z07',
        name: 'CSSD Clean Autoclave & Sterile Instrument Storage',
        provisionalLabel: 'CSSD High-Pressure Sterilization',
        department: 'Sterile Processing Services',
        type: 'Sterile Service Suite',
        position: [-6.6, 6.8, -3.8],
        dimensions: [5.0, 4.2],
        bounds: { minX: -9.1, maxX: -4.1, minZ: -5.9, maxZ: -1.7 },
        doorPosition: [-6.6, 6.8, -1.7],
        capacity: 6,
        people: 2,
        patients: 0,
        staff: 2,
        visitors: 0,
        beds: 0,
        occupiedBeds: 0,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Double-door steam autoclaves, sterile instrument pack racking, and biological indicator incubators.',
      },
      {
        id: 'F3-Z08',
        name: 'Surgical Clean Corridor & Sensor Scrub Stations',
        provisionalLabel: 'Surgical Scrub Sinks & Airlock',
        department: 'Surgical Support',
        type: 'Scrub & Prep Suite',
        position: [0.0, 6.8, -3.8],
        dimensions: [4.6, 3.6],
        bounds: { minX: -2.3, maxX: 2.3, minZ: -5.6, maxZ: -2.0 },
        doorPosition: [0.0, 6.8, -2.0],
        capacity: 6,
        people: 3,
        patients: 0,
        staff: 3,
        visitors: 0,
        beds: 0,
        occupiedBeds: 0,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Infrared hands-free surgical scrub troughs, antiseptic soap dispensers, and sterile gowning zone.',
      },
      {
        id: 'F3-Z09',
        name: 'Pre-Operative Induction & Anesthesia Prep Room',
        provisionalLabel: 'Pre-Op Holding & Induction',
        department: 'Surgical Support',
        type: 'Procedure Suite',
        position: [6.6, 6.8, -3.8],
        dimensions: [5.0, 4.2],
        bounds: { minX: 4.1, maxX: 9.1, minZ: -5.9, maxZ: -1.7 },
        doorPosition: [6.6, 6.8, -1.7],
        capacity: 6,
        people: 3,
        patients: 1,
        staff: 2,
        visitors: 0,
        beds: 2,
        occupiedBeds: 1,
        isVerified: true,
        provisional: false,
        critical: true,
        notes: 'Pre-anesthesia assessment beds, regional nerve block setup, and calm induction lighting.',
      },
      {
        id: 'F3-Z10',
        name: 'Surgeons & Anesthetists Clinical Briefing Suite',
        provisionalLabel: 'Surgical Team Briefing Room',
        department: 'Surgical Support',
        type: 'Staff Suite',
        position: [12.2, 6.8, -3.8],
        dimensions: [5.2, 4.2],
        bounds: { minX: 9.6, maxX: 14.8, minZ: -5.9, maxZ: -1.7 },
        doorPosition: [12.2, 6.8, -1.7],
        capacity: 8,
        people: 3,
        patients: 0,
        staff: 3,
        visitors: 0,
        beds: 0,
        occupiedBeds: 0,
        isVerified: false,
        provisional: true,
        critical: false,
        notes: 'Pre-surgery checklist conference room, digital PACS image viewer wall, and secure clinical records terminal.',
      },
    ],
  },
];

/**
 * Furniture template identifier for 3D walkthrough rendering
 */
export const getRoomFurnitureType = (roomId, type = '') => {
  // Ground Floor
  if (roomId === 'GF-Z01') return 'reception';
  if (roomId === 'GF-Z02') return 'emergency';
  if (roomId === 'GF-Z03') return 'icu';
  if (roomId === 'GF-Z04') return 'xray';
  if (roomId === 'GF-Z05') return 'ct_scan';
  if (roomId === 'GF-Z06') return 'consultation';
  if (roomId === 'GF-Z07') return 'consultation';
  if (roomId === 'GF-Z08') return 'pharmacy';
  if (roomId === 'GF-Z09') return 'dining';
  if (roomId === 'GF-Z10') return 'admin';

  // First Floor
  if (roomId === 'F1-Z01') return 'pathology';
  if (roomId === 'F1-Z02') return 'ecg';
  if (roomId === 'F1-Z03') return 'consultation';
  if (roomId === 'F1-Z04') return 'ultrasound';
  if (roomId === 'F1-Z05') return 'pathology';
  if (roomId === 'F1-Z06') return 'consultation';
  if (roomId === 'F1-Z07') return 'recovery';
  if (roomId === 'F1-Z08') return 'admin';
  if (roomId === 'F1-Z09') return 'admin';
  if (roomId === 'F1-Z10') return 'procedure';

  // Second Floor
  if (roomId === 'F2-Z01') return 'nurse_station';
  if (roomId === 'F2-Z02') return 'ward';
  if (roomId === 'F2-Z03') return 'ward';
  if (roomId === 'F2-Z04') return 'ward';
  if (roomId === 'F2-Z05') return 'ward';
  if (roomId === 'F2-Z06') return 'semi_private';
  if (roomId === 'F2-Z07') return 'semi_private';
  if (roomId === 'F2-Z08') return 'pharmacy';
  if (roomId === 'F2-Z09') return 'recovery';
  if (roomId === 'F2-Z10') return 'semi_private';

  // Third Floor
  if (roomId === 'F3-Z01') return 'icu';
  if (roomId === 'F3-Z02') return 'ot';
  if (roomId === 'F3-Z03') return 'ot';
  if (roomId === 'F3-Z04') return 'nicu';
  if (roomId === 'F3-Z05') return 'icu';
  if (roomId === 'F3-Z06') return 'cssd';
  if (roomId === 'F3-Z07') return 'cssd';
  if (roomId === 'F3-Z08') return 'scrub';
  if (roomId === 'F3-Z09') return 'procedure';
  if (roomId === 'F3-Z10') return 'admin';

  // Fallbacks
  if (type.includes('ICU') || type.includes('Critical')) return 'icu';
  if (type.includes('Operation') || type.includes('Surgical')) return 'ot';
  if (type.includes('Ward')) return 'ward';
  if (type.includes('Laboratory') || type.includes('Pathology')) return 'pathology';
  if (type.includes('Pharmacy')) return 'pharmacy';
  return 'consultation';
};

/**
 * Generate flattened room list of exactly 40 zones with telemetry and devices
 */
export const allHospitalRooms = architecturalFloors.flatMap(floor =>
  floor.rooms.map(room => {
    const furnitureType = getRoomFurnitureType(room.id, room.type);
    const safetyCategory = room.critical
      ? (room.type.includes('ICU') || room.type.includes('Operation') || room.type.includes('Emergency') || room.type.includes('Resuscitation') || room.type.includes('Sterile') || room.type.includes('Dialysis') ? 'Critical' : 'Clinical')
      : (room.type.includes('Ward') || room.type.includes('Consultation') || room.type.includes('Dispensary') || room.type.includes('Diagnostic') || room.type.includes('Procedure') || room.type.includes('Suite') ? 'Clinical' : 'Non-Clinical');

    const bedCount = Math.max(0, room.beds || 0);
    const occupiedCount = Math.min(bedCount, Math.max(0, room.occupiedBeds || 0));
    const bedsList = Array.from({ length: bedCount }, (_, i) => ({
      id: `${room.id}-B0${i + 1}`,
      label: `${room.name.includes('ICU') ? 'ICU Bed' : room.name.includes('OT') ? 'Surgical Table' : 'Bed'} ${i + 1}`,
      occupied: i < occupiedCount,
      bedsideLight: i < occupiedCount,
      bedsideLightPowerKw: 0.04
    }));

    // Authoritative role breakdown
    const patients = bedCount > 0 ? occupiedCount : (room.patients ?? 0);
    const staff = room.staff ?? (room.critical ? 2 : 1);
    const visitors = room.visitors ?? Math.max(0, (room.people ?? 0) - patients - staff);
    const people = patients + staff + visitors;

    // Baseline lighting power (kW)
    const baseLightKw = room.critical ? 1.2 : room.type.includes('Ward') ? 0.9 : 0.6;
    // Baseline HVAC power (kW)
    const baseHvacKw = room.critical ? 3.4 : room.type.includes('Ward') ? 2.2 : 1.6;
    // Water rate (L/h)
    const baseWaterLph = room.type.includes('Dialysis') ? 28 : room.type.includes('Sterile') ? 22 : room.type.includes('Laboratory') ? 14 : room.beds > 0 ? 9 : room.name.includes('Cafeteria') ? 18 : 3;

    return {
      ...room,
      floorId: floor.id,
      floorName: floor.name,
      furnitureType,
      safetyCategory,
      lightOn: true,
      lightKw: baseLightKw,
      hvacMode: 'Running',
      hvacKw: baseHvacKw,
      waterLph: baseWaterLph,
      bedsList,
      patients,
      staff,
      visitors,
      people,
      thermostat: {
        setpointC: room.critical ? 21.0 : 23.0,
        currentC: room.critical ? 21.2 : 23.2,
      },
      airQuality: {
        co2Ppm: room.people > 4 ? 680 : 490,
        ach: room.critical ? 18 : 6,
      },
      devices: [
        { id: `${room.id}-D01`, name: `${room.name} IAQ & Telemetry Node`, type: 'Environmental IAQ', online: true },
        { id: `${room.id}-D02`, name: `${room.name} Smart Power Submeter`, type: 'Power Telemetry', online: true },
        ...(room.critical ? [{ id: `${room.id}-D03`, name: `${room.name} Critical UPS Line`, type: 'Power Protection', online: true }] : [])
      ],
    };
  })
);

export const architecturalDefaults = {
  buildingWidth: 32.0,
  buildingDepth: 14.0,
  floorHeight: 2.0,
  foundationElevation: -0.15,
  colonnadeColumnsCount: 4,
  columnRadius: 0.22,
  columnHeight: 1.6,
  rooflinePedimentWidth: 6.4,
  exteriorColor: '#ded8cc',
  trimColor: '#f1eee6',
  windowFrameColor: '#58716b',
  glassColor: '#88b6be',
};

export const initialIncidentAlerts = [
  {
    id: 'alt-01',
    severity: 'Critical',
    title: 'ICU Bed Telemetry Connection Interruption',
    roomId: 'F3-Z01',
    roomName: 'Central Critical-Care ICU (Intensive Care Module A)',
    floor: 'Third Floor',
    deviceId: 'F3-Z01-D01',
    description: 'Sub-second packet jitter detected on telemetry bus. High priority medical device check recommended.',
    status: 'active',
    timestamp: '14:28:10',
  },
  {
    id: 'alt-02',
    severity: 'Warning',
    title: 'CSSD Steam & Water Flow Anomaly',
    roomId: 'F3-Z06',
    roomName: 'Central Sterile Supply Department (CSSD Pack & Decon)',
    floor: 'Third Floor',
    deviceId: 'F3-Z06-D02',
    description: 'Continuous secondary water intake detected above baseline flow threshold. Inspect autoclave supply solenoid valve.',
    status: 'active',
    timestamp: '14:35:45',
  },
  {
    id: 'alt-03',
    severity: 'Info',
    title: 'High Occupant Density in Outpatient Concourse',
    roomId: 'GF-Z01',
    roomName: 'Main Reception & Waiting Lounge',
    floor: 'Ground Floor',
    deviceId: 'GF-Z01-D01',
    description: 'CO2 concentration at 690 ppm with peak arrival queue. Fresh air intake dampers adjusted to 30%.',
    status: 'resolved',
    timestamp: '13:50:20',
  },
];

export const initialSimulatorPolicies = {
  autoSetbackUnoccupied: true,
  smartHvacNonClinical: true,
  lowFlowPlumbing: true,
  offPeakScheduling: false,
};


/**
 * Single Authoritative Power Calculation for Rooms and Building Totals
 * Prevents double-counting, handles bedside task lights, HVAC states, and equipment loads.
 */
export function calculateRoomPower(room) {
  if (!room) {
    return {
      totalKw: 0,
      lightKw: 0,
      bedsideKw: 0,
      totalLightingKw: 0,
      hvacKw: 0,
      equipmentKw: 0,
    };
  }

  // 1. Ceiling / Main ambient lighting load (kW)
  const lightKw = room.lightOn ? (room.lightKw || 0) : 0;

  // 2. Individual bedside task lights (0.04 kW per active lamp)
  const bedsideKw = (room.bedsList || []).reduce(
    (sum, b) => sum + (b.bedsideLight !== false ? (b.bedsideLightPowerKw || 0.04) : 0),
    0
  );

  // Total lighting = main ceiling + individual bedside lamps
  const totalLightingKw = lightKw + bedsideKw;

  // 3. HVAC power demand based on operational mode
  const hvacMode = room.hvacMode || 'Running';
  const hvacFactor = hvacMode === 'Running' ? 1.0 : hvacMode === 'Eco' ? 0.65 : hvacMode === 'Ventilation' ? 0.15 : 0.12;
  const hvacKw = (room.hvacKw || 0) * hvacFactor;

  // 4. Configured equipment & medical telemetry baseline
  const equipmentKw = room.critical ? 1.5 : 0.4;

  // Total room demand (kW)
  const totalKw = totalLightingKw + hvacKw + equipmentKw;

  return {
    totalKw,
    lightKw,
    bedsideKw,
    totalLightingKw,
    hvacKw,
    equipmentKw,
  };
}

/**
 * Authoritative Occupancy and Bed State Synchronization Helper
 * Enforces:
 *   total people = patients + staff + visitors
 *   occupied beds = count of beds where occupied === true
 *   occupied beds <= total bed capacity
 *   in patient wards / ICU, patients === occupied beds
 */
export function syncRoomOccupancy(room, updates = {}) {
  const merged = { ...room, ...updates };
  const capacity = merged.capacity || 10;
  const beds = Math.max(0, merged.beds || 0);

  // Sync bedsList length with beds
  let bedsList = merged.bedsList || [];
  if (beds > 0) {
    if (!bedsList || bedsList.length !== beds) {
      const existingOcc = merged.occupiedBeds ?? bedsList.filter(b => b.occupied).length;
      bedsList = Array.from({ length: beds }, (_, i) => {
        const existing = bedsList[i];
        const isOcc = existing ? Boolean(existing.occupied) : i < existingOcc;
        return {
          id: existing?.id || `${merged.id}-B0${i + 1}`,
          label: existing?.label || `${merged.name.includes('ICU') ? 'ICU Bed' : merged.name.includes('OT') ? 'Surgical Table' : 'Bed'} ${i + 1}`,
          occupied: isOcc,
          bedsideLight: existing ? existing.bedsideLight !== false : isOcc,
          bedsideLightPowerKw: existing?.bedsideLightPowerKw || 0.04,
        };
      });
    }
  } else {
    bedsList = [];
  }

  // Derived occupied beds directly from bedsList
  const occupiedBeds = bedsList.filter(b => b.occupied).length;

  // Patient count logic:
  // For patient bed rooms, patients equals occupied beds
  let patients = 0;
  if (beds > 0) {
    patients = occupiedBeds;
  } else if (['GF-Z04', 'GF-Z05', 'F1-Z04'].includes(merged.id)) {
    // Diagnostic imaging couch / table
    patients = Math.min(1, Math.max(0, merged.patients ?? 0));
  } else {
    patients = 0;
  }

  let staff = Math.max(0, merged.staff ?? (merged.critical ? 2 : 1));
  let visitors = Math.max(0, merged.visitors ?? 0);

  // Total people is the sum of roles
  let people = patients + staff + visitors;

  // Enforce capacity bounds
  if (people > capacity) {
    const overflow = people - capacity;
    const trimVisitors = Math.min(visitors, overflow);
    visitors -= trimVisitors;
    const remainingOverflow = overflow - trimVisitors;
    staff = Math.max(0, staff - remainingOverflow);
    people = patients + staff + visitors;
  }

  return {
    ...merged,
    capacity,
    beds,
    occupiedBeds,
    bedsList,
    patients,
    staff,
    visitors,
    people,
  };
}
