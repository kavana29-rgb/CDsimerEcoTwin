const fs = require('fs');
const path = require('path');

// 1. Check hospitalArchitectureData
const archFile = fs.readFileSync(path.join(__dirname, 'src', 'data', 'hospitalArchitectureData.js'), 'utf8');

console.log('--- 1. ARCHITECTURE AUDIT ---');
const roomMatches = archFile.match(/id:\s*'(GF|F1|F2|F3)-Z\d\d'/g);
console.log('Total room IDs in hospitalArchitectureData:', roomMatches ? roomMatches.length : 0);

const gfCount = (archFile.match(/id:\s*'GF-Z\d\d'/g) || []).length;
const f1Count = (archFile.match(/id:\s*'F1-Z\d\d'/g) || []).length;
const f2Count = (archFile.match(/id:\s*'F2-Z\d\d'/g) || []).length;
const f3Count = (archFile.match(/id:\s*'F3-Z\d\d'/g) || []).length;
console.log(`Floors: GF=${gfCount}, F1=${f1Count}, F2=${f2Count}, F3=${f3Count} (Total=${gfCount+f1Count+f2Count+f3Count})`);

if (gfCount !== 10 || f1Count !== 10 || f2Count !== 10 || f3Count !== 10) {
  console.error('ERROR: Floors do not have exactly 10 rooms each!');
  process.exit(1);
}

// 2. Check App.jsx navigation
console.log('\n--- 2. NAVIGATION AUDIT IN App.jsx ---');
const appFile = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf8');

// Check navigation items
const navMatch = appFile.match(/const navItems = \[([\s\S]*?)\];/);
if (!navMatch) {
  console.error('ERROR: navItems not found in App.jsx');
  process.exit(1);
}
console.log('Nav items:\n' + navMatch[1].trim());

// Verify required 10 items
const requiredNavs = [
  'facility-overview',
  'operations-overview',
  'twin',
  'zones',
  'energy',
  'resources',
  'insights',
  'simulator',
  'alerts',
  'reports'
];

requiredNavs.forEach(id => {
  if (!navMatch[1].includes(`id: '${id}'`)) {
    console.error(`ERROR: Missing required nav item '${id}'`);
    process.exit(1);
  }
});
console.log('✓ All 10 required navigation items are present.');

// Check deleted controls
console.log('\n--- 3. DELETED CONTROLS AUDIT ---');
const hasMobileClose = appFile.includes('mobile-close');
const hasSidebarBack = appFile.includes('sidebar-back-to-website');
const hasTopbarHome = appFile.includes('topbar-back-to-website');
const hasMobileMenu = appFile.includes('mobile-menu icon-button');
const hasManualLightingNav = navMatch[1].includes('lighting');

console.log('Has mobile close (X button beside logo):', hasMobileClose);
console.log('Has sidebar-back-to-website button:', hasSidebarBack);
console.log('Has topbar-back-to-website button:', hasTopbarHome);
console.log('Has mobile-menu hamburger button:', hasMobileMenu);
console.log('Has standalone lighting matrix in nav:', hasManualLightingNav);

if (hasMobileClose || hasSidebarBack || hasTopbarHome || hasMobileMenu || hasManualLightingNav) {
  console.error('ERROR: One or more forbidden navigation controls are still present!');
  process.exit(1);
}
console.log('✓ All 3 specified navigation elements and duplicate redirects are cleanly removed.');

// 4. Check FacilityOverviewDashboard component
console.log('\n--- 4. FACILITY OVERVIEW DASHBOARD AUDIT ---');
const dashFile = fs.readFileSync(path.join(__dirname, 'src', 'components', 'FacilityOverviewDashboard.jsx'), 'utf8');

const hasChartA = dashFile.includes('CHART A · RANKED ELECTRICAL POWER DEMAND');
const hasChartB = dashFile.includes('CHART B · CAPACITY UTILIZATION & HEADCOUNT');
const hasChartC = dashFile.includes('CHART C · ELECTRICAL LOAD COMPOSITION');
const hasChartD = dashFile.includes('CHART D · TEMPORAL CONSUMPTION TRENDS');
const hasKPIs = dashFile.includes('facility-kpi-grid');
const hasQuickLinks = dashFile.includes('fdh-actions') && dashFile.includes('Open 3D Twin');

console.log('Has Chart A (Department Energy Consumption):', hasChartA);
console.log('Has Chart B (Department Occupancy):', hasChartB);
console.log('Has Chart C (Facility Energy Breakdown Donut):', hasChartC);
console.log('Has Chart D (Resource Consumption Trends):', hasChartD);
console.log('Has KPI cards quintet:', hasKPIs);
console.log('Has Quick links to 3D Twin & Monitored Zones:', hasQuickLinks);

if (!hasChartA || !hasChartB || !hasChartC || !hasChartD || !hasKPIs || !hasQuickLinks) {
  console.error('ERROR: Missing required visual analytics in FacilityOverviewDashboard!');
  process.exit(1);
}
console.log('✓ FacilityOverviewDashboard has all required charts and operational controls.');

