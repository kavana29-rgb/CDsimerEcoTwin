import React, { useState } from 'react';
import {
  Sliders, Zap, ShieldCheck, AlertTriangle, RotateCcw, Check,
  Info, Users, Droplets, Sun, Wind, Lightbulb, FileText,
  Recycle, Gauge, CloudSun, CheckCircle2, ChevronDown, ChevronRight,
  Sparkles, BatteryCharging, AlertOctagon
} from 'lucide-react';

const fmt = (n, digits = 1) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export default function ParameterValidationPanel({
  rooms,
  updateRoom,
  selectedRoomId,
  setSelectedRoomId,
  sustainabilityParams,
  updateSustainabilityParam,
  onResetBaseline,
  onApplyGreenSetpoints,
}) {
  const [activeTab, setActiveTab] = useState('zone'); // 'zone' | 'macro' | 'methodology'
  const [selectedFloorFilter, setSelectedFloorFilter] = useState('ALL');
  const [validationErrors, setValidationErrors] = useState({});

  const activeRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];

  // Helper to safely set validation error with auto-clear
  const reportError = (field, msg) => {
    setValidationErrors(prev => ({ ...prev, [field]: msg }));
    setTimeout(() => {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }, 4000);
  };

  // Validated Zone Parameter Updaters
  const handleOccupancyChange = (rawVal) => {
    const val = parseInt(rawVal, 10);
    if (isNaN(val)) return;
    if (val < 0) {
      reportError('occupancy', 'Occupancy cannot be negative. Value clamped to 0.');
      updateRoom(activeRoom.id, r => ({ ...r, people: 0 }));
      return;
    }
    if (val > activeRoom.capacity) {
      reportError('occupancy', `Occupancy exceeds configured room design limit (${activeRoom.capacity}). Clamped to design capacity.`);
      updateRoom(activeRoom.id, r => ({ ...r, people: activeRoom.capacity }));
      return;
    }
    updateRoom(activeRoom.id, r => ({ ...r, people: val }));
  };

  const handleBedsChange = (rawVal) => {
    const val = parseInt(rawVal, 10);
    if (isNaN(val)) return;
    if (val < 0) {
      reportError('beds', 'Bed capacity cannot be negative.');
      return;
    }
    const newOccupied = Math.min(activeRoom.occupiedBeds || 0, val);
    updateRoom(activeRoom.id, r => {
      const bedsList = Array.from({ length: val }, (_, i) => ({
        id: `${r.id}-B0${i + 1}`,
        label: `${r.name.includes('ICU') ? 'ICU Bed' : r.name.includes('OT') ? 'Surgical Table' : 'Bed'} ${i + 1}`,
        occupied: i < newOccupied,
        bedsideLight: true,
        bedsideLightPowerKw: 0.04
      }));
      return { ...r, beds: val, occupiedBeds: newOccupied, bedsList };
    });
  };

  const handleOccupiedBedsChange = (rawVal) => {
    const val = parseInt(rawVal, 10);
    if (isNaN(val)) return;
    if (val < 0) {
      reportError('occupiedBeds', 'Occupied beds cannot be negative.');
      return;
    }
    if (val > (activeRoom.beds || 0)) {
      reportError('occupiedBeds', `Occupied beds (${val}) cannot exceed bed capacity (${activeRoom.beds || 0}). Clamped.`);
      const maxVal = activeRoom.beds || 0;
      updateRoom(activeRoom.id, r => ({
        ...r,
        occupiedBeds: maxVal,
        bedsList: r.bedsList?.map((b, i) => ({ ...b, occupied: i < maxVal }))
      }));
      return;
    }
    updateRoom(activeRoom.id, r => ({
      ...r,
      occupiedBeds: val,
      bedsList: r.bedsList?.map((b, i) => ({ ...b, occupied: i < val }))
    }));
  };

  const handleLightKwChange = (rawVal) => {
    const val = parseFloat(rawVal);
    if (isNaN(val)) return;
    if (val < 0) {
      reportError('lightKw', 'Lighting power cannot be negative. Clamped to 0.');
      updateRoom(activeRoom.id, r => ({ ...r, lightKw: 0 }));
      return;
    }
    if (val > 10.0) {
      reportError('lightKw', 'Maximum single-room lighting demand capped at 10.0 kW.');
      updateRoom(activeRoom.id, r => ({ ...r, lightKw: 10.0 }));
      return;
    }
    updateRoom(activeRoom.id, r => ({ ...r, lightKw: val }));
  };

  const handleToggleLight = () => {
    if (activeRoom.safetyCategory === 'Critical') {
      reportError('lightState', 'Safety Protocol: Manual lighting shutdown restricted in Critical Clinical Zones.');
      return;
    }
    updateRoom(activeRoom.id, r => ({ ...r, lightOn: !r.lightOn }));
  };

  const handleHvacModeChange = (mode) => {
    if (activeRoom.safetyCategory === 'Critical' && mode === 'Off') {
      reportError('hvacMode', 'Safety Protocol: Air filtration and positive pressure cannot be turned OFF in Critical Care Zones.');
      return;
    }
    updateRoom(activeRoom.id, r => ({ ...r, hvacMode: mode }));
  };

  const handleHvacKwChange = (rawVal) => {
    const val = parseFloat(rawVal);
    if (isNaN(val)) return;
    if (val < 0) {
      reportError('hvacKw', 'HVAC demand cannot be negative. Clamped to 0.');
      updateRoom(activeRoom.id, r => ({ ...r, hvacKw: 0 }));
      return;
    }
    updateRoom(activeRoom.id, r => ({ ...r, hvacKw: val }));
  };

  const handleWaterLphChange = (rawVal) => {
    const val = parseFloat(rawVal);
    if (isNaN(val)) return;
    if (val < 0) {
      reportError('waterLph', 'Water rate cannot be negative. Clamped to 0.');
      updateRoom(activeRoom.id, r => ({ ...r, waterLph: 0 }));
      return;
    }
    updateRoom(activeRoom.id, r => ({ ...r, waterLph: val }));
  };

  // Filtered rooms for room selector
  const filteredRooms = selectedFloorFilter === 'ALL'
    ? rooms
    : rooms.filter(r => r.floorId === selectedFloorFilter);

  // Active room load calculation
  const roomLightLoad = activeRoom.lightOn ? activeRoom.lightKw : 0;
  const roomHvacFactor = activeRoom.hvacMode === 'Running' ? 1.0 : activeRoom.hvacMode === 'Eco' ? 0.65 : activeRoom.hvacMode === 'Ventilation' ? 0.15 : 0;
  const roomHvacLoad = activeRoom.hvacKw * roomHvacFactor;
  const roomTotalLoad = roomLightLoad + roomHvacLoad;

  return (
    <div className="parameter-system-card">
      <div className="param-header-row">
        <div>
          <div className="eyebrow"><Sliders size={13} /> FACILITY PARAMETER VALIDATION & CONTROL</div>
          <h2>Live Digital Twin Parameter Engine</h2>
          <p>Inspect, validate, and simulate parameters across all 40 monitored zones and whole-hospital sustainability systems.</p>
        </div>

        <div className="param-tab-toggles">
          <button
            className={`param-tab-btn ${activeTab === 'zone' ? 'active' : ''}`}
            onClick={() => setActiveTab('zone')}
          >
            <Users size={14} /> Zone Parameters (40 Rooms)
          </button>
          <button
            className={`param-tab-btn ${activeTab === 'macro' ? 'active' : ''}`}
            onClick={() => setActiveTab('macro')}
          >
            <Gauge size={14} /> Macro Facility Levers
          </button>
          <button
            className={`param-tab-btn ${activeTab === 'methodology' ? 'active' : ''}`}
            onClick={() => setActiveTab('methodology')}
          >
            <Info size={14} /> Assumptions & Formulas
          </button>
        </div>
      </div>

      {/* Global Validation Warning Banner */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="param-validation-alert">
          <AlertTriangle size={18} />
          <div className="alert-content">
            <strong>Validation Rule Triggered:</strong>
            {Object.entries(validationErrors).map(([key, msg]) => (
              <span key={key}>{msg}</span>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: ROOM-LEVEL MONITORED ZONE PARAMETERS */}
      {activeTab === 'zone' && (
        <div className="param-body">
          {/* Room Selector Toolbar */}
          <div className="param-selector-bar">
            <div className="selector-group">
              <label>Filter Level:</label>
              <div className="floor-pills">
                {['ALL', 'GF', 'F1', 'F2', 'F3'].map(fl => (
                  <button
                    key={fl}
                    className={`floor-pill-btn ${selectedFloorFilter === fl ? 'active' : ''}`}
                    onClick={() => setSelectedFloorFilter(fl)}
                  >
                    {fl === 'ALL' ? 'All 40 Zones' : fl}
                  </button>
                ))}
              </div>
            </div>

            <div className="selector-group room-dropdown-group">
              <label>Selected Zone:</label>
              <select
                className="param-room-select"
                value={activeRoom.id}
                onChange={(e) => setSelectedRoomId(e.target.value)}
              >
                {filteredRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    [{r.floorId}] {r.id}: {r.name} ({r.safetyCategory})
                  </option>
                ))}
              </select>
            </div>

            <div className="param-room-badge">
              <span className={`status-pill ${activeRoom.safetyCategory.toLowerCase()}`}>
                {activeRoom.safetyCategory === 'Critical' && <ShieldCheck size={12} />}
                {activeRoom.safetyCategory} Zone
              </span>
              <span className="provenance-tag">
                {activeRoom.isVerified ? 'Blueprint Verified' : 'Provisional Modeled'}
              </span>
            </div>
          </div>

          {/* Parameters Grid */}
          <div className="param-grid">
            {/* Field 1: Occupancy (People) */}
            <div className={`param-field-box ${validationErrors.occupancy ? 'has-error' : ''}`}>
              <div className="field-head">
                <span className="field-label"><Users size={14} /> Room Occupancy</span>
                <span className="field-provenance">Simulated Telemetry</span>
              </div>
              <div className="field-input-row">
                <input
                  type="number"
                  min="0"
                  max={activeRoom.capacity}
                  value={activeRoom.people}
                  onChange={(e) => handleOccupancyChange(e.target.value)}
                  className="param-num-input"
                />
                <span className="field-unit">/ {activeRoom.capacity} Capacity</span>
              </div>
              <input
                type="range"
                min="0"
                max={activeRoom.capacity}
                value={activeRoom.people}
                onChange={(e) => handleOccupancyChange(e.target.value)}
                className="param-slider"
              />
              <div className="field-hint">
                Max design load: {activeRoom.capacity} persons. Zero occupants generates lighting setback.
              </div>
            </div>

            {/* Field 2: Bed Capacity & Occupancy (for applicable zones) */}
            <div className={`param-field-box ${validationErrors.beds || validationErrors.occupiedBeds ? 'has-error' : ''}`}>
              <div className="field-head">
                <span className="field-label">🛏️ Hospital Beds</span>
                <span className="field-provenance">{activeRoom.beds > 0 ? 'Clinical Capacity' : 'No Inpatient Beds'}</span>
              </div>
              {activeRoom.beds > 0 ? (
                <>
                  <div className="field-input-row">
                    <div className="sub-input">
                      <small>Occupied:</small>
                      <input
                        type="number"
                        min="0"
                        max={activeRoom.beds}
                        value={activeRoom.occupiedBeds || 0}
                        onChange={(e) => handleOccupiedBedsChange(e.target.value)}
                        className="param-num-input small"
                      />
                    </div>
                    <div className="sub-input">
                      <small>Total Beds:</small>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={activeRoom.beds}
                        onChange={(e) => handleBedsChange(e.target.value)}
                        className="param-num-input small"
                      />
                    </div>
                  </div>
                  <div className="bed-occupancy-bar">
                    <div
                      className="bed-fill"
                      style={{ width: `${((activeRoom.occupiedBeds || 0) / Math.max(1, activeRoom.beds)) * 100}%` }}
                    />
                  </div>
                  <div className="field-hint">
                    {activeRoom.occupiedBeds || 0} beds active • {activeRoom.beds - (activeRoom.occupiedBeds || 0)} available
                  </div>
                </>
              ) : (
                <div className="non-bed-zone-msg">
                  Non-inpatient service zone. Bed capacity not applicable.
                </div>
              )}
            </div>

            {/* Field 3: Lighting Power & Switch */}
            <div className={`param-field-box ${validationErrors.lightKw || validationErrors.lightState ? 'has-error' : ''}`}>
              <div className="field-head">
                <span className="field-label"><Lightbulb size={14} /> Room Lighting Load</span>
                <span className="field-provenance">Active Fixtures</span>
              </div>
              <div className="field-input-row">
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="10.0"
                  value={activeRoom.lightKw}
                  onChange={(e) => handleLightKwChange(e.target.value)}
                  className="param-num-input"
                />
                <span className="field-unit">kW Base</span>
                <button
                  className={`btn-light-switch ${activeRoom.lightOn ? 'on' : 'off'}`}
                  onClick={handleToggleLight}
                  title={activeRoom.safetyCategory === 'Critical' ? 'Protected Critical Zone' : 'Toggle primary lighting'}
                >
                  {activeRoom.lightOn ? 'LIGHTS ON' : 'LIGHTS OFF'}
                </button>
              </div>
              <div className="field-hint">
                Current draw: <strong>{roomLightLoad.toFixed(2)} kW</strong> • {activeRoom.safetyCategory === 'Critical' ? 'Protected from automated shed' : 'Eligible for setback'}
              </div>
            </div>

            {/* Field 4: HVAC Mode & Demand */}
            <div className={`param-field-box ${validationErrors.hvacMode || validationErrors.hvacKw ? 'has-error' : ''}`}>
              <div className="field-head">
                <span className="field-label"><Wind size={14} /> HVAC Thermal Mode</span>
                <span className="field-provenance">Climate Automation</span>
              </div>
              <div className="field-input-row">
                <select
                  className="param-select"
                  value={activeRoom.hvacMode}
                  onChange={(e) => handleHvacModeChange(e.target.value)}
                >
                  <option value="Running">Running (100% Load)</option>
                  <option value="Eco">Eco Setback (65% Load)</option>
                  <option value="Ventilation">Ventilation Only (15% Load)</option>
                  {activeRoom.safetyCategory !== 'Critical' && <option value="Off">Off (0% Load)</option>}
                </select>
                <div className="sub-input">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="15.0"
                    value={activeRoom.hvacKw}
                    onChange={(e) => handleHvacKwChange(e.target.value)}
                    className="param-num-input small"
                  />
                  <span className="field-unit">kW</span>
                </div>
              </div>
              <div className="field-hint">
                Draw: <strong>{roomHvacLoad.toFixed(2)} kW</strong> (Setpoint: {activeRoom.thermostat?.setpointC || 22}°C)
              </div>
            </div>

            {/* Field 5: Water Consumption Rate */}
            <div className={`param-field-box ${validationErrors.waterLph ? 'has-error' : ''}`}>
              <div className="field-head">
                <span className="field-label"><Droplets size={14} /> Water Flow Rate</span>
                <span className="field-provenance">Hydraulic Submeter</span>
              </div>
              <div className="field-input-row">
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={activeRoom.waterLph}
                  onChange={(e) => handleWaterLphChange(e.target.value)}
                  className="param-num-input"
                />
                <span className="field-unit">L / hour</span>
              </div>
              <div className="field-hint">
                Projected 24h demand: <strong>{fmt(activeRoom.waterLph * 24)} L/day</strong>
              </div>
            </div>

            {/* Field 6: Combined Zone Summary */}
            <div className="param-field-box summary-box">
              <div className="field-head">
                <span className="field-label"><Zap size={14} /> Instantaneous Zone Demand</span>
                <span className="field-provenance">Real-Time Aggregate</span>
              </div>
              <div className="zone-power-metric">
                <strong>{fmt(roomTotalLoad, 2)} <span className="unit">kW</span></strong>
                <small>({roomLightLoad.toFixed(2)} kW Light + {roomHvacLoad.toFixed(2)} kW HVAC)</small>
              </div>
              <div className="zone-impact-chips">
                <span>Cost: ₹{fmt(roomTotalLoad * sustainabilityParams.electricityRate, 1)} / hr</span>
                <span>Carbon: {fmt(roomTotalLoad * sustainabilityParams.gridEmissionFactor, 2)} kg CO₂e/hr</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MACRO FACILITY PARAMETERS */}
      {activeTab === 'macro' && (
        <div className="param-body">
          <div className="param-grid macro-grid">
            {/* Macro 1: Potable Water Supply Tariff */}
            <div className="param-field-box">
              <div className="field-head">
                <span className="field-label"><Droplets size={14} /> Potable Water Supply Tariff</span>
                <span className="field-provenance">Municipal Utility Baseline</span>
              </div>
              <div className="field-input-row">
                <input
                  type="number"
                  min="5"
                  max="150"
                  step="5"
                  value={sustainabilityParams.waterTariffPerKL || 45}
                  onChange={(e) => updateSustainabilityParam('waterTariffPerKL', Math.max(1, parseFloat(e.target.value) || 45))}
                  className="param-num-input"
                />
                <span className="field-unit">₹ (INR) / kL</span>
              </div>
              <div className="field-hint">
                Standard institutional rate for piped municipal potable supply and filtration
              </div>
            </div>

            {/* Macro 2: Grid Electricity Emission Factor */}
            <div className="param-field-box">
              <div className="field-head">
                <span className="field-label"><CloudSun size={14} /> Grid Emission Factor</span>
                <span className="field-provenance">CEA National Benchmark</span>
              </div>
              <div className="field-input-row">
                <input
                  type="number"
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  value={sustainabilityParams.gridEmissionFactor}
                  onChange={(e) => updateSustainabilityParam('gridEmissionFactor', Math.max(0.01, parseFloat(e.target.value) || 0.70))}
                  className="param-num-input"
                />
                <span className="field-unit">kg CO₂e / kWh</span>
              </div>
              <div className="field-hint">
                India Southern Regional Grid default: 0.70 kg CO₂e per delivered kWh
              </div>
            </div>

            {/* Macro 3: Commercial Electricity Tariff */}
            <div className="param-field-box">
              <div className="field-head">
                <span className="field-label"><Gauge size={14} /> Commercial Electricity Tariff</span>
                <span className="field-provenance">Institutional Utility Rate</span>
              </div>
              <div className="field-input-row">
                <input
                  type="number"
                  min="1.0"
                  max="30.0"
                  step="0.25"
                  value={sustainabilityParams.electricityRate}
                  onChange={(e) => updateSustainabilityParam('electricityRate', Math.max(0.5, parseFloat(e.target.value) || 8.5))}
                  className="param-num-input"
                />
                <span className="field-unit">₹ (INR) / kWh</span>
              </div>
              <div className="field-hint">
                Healthcare commercial baseline: ₹8.50 per grid unit
              </div>
            </div>

            {/* Macro 4: Hospital Paper Consumption */}
            <div className="param-field-box">
              <div className="field-head">
                <span className="field-label"><FileText size={14} /> Paper Consumption</span>
                <span className="field-provenance">Records & Prescriptions</span>
              </div>
              <div className="field-input-row">
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="50"
                  value={sustainabilityParams.paperSheetsPerDay}
                  onChange={(e) => updateSustainabilityParam('paperSheetsPerDay', Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="param-num-input"
                />
                <span className="field-unit">sheets / day</span>
              </div>
              <div className="field-hint">
                Digital health records (EMR) target 70% reduction (~360 sheets/day)
              </div>
            </div>

            {/* Macro 5: Biomedical Waste Tracking */}
            <div className="param-field-box">
              <div className="field-head">
                <span className="field-label"><Recycle size={14} /> Biomedical Waste Generation</span>
                <span className="field-provenance">Color-Coded Segregation</span>
              </div>
              <div className="field-input-row">
                <input
                  type="number"
                  min="0"
                  max="300"
                  step="1"
                  value={sustainabilityParams.biomedicalWasteKgPerDay}
                  onChange={(e) => updateSustainabilityParam('biomedicalWasteKgPerDay', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="param-num-input"
                />
                <span className="field-unit">kg / day</span>
              </div>
              <div className="field-hint">
                Segregated yellow (infectious), red (plastics), blue (glass), and white (sharps)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSPARENT ASSUMPTIONS & FORMULAS */}
      {activeTab === 'methodology' && (
        <div className="param-body methodology-body">
          <div className="methodology-card">
            <h3>Mathematical Principles & Transparent Calculations</h3>
            <p>
              In accordance with academic digital-twin integrity, CDsimerEcoTwin uses explicit, deterministic formulas
              rather than opaque estimations. All equations handle zero baselines safely without division errors.
            </p>

            <div className="formula-item">
              <div className="formula-title">1. Total Instantaneous Facility Power (kW)</div>
              <code>Total Power (kW) = ∑ [ (Light kW × Light State) + (HVAC kW × Mode Factor) + Equipment Baseline (kW) ]</code>
              <small>Where Light State = 1 (ON) or 0 (OFF); Mode Factor = Running (1.0), Eco (0.65), Idle (0.12).</small>
            </div>

            <div className="formula-item">
              <div className="formula-title">2. Daily Commercial Electricity Consumption (kWh)</div>
              <code>Daily Consumption (kWh) = Total Facility Power (kW) × 24 hr Projected Duty Cycle</code>
              <small>Calculated directly across all 40 monitored hospital zones without arbitrary scaling.</small>
            </div>

            <div className="formula-item">
              <div className="formula-title">3. Instantaneous Carbon Emission Rate (kg CO₂e / hr)</div>
              <code>Emissions Rate = Total Grid Power (kW) × Grid Emission Factor (0.70 kg CO₂e / kWh)</code>
              <small>Accounts for regional Southern Regional Grid / CEA baseline emission factors.</small>
            </div>

            <div className="formula-item">
              <div className="formula-title">4. Real-Time Operating Cost Rate (₹ / hr)</div>
              <code>Hourly Cost = Net Grid Draw (kW) × Electricity Tariff (₹8.50 / kWh)</code>
              <small>Excludes fixed meter demand charges; reflects variable energy consumption cost.</small>
            </div>

            <div className="formula-item">
              <div className="formula-title">5. Total Daily Hydraulic Consumption (L / day)</div>
              <code>Daily Water (L) = ∑ [ Room Water Flow Rate (L/hr) ] × 24 hours</code>
              <small>Low-flow plumbing intervention lever models a verified 25% potable water reduction.</small>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="param-footer-row">
        <div className="footer-status-text">
          <CheckCircle2 size={15} color="#059669" />
          <span>Calculations live • Propagation active across 3D twin, room inspector, and audit matrix</span>
        </div>

        <div className="param-action-buttons">
          <button
            className="btn-param-action secondary"
            onClick={onResetBaseline}
            title="Revert all 40 rooms and macro assumptions to default calibrated state"
          >
            <RotateCcw size={14} /> Restore Default Baseline
          </button>
          <button
            className="btn-param-action primary"
            onClick={onApplyGreenSetpoints}
            title="Automatically dim empty non-clinical zones and optimize HVAC to Eco"
          >
            <Sparkles size={14} /> Apply Optimal Green Setpoints
          </button>
        </div>
      </div>
    </div>
  );
}
