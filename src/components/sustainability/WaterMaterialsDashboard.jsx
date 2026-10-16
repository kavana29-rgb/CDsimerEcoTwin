import React, { useState, useMemo } from 'react';
import {
  Droplets, FileText, Recycle, TreeDeciduous, HeartHandshake,
  ShieldCheck, ArrowUpRight, CheckCircle2, ChevronRight, Sliders,
  Info, Sparkles, Building2, Eye
} from 'lucide-react';
import {
  calculateWaterMetrics,
  calculatePaperMetrics,
  calculateWasteMetrics,
  SUSTAINABILITY_CONSTANTS
} from '../../data/sustainabilityEngine.js';

const fmt = (n, digits = 1) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export default function WaterMaterialsDashboard({
  rooms = [],
  sustainabilityParams = {},
  updateSustainabilityParam = () => {},
  onNavigateToRoom = () => {},
}) {
  // Scenario Toggles
  const [waterLowFlowActive, setWaterLowFlowActive] = useState(true);
  const [digitalEmrActive, setDigitalEmrActive] = useState(true);
  const [wasteSegregationActive, setWasteSegregationActive] = useState(true);

  // Editable Assumptions from Macro Levers
  const waterTariff = sustainabilityParams.waterTariffPerKL ?? SUSTAINABILITY_CONSTANTS.DEFAULT_WATER_TARIFF_PER_KL;
  const paperBaseline = sustainabilityParams.paperSheetsPerDay ?? SUSTAINABILITY_CONSTANTS.BASELINE_PAPER_SHEETS_PER_DAY;
  const wasteBaseline = sustainabilityParams.biomedicalWasteKgPerDay ?? SUSTAINABILITY_CONSTANTS.BASELINE_BIOMEDICAL_WASTE_KG_PER_DAY;

  // 1. Water calculations
  const waterMetrics = useMemo(() => {
    return calculateWaterMetrics(rooms, {
      waterTariffPerKL: waterTariff,
      lowFlowReductionPct: waterLowFlowActive ? 25 : 0,
    });
  }, [rooms, waterTariff, waterLowFlowActive]);

  // 2. Paper calculations
  const paperMetrics = useMemo(() => {
    return calculatePaperMetrics({
      baselineSheets: paperBaseline,
      digitalWorkflowReductionPct: digitalEmrActive ? 70 : 0,
    });
  }, [paperBaseline, digitalEmrActive]);

  // 3. Waste calculations
  const wasteMetrics = useMemo(() => {
    return calculateWasteMetrics({
      baselineBiomedicalKg: wasteBaseline,
      segregationAuditActive: wasteSegregationActive,
    });
  }, [wasteBaseline, wasteSegregationActive]);

  // 4. Department Water Aggregation (L/day)
  const departmentWater = useMemo(() => {
    const map = {};
    rooms.forEach(r => {
      if ((r.waterLph || 0) > 0) {
        const dept = r.department || r.type || 'Clinical Support';
        map[dept] = (map[dept] || 0) + (r.waterLph * 24);
      }
    });
    return Object.entries(map)
      .map(([name, litresDaily]) => ({ name, litresDaily }))
      .sort((a, b) => b.litresDaily - a.litresDaily);
  }, [rooms]);

  // 5. Staff Environment Indicators
  const staffRooms = useMemo(() => {
    return rooms.filter(r => 
      r.department?.includes('Staff') || 
      r.type?.includes('Staff') || 
      r.type?.includes('Station') || 
      r.type?.includes('Consultation') ||
      r.id === 'F1-Z09' || // Doctors Lounge
      r.id === 'F2-Z01' || // Central Nurse Station
      r.id === 'F3-Z10'    // Surgical Briefing Suite
    );
  }, [rooms]);

  const staffHvacRunningCount = staffRooms.filter(r => r.hvacMode === 'Running' || r.hvacMode === 'Eco').length;
  const staffHvacCoveragePct = staffRooms.length > 0
    ? ((staffHvacRunningCount / staffRooms.length) * 100).toFixed(0)
    : '100';

  return (
    <div className="page-stack">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="eyebrow">RESOURCE EFFICIENCY & CIRCULARITY</div>
          <h1>Water, Materials & Circularity Intelligence</h1>
          <p>Potable water monitoring, administrative paperless EMR workflows, and biomedical waste stream management.</p>
        </div>
        <div className="calculation-badge">
          <span>Water Tariff: ₹{waterTariff.toFixed(2)}/kL · Modelled Telemetry Baseline</span>
        </div>
      </div>

      {/* A. 4 Aligned Summary Cards at Top */}
      <div className="wm-summary-grid">
        {/* Card 1: Water Consumption */}
        <div className="wm-summary-card">
          <div className="wm-summary-card-header">
            <span className="wm-summary-card-title">Water Consumption</span>
            <div className="wm-summary-card-icon blue">
              <Droplets size={18} />
            </div>
          </div>
          <div className="wm-summary-card-val-row">
            <span className="wm-summary-card-val">{fmt(waterMetrics.optimizedDailyLitres, 0)}</span>
            <span className="wm-summary-card-unit">L/day</span>
          </div>
          <div className="wm-summary-card-sub">
            {waterLowFlowActive ? (
              <>Estimated reduction: <strong>{fmt(waterMetrics.savedDailyLitres, 0)} L/day (-25%)</strong></>
            ) : (
              'Baseline usage without low-flow aerators'
            )}
          </div>
          <span className="wm-badge-modelled">Modelled Estimate</span>
        </div>

        {/* Card 2: Paper Consumption */}
        <div className="wm-summary-card">
          <div className="wm-summary-card-header">
            <span className="wm-summary-card-title">Paper Consumption</span>
            <div className="wm-summary-card-icon amber">
              <FileText size={18} />
            </div>
          </div>
          <div className="wm-summary-card-val-row">
            <span className="wm-summary-card-val">{fmt(paperMetrics.optimizedSheets, 0)}</span>
            <span className="wm-summary-card-unit">sheets/day</span>
          </div>
          <div className="wm-summary-card-sub">
            {digitalEmrActive ? (
              <>Estimated reduction: <strong>{fmt(paperMetrics.savedSheetsDaily, 0)} sheets/day (-70%)</strong></>
            ) : (
              'Standard paper prescription baseline'
            )}
          </div>
          <span className="wm-badge-modelled">EMR Workflow Model</span>
        </div>

        {/* Card 3: Biomedical Waste */}
        <div className="wm-summary-card">
          <div className="wm-summary-card-header">
            <span className="wm-summary-card-title">Biomedical Waste</span>
            <div className="wm-summary-card-icon red">
              <Recycle size={18} />
            </div>
          </div>
          <div className="wm-summary-card-val-row">
            <span className="wm-summary-card-val">{fmt(wasteMetrics.optimizedBiomedicalKg, 1)}</span>
            <span className="wm-summary-card-unit">kg/day</span>
          </div>
          <div className="wm-summary-card-sub">
            {wasteSegregationActive ? (
              <>Estimated reduction: <strong>{fmt(wasteMetrics.savedBiomedicalKgDaily, 1)} kg/day (-14%)</strong></>
            ) : (
              'Standard unsegregated disposal baseline'
            )}
          </div>
          <span className="wm-badge-modelled">Segregation Model</span>
        </div>

        {/* Card 4: Resource Conservation */}
        <div className="wm-summary-card">
          <div className="wm-summary-card-header">
            <span className="wm-summary-card-title">Resource Conservation</span>
            <div className="wm-summary-card-icon mint">
              <TreeDeciduous size={18} />
            </div>
          </div>
          <div className="wm-summary-card-val-row">
            <span className="wm-summary-card-val">{paperMetrics.treesSavedAnnual}</span>
            <span className="wm-summary-card-unit">trees/year</span>
          </div>
          <div className="wm-summary-card-sub">
            Diverts <strong>~{fmt(paperMetrics.savedWeightKgAnnual, 0)} kg</strong> paper pulp waste annually
          </div>
          <span className="wm-badge-modelled">Calculated Benchmark</span>
        </div>
      </div>

      {/* B. Water Monitoring Section */}
      <div className="content-card">
        <div className="section-heading">
          <div>
            <h2>💧 Potable Water Monitoring & Intensity Analysis</h2>
            <p>Monitored hospital water consumption across clinical, dietary, hemodialysis, and inpatient zones.</p>
          </div>
          <label className="scenario-inline-toggle">
            <input
              type="checkbox"
              checked={waterLowFlowActive}
              onChange={(e) => setWaterLowFlowActive(e.target.checked)}
            />
            <span>Enable 25% Low-Flow Sensor Fixtures & Aerators</span>
          </label>
        </div>

        {/* 4-Metric Comparison Quad */}
        <div className="wm-metrics-quad">
          <div className="wm-metric-cell">
            <span className="wm-metric-label">Hospital Daily Volume</span>
            <div className="wm-metric-val">{fmt(waterMetrics.optimizedDailyLitres, 0)} <small>L/day</small></div>
            <span className="wm-metric-note">Baseline: {fmt(waterMetrics.baselineDailyLitres, 0)} L/day</span>
          </div>

          <div className="wm-metric-cell">
            <span className="wm-metric-label">Water Intensity per Bed</span>
            <div className="wm-metric-val">{waterMetrics.litresPerBedDay} <small>L / bed-day</small></div>
            <span className="wm-metric-note">Occupied: {waterMetrics.totalOccupiedBeds} inpatient beds</span>
          </div>

          <div className="wm-metric-cell">
            <span className="wm-metric-label">Water Intensity per Person</span>
            <div className="wm-metric-val">{waterMetrics.litresPerPersonDay} <small>L / person-day</small></div>
            <span className="wm-metric-note">Occupants: {waterMetrics.totalPeople} present</span>
          </div>

          <div className="wm-metric-cell highlight">
            <span className="wm-metric-label">Projected Water Savings</span>
            <div className="wm-metric-val" style={{ color: '#059669' }}>
              {fmt(waterMetrics.savedDailyLitres, 0)} <small>L/day</small>
            </div>
            <span className="wm-metric-note">Annual cost avoided: ₹{fmt(waterMetrics.savedAnnualCost, 0)}</span>
          </div>
        </div>

        {/* Visual Analytics: Department Water & Baseline vs Proposed Comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', margin: '20px 0 10px' }}>
          {/* Department Water Consumption Horizontal Bar Chart */}
          <div style={{ background: '#faf6ee', padding: '16px', borderRadius: '10px', border: '1px solid #e8ddc6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#B88A3B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                DEPARTMENT WATER DEMAND (L/DAY)
              </span>
              <span style={{ fontSize: '11px', color: '#684832', fontWeight: 600 }}>
                Total: {fmt(waterMetrics.optimizedDailyLitres, 0)} L/day
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {departmentWater.slice(0, 6).map((item, idx) => {
                const maxWater = departmentWater[0]?.litresDaily || 1;
                const widthPct = Math.max(5, (item.litresDaily / maxWater) * 100);
                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 65px', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600, color: '#39281F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.name}>
                      {item.name}
                    </span>
                    <div style={{ height: '8px', background: '#e8ddc6', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${widthPct}%`, height: '100%', background: 'linear-gradient(90deg, #c5a04f, #0284c7)', borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontWeight: 700, color: '#0284c7', textAlign: 'right' }}>
                      {fmt(item.litresDaily, 0)} <small style={{ fontSize: '9.5px', color: '#8c7565' }}>L</small>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Baseline vs Proposed Water Visual Comparison */}
          <div style={{ background: '#faf6ee', padding: '16px', borderRadius: '10px', border: '1px solid #e8ddc6' }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#B88A3B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                BASELINE VS PROPOSED WATER USE
              </span>
              <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#684832' }}>
                Impact of 25% flow aerators and sensor taps in clinical scrub bays & wet zones.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: '#684832' }}>Baseline Standard (Unmitigated)</span>
                  <strong style={{ color: '#39281F' }}>{fmt(waterMetrics.baselineDailyLitres, 0)} L/day</strong>
                </div>
                <div style={{ height: '12px', background: '#e8ddc6', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: '#8c7565', borderRadius: '6px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#059669' }}>Proposed (25% Sensor Aerators)</span>
                  <strong style={{ color: '#059669' }}>{fmt(waterMetrics.optimizedDailyLitres, 0)} L/day</strong>
                </div>
                <div style={{ height: '12px', background: '#e8ddc6', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${(waterMetrics.optimizedDailyLitres / waterMetrics.baselineDailyLitres) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '6px' }} />
                </div>
              </div>

              <div style={{ fontSize: '11.5px', color: '#059669', background: '#eaf4ee', padding: '6px 10px', borderRadius: '6px', fontWeight: 600 }}>
                ✓ Avoids {fmt(waterMetrics.savedDailyLitres, 0)} Litres/day (~{fmt((waterMetrics.savedDailyLitres * 365) / 1000, 1)} kL/year)
              </div>
            </div>
          </div>
        </div>

        {/* Readable Monitored Water Zones Table */}
        <h3 style={{ fontSize: '13px', fontWeight: 800, margin: '22px 0 10px', color: '#133526' }}>
          Key Process Water Consumers & Continuous Monitored Zones
        </h3>
        <div className="wm-table-container">
          <table className="wm-data-table">
            <thead>
              <tr>
                <th>Zone ID</th>
                <th>Room Name</th>
                <th>Floor</th>
                <th>Flow Rate</th>
                <th>Daily Volume</th>
                <th>Clinical Process & Usage</th>
                <th>3D Action</th>
              </tr>
            </thead>
            <tbody>
              {waterMetrics.highConsumerZones.map(zone => (
                <tr key={zone.id}>
                  <td><code>{zone.id}</code></td>
                  <td><strong>{zone.name}</strong></td>
                  <td>{zone.floorId}</td>
                  <td><strong>{zone.rateLph} L/h</strong></td>
                  <td>{fmt(zone.dailyL, 0)} L/day</td>
                  <td><span style={{ color: '#475569' }}>{zone.reason}</span></td>
                  <td>
                    <button
                      className="btn-wm-inspect"
                      onClick={() => onNavigateToRoom(zone.id, zone.floorId)}
                      title={`Inspect ${zone.name} (${zone.id}) in 3D Hospital Twin`}
                    >
                      <Eye size={12} />
                      <span>Inspect Zone</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* C & D. Split Layout for Paper and Biomedical Waste */}
      <div className="twin-split-layout">
        {/* C. Paper Consumption Section */}
        <div className="content-card">
          <div className="section-heading">
            <div>
              <h2>📄 Paper Consumption & EMR Digitization</h2>
              <p>Model administrative digitization across medical registries, OPD prescriptions, and patient charts.</p>
            </div>
            <label className="scenario-inline-toggle">
              <input
                type="checkbox"
                checked={digitalEmrActive}
                onChange={(e) => setDigitalEmrActive(e.target.checked)}
              />
              <span>Model 70% Paperless EMR</span>
            </label>
          </div>

          {/* 3-Column Concise Comparison Layout */}
          <div className="wm-paper-comparison-grid">
            <div className="wm-paper-col baseline">
              <span className="wm-paper-col-label">Baseline Paper Use</span>
              <div className="wm-paper-col-val">{fmt(paperMetrics.baselineSheets, 0)} <span>sheets/day</span></div>
              <div className="wm-paper-col-sub">
                ~{fmt(paperMetrics.baselineSheets / 500, 1)} reams/day<br/>
                ₹{fmt(paperMetrics.baselineCostDaily, 0)} daily cost
              </div>
            </div>

            <div className="wm-paper-col proposed">
              <span className="wm-paper-col-label">Proposed Paper Use</span>
              <div className="wm-paper-col-val">{fmt(paperMetrics.optimizedSheets, 0)} <span>sheets/day</span></div>
              <div className="wm-paper-col-sub">
                ~{fmt(paperMetrics.optimizedSheets / 500, 1)} reams/day<br/>
                Digital EMR prescriptions
              </div>
            </div>

            <div className="wm-paper-col savings">
              <span className="wm-paper-col-label">Estimated Reduction</span>
              <div className="wm-paper-col-val" style={{ color: '#059669' }}>
                {fmt(paperMetrics.savedSheetsDaily, 0)} <span>sheets/day</span>
              </div>
              <div className="wm-paper-col-sub">
                Avoids ~{fmt(paperMetrics.savedSheetsDaily * 365, 0)} sheets/yr<br/>
                Saves ₹{fmt(paperMetrics.savedCostAnnual, 0)} annually
              </div>
            </div>
          </div>

          {/* Visual Bar Comparison for Paper Reduction */}
          <div style={{ background: '#faf6ee', padding: '14px', borderRadius: '8px', border: '1px solid #e8ddc6', marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, color: '#39281F' }}>Paper Conservation Visualization</span>
              <span style={{ fontWeight: 700, color: '#059669' }}>-70% Volume Avoidance</span>
            </div>
            <div style={{ height: '14px', background: '#e8ddc6', borderRadius: '7px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: '30%', height: '100%', background: '#b45309', borderRadius: '7px 0 0 7px' }} title="Proposed active paper: 360 sheets/day" />
              <div style={{ width: '70%', height: '100%', background: '#10b981', opacity: 0.9 }} title="Avoided via EMR: 840 sheets/day" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#684832', marginTop: '4px' }}>
              <span>Proposed Use: {fmt(paperMetrics.optimizedSheets, 0)} sheets/day (30%)</span>
              <span>Avoided Digitally: {fmt(paperMetrics.savedSheetsDaily, 0)} sheets/day (70%)</span>
            </div>
          </div>

          <div className="notice gold" style={{ marginTop: '16px' }}>
            <TreeDeciduous size={16} color="#B88A3B" />
            <div>
              <strong>Environmental Impact Calculation Assumption:</strong>
              <div style={{ marginTop: '2px', fontSize: '12px' }}>
                1 standard tree conserved per 8,000 sheets (16 reams) of 80 GSM virgin wood pulp A4 paper. 
                At 70% EMR digitization, CDSIMER models conserving <strong>{paperMetrics.treesSavedAnnual} trees/year</strong> and 
                diverting <strong>~{fmt(paperMetrics.savedWeightKgAnnual, 0)} kg</strong> of paper waste annually.
              </div>
            </div>
          </div>
        </div>

        {/* D. Biomedical Waste Section */}
        <div className="content-card">
          <div className="section-heading">
            <div>
              <h2>☣️ Biomedical Waste Management & Circularity</h2>
              <p>Segregation according to national healthcare waste categories (Yellow, Red, Blue, White).</p>
            </div>
            <label className="scenario-inline-toggle">
              <input
                type="checkbox"
                checked={wasteSegregationActive}
                onChange={(e) => setWasteSegregationActive(e.target.checked)}
              />
              <span>14% Segregation Optimization</span>
            </label>
          </div>

          {/* Biomedical Waste Category Visual Breakdown Bar */}
          <div style={{ background: '#faf6ee', padding: '14px', borderRadius: '8px', border: '1px solid #e8ddc6', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, color: '#39281F' }}>Statutory Waste Stream Distribution</span>
              <span style={{ fontWeight: 700, color: '#684832' }}>Total: {fmt(wasteMetrics.optimizedBiomedicalKg, 1)} kg/day</span>
            </div>
            <div style={{ height: '14px', background: '#e8ddc6', borderRadius: '7px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: '48%', height: '100%', background: '#eab308' }} title="Yellow: 48%" />
              <div style={{ width: '32%', height: '100%', background: '#ef4444' }} title="Red: 32%" />
              <div style={{ width: '12%', height: '100%', background: '#3b82f6' }} title="Blue: 12%" />
              <div style={{ width: '8%', height: '100%', background: '#94a3b8' }} title="White: 8%" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#684832', marginTop: '4px', flexWrap: 'wrap', gap: '4px' }}>
              <span>🟡 Yellow (48%)</span>
              <span>🔴 Red (32%)</span>
              <span>🔵 Blue (12%)</span>
              <span>⚪ White (8%)</span>
            </div>
          </div>

          {/* 4 Biomedical Waste Category Cards */}
          <div className="wm-waste-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
            <div className="wm-waste-stream-card yellow">
              <div className="wm-waste-title-row">
                <span className="wm-waste-stream-name">Yellow Stream</span>
                <span className="wm-waste-stream-share">48% Share</span>
              </div>
              <div className="wm-waste-weight">
                {fmt(wasteMetrics.optimizedBiomedicalKg * 0.48, 1)} <small style={{ fontSize: '12px', color: '#64748b' }}>kg/day</small>
              </div>
              <div className="wm-waste-treatment-info">
                <strong>Anatomical & Soiled:</strong> Incineration / Plasma Pyrolysis.
              </div>
            </div>

            <div className="wm-waste-stream-card red">
              <div className="wm-waste-title-row">
                <span className="wm-waste-stream-name">Red Stream</span>
                <span className="wm-waste-stream-share">32% Share</span>
              </div>
              <div className="wm-waste-weight">
                {fmt(wasteMetrics.optimizedBiomedicalKg * 0.32, 1)} <small style={{ fontSize: '12px', color: '#64748b' }}>kg/day</small>
              </div>
              <div className="wm-waste-treatment-info">
                <strong>Contaminated Plastics:</strong> Autoclave & secondary shredding.
              </div>
            </div>

            <div className="wm-waste-stream-card blue">
              <div className="wm-waste-title-row">
                <span className="wm-waste-stream-name">Blue Stream</span>
                <span className="wm-waste-stream-share">12% Share</span>
              </div>
              <div className="wm-waste-weight">
                {fmt(wasteMetrics.optimizedBiomedicalKg * 0.12, 1)} <small style={{ fontSize: '12px', color: '#64748b' }}>kg/day</small>
              </div>
              <div className="wm-waste-treatment-info">
                <strong>Glass & Implants:</strong> Disinfection & recycling.
              </div>
            </div>

            <div className="wm-waste-stream-card white" style={{ borderTop: '3px solid #94a3b8' }}>
              <div className="wm-waste-title-row">
                <span className="wm-waste-stream-name">White Stream</span>
                <span className="wm-waste-stream-share" style={{ background: '#f1f5f9', color: '#475569' }}>8% Share</span>
              </div>
              <div className="wm-waste-weight">
                {fmt(wasteMetrics.optimizedBiomedicalKg * 0.08, 1)} <small style={{ fontSize: '12px', color: '#64748b' }}>kg/day</small>
              </div>
              <div className="wm-waste-treatment-info">
                <strong>Needles & Sharps:</strong> Puncture-proof sharps pit.
              </div>
            </div>
          </div>

          <div className="notice amber" style={{ marginTop: '16px' }}>
            <ShieldCheck size={16} />
            <div>
              <strong>Biomedical Waste Safety Protocol:</strong>
              <div style={{ marginTop: '2px', fontSize: '12px' }}>
                All figures represent modeled clinical generation. Under Bio-Medical Waste Management Rules, segregation at source is mandatory. Infectious clinical waste streams must NEVER be commingled or diverted from statutory autoclave/incineration processing.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* E. Staff Environment & Resource Conservation */}
      <div className="content-card">
        <div className="section-heading">
          <div>
            <h2>🩺 Staff Environment & Workplace Wellbeing (UN SDG 8 & 12 Context)</h2>
            <p>Facility environmental conditions, indoor thermal comfort, and HVAC availability across clinical staff amenities.</p>
          </div>
          <span className="count-pill">{staffRooms.length} Staff Amenities Monitored</span>
        </div>

        <div className="wm-metrics-quad">
          <div className="wm-metric-cell">
            <span className="wm-metric-label">Staff HVAC Availability</span>
            <div className="wm-metric-val">{staffHvacCoveragePct}%</div>
            <span className="wm-metric-note">{staffHvacRunningCount} of {staffRooms.length} staff areas conditioned</span>
          </div>

          <div className="wm-metric-cell">
            <span className="wm-metric-label">Thermal Comfort Setpoint</span>
            <div className="wm-metric-val">23.0°C <small>Optimal</small></div>
            <span className="wm-metric-note">Doctors lounge, nurse stations & duty rooms</span>
          </div>

          <div className="wm-metric-cell">
            <span className="wm-metric-label">Indoor Air Quality Target</span>
            <div className="wm-metric-val">&lt; 620 <small>ppm CO₂</small></div>
            <span className="wm-metric-note">Fresh air exchange adhering to NABH standards</span>
          </div>

          <div className="wm-metric-cell highlight">
            <span className="wm-metric-label">Staff Privacy Protection</span>
            <div className="wm-metric-val" style={{ color: '#059669' }}>100% Protected</div>
            <span className="wm-metric-note">No individual employee surveillance or metrics</span>
          </div>
        </div>

        <div className="notice green" style={{ marginTop: '16px' }}>
          <HeartHandshake size={16} />
          <div>
            <strong>Decent Work & Environmental Stewardship Alignment:</strong>
            <div style={{ marginTop: '2px', fontSize: '12px' }}>
              CDsimerEcoTwin evaluates staff wellbeing through ambient thermal comfort, acoustic design, and reliable lighting controls in clinical support zones, adhering strictly to privacy guidelines without individualized surveillance.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