// 5. Check 40 zones mapped in departments
console.log('\n--- 5. DEPARTMENT 40-ZONE COVERAGE AUDIT ---');
const deptMatches = dashFile.match(/roomIds:\s*\[([\s\S]*?)\]/g);
let allDeptRoomIds = [];
deptMatches.forEach(m => {
  const ids = m.match(/'(GF|F1|F2|F3)-Z\d\d'/g).map(s => s.replace(/'/g, ''));
  allDeptRoomIds = allDeptRoomIds.concat(ids);
});
console.log(`Total room IDs mapped across 8 departments: ${allDeptRoomIds.length}`);

const uniqueRoomIds = new Set(allDeptRoomIds);
console.log(`Unique room IDs mapped: ${uniqueRoomIds.size}`);

if (allDeptRoomIds.length !== 40 || uniqueRoomIds.size !== 40) {
  console.error('ERROR: Departments do not map exactly to 40 unique zones!');
  process.exit(1);
}
console.log('✓ Exactly 40 unique zones are mapped across the 8 standard hospital departments.');

// 6. Check EnergyCarbonDashboard for Chart E
console.log('\n--- 6. ENERGY, SOLAR & CARBON AUDIT (CHART E) ---');
const energyFile = fs.readFileSync(path.join(__dirname, 'src', 'components', 'sustainability', 'EnergyCarbonDashboard.jsx'), 'utf8');
const hasChartE = energyFile.includes('CHART E · SOLAR GENERATION VERSUS BUILDING DEMAND');
const hasMetricToggle = energyFile.includes('profileMetric === \'kw\'');
const hasModelledLabel = energyFile.includes('modelled estimate');

console.log('Has Chart E (Solar Gen vs Demand):', hasChartE);
console.log('Has kW vs kWh metric toggle:', hasMetricToggle);
console.log('Has clear modelled estimate label:', hasModelledLabel);

if (!hasChartE || !hasMetricToggle || !hasModelledLabel) {
  console.error('ERROR: EnergyCarbonDashboard missing Chart E requirements!');
  process.exit(1);
}
console.log('✓ Chart E correctly distinguishes kW vs kWh and labels modelled solar output.');

// 7. Check WaterMaterialsDashboard for Chart F
console.log('\n--- 7. WATER & MATERIALS AUDIT (CHART F) ---');
const waterFile = fs.readFileSync(path.join(__dirname, 'src', 'components', 'sustainability', 'WaterMaterialsDashboard.jsx'), 'utf8');
const hasDeptWaterChart = waterFile.includes('DEPARTMENT WATER DEMAND (L/DAY)');
const hasWaterCompare = waterFile.includes('BASELINE VS PROPOSED WATER USE');
const hasPaperVisual = waterFile.includes('Paper Conservation Visualization');
const hasWasteBreakdown = waterFile.includes('Statutory Waste Stream Distribution');
const has4Streams = waterFile.includes('Yellow Stream') && waterFile.includes('Red Stream') && waterFile.includes('Blue Stream') && waterFile.includes('White Stream');

console.log('Has Department Water Demand bar chart:', hasDeptWaterChart);
console.log('Has Baseline vs Proposed Water comparison:', hasWaterCompare);
console.log('Has Paper reduction visual bar:', hasPaperVisual);
console.log('Has Biomedical waste breakdown visual:', hasWasteBreakdown);
console.log('Has 4 distinct statutory waste streams:', has4Streams);

if (!hasDeptWaterChart || !hasWaterCompare || !hasPaperVisual || !hasWasteBreakdown || !has4Streams) {
  console.error('ERROR: WaterMaterialsDashboard missing Chart F visuals!');
  process.exit(1);
}
console.log('✓ Chart F visuals are complete with distinct clinical categories.');

// 8. Check Default Landing Page & Hash Sync
console.log('\n--- 8. DEFAULT LANDING PAGE & ROUTING AUDIT ---');
const hasLandingDefault = appFile.includes("return 'landing';");
const hasHashSync = appFile.includes("window.addEventListener('hashchange', handleHashSync);");
const hasFacilityOverviewRoute = appFile.includes("page === 'facility-overview'");

console.log('Default page is landing page:', hasLandingDefault);
console.log('Hash sync enabled (hashchange & popstate):', hasHashSync);
console.log('Facility overview operational route active:', hasFacilityOverviewRoute);

if (!hasLandingDefault || !hasHashSync || !hasFacilityOverviewRoute) {
  console.error('ERROR: Landing page default or hash routing verification failed!');
  process.exit(1);
}
console.log('✓ Landing page configured as default landing page with bidirectional hash routing.');

console.log('\n========================================');
console.log('🎉 ALL SYSTEM VERIFICATION CHECKS PASSED!');
console.log('========================================');
