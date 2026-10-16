import React, { useState, useMemo } from 'react';
import {
  Sun, Zap, ArrowRight, ShieldCheck, CheckCircle2,
  TrendingUp, BarChart3, AlertCircle, Info, Leaf,
  RotateCcw, Sliders, BatteryCharging, ChevronRight, Activity, Building2
} from 'lucide-react';

const fmt = (n, digits = 1) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export default function SolarPowerDashboard({
  rooms = [],
  sustainabilityParams = {},
  updateSustainabilityParam = () => {},
  onNavigateToTwin = () => {}
}) {
  const [simulatedHour, setSimulatedHour] = useState(13); // Default 1:00 PM (peak sun)
  const [pvCapacitySetting, setPvCapacitySetting] = useState(25.0); // 25 kWp proposed array
  const [inverterEfficiency, setInverterEfficiency] = useState(0.96); // 96% string inverter efficiency

  const electricityTariff = sustainabilityParams.electricityTariff ?? 8.50; // INR / kWh
  const gridEmissionFactor = sustainabilityParams.gridEmissionFactor ?? 0.70; // kg CO2 / kWh

  // Live Hospital Electrical Demand (sum of all 40 rooms)
  const buildingDemandKw = useMemo(() => {
    return rooms.reduce((acc, r) => {
      const lightKw = r.lightOn ? (r.lightKw || 0.6) : 0;
      const bedsideKw = (r.bedsList || []).reduce((sum, b) => sum + (b.bedsideLight !== false ? (b.bedsideLightPowerKw || 0.04) : 0), 0);
      const hvacKw = r.hvacMode === 'Running' ? (r.hvacKw || 1.8) : r.hvacMode === 'Eco' ? (r.hvacKw || 1.8) * 0.65 : (r.hvacKw || 1.8) * 0.12;
      const equipKw = r.critical ? 1.5 : 0.4;
      return acc + lightKw + bedsideKw + hvacKw + equipKw;
    }, 0);
  }, [rooms]);

  // Diurnal solar curve calculation based on hour of day (0 to 23)
  const getSolarPowerAtHour = (hour, capacity) => {
    if (hour < 6 || hour > 18) return 0;
    // Normalized solar bell curve peaking at 12:30 - 13:00
    const solarFactor = Math.sin(((hour - 6) / 12) * Math.PI);
    const cloudWeatherFactor = 0.88; // clear sky with light atmospheric haze
    return capacity * Math.pow(solarFactor, 1.4) * cloudWeatherFactor * inverterEfficiency;
  };

  // Instantaneous Solar Generation at currently selected hour (kW)
  const currentSolarKw = useMemo(() => {
    return Math.max(0, getSolarPowerAtHour(simulatedHour, pvCapacitySetting));
  }, [simulatedHour, pvCapacitySetting, inverterEfficiency]);

  // Solar consumed on site (hospital load always exceeds 25 kWp solar array output)
  const solarConsumedOnSiteKw = Math.min(currentSolarKw, buildingDemandKw);
  
  // Remaining demand supplied by the utility electrical grid (kW)
  const gridImportKw = Math.max(0, buildingDemandKw - solarConsumedOnSiteKw);

  // Solar contribution percentage
  const solarContributionPct = buildingDemandKw > 0 
    ? ((solarConsumedOnSiteKw / buildingDemandKw) * 100).toFixed(1)
    : '0.0';

  // Estimated daily energy generation (kWh) by integrating 24h curve
  const dailySolarKwh = useMemo(() => {
    let sum = 0;
    for (let h = 0; h < 24; h++) {
      sum += getSolarPowerAtHour(h, pvCapacitySetting);
    }
    return sum;
  }, [pvCapacitySetting, inverterEfficiency]);

  // Daily gross building energy demand (kWh)
  const dailyBuildingKwh = buildingDemandKw * 24;

  // Avoided carbon emissions (kg CO2e per day)
  const dailyAvoidedCo2Kg = dailySolarKwh * gridEmissionFactor;

  // Daily financial savings (INR per day)
  const dailySavingsInr = dailySolarKwh * electricityTariff;
  const monthlySavingsInr = dailySavingsInr * 30;

  // 24-Hour Generation vs Demand Profile Data
  const hourlyProfile = useMemo(() => {
    const hours = [];
    for (let h = 0; h < 24; h++) {
      const solar = getSolarPowerAtHour(h, pvCapacitySetting);
      // Small diurnal load variation for hospital (higher during OPD hours 8am-5pm)
      const opdFactor = (h >= 8 && h <= 17) ? 1.12 : (h >= 22 || h <= 5) ? 0.88 : 1.0;
      const demand = buildingDemandKw * opdFactor;
      const grid = Math.max(0, demand - solar);
      hours.push({
        hour: `${String(h).padStart(2, '0')}:00`,
        hourNum: h,
        solarKw: Number(solar.toFixed(1)),
        demandKw: Number(demand.toFixed(1)),
        gridKw: Number(grid.toFixed(1)),
      });
    }
    return hours;
  }, [pvCapacitySetting, buildingDemandKw, inverterEfficiency]);

  const maxProfileKw = Math.max(...hourlyProfile.map(p => p.demandKw), 10);

  return (
    <div className="page-stack solar-power-dashboard">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="eyebrow">RENEWABLE GENERATION · PROPOSED CAMPUS PV ARRAY</div>
          <h1>Rooftop Solar & Power Generation</h1>
          <p>
            Rooftop solar photovoltaic generation, on-site clean power utilization, and live grid import shortfall for CDsimerEcoTwin.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            className="outline-button"
            onClick={onNavigateToTwin}
            title="Inspect 3D rooftop solar array on digital twin"
          >
            <Building2 size={15} />
            <span>View 3D Rooftop Array</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon gold"><Sun size={18} /></div>
          <div className="stat-copy">
            <div className="stat-label">Current Solar Generation</div>
            <div className="stat-number">{fmt(currentSolarKw, 1)} <span>kW</span></div>
            <div className="stat-detail">Instantaneous AC output at {simulatedHour}:00</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber"><Zap size={18} /></div>
          <div className="stat-copy">
            <div className="stat-label">Building Electrical Demand</div>
            <div className="stat-number">{fmt(buildingDemandKw, 1)} <span>kW</span></div>
            <div className="stat-detail">Live sum across all 40 monitored hospital zones</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon dark"><Activity size={18} /></div>
          <div className="stat-copy">
            <div className="stat-label">Remaining Grid Import</div>
            <div className="stat-number">{fmt(gridImportKw, 1)} <span>kW</span></div>
            <div className="stat-detail">Net utility shortfall imported from BESCOM</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon mint"><TrendingUp size={18} /></div>
          <div className="stat-copy">
            <div className="stat-label">Instantaneous Solar Share</div>
            <div className="stat-number">{solarContributionPct} <span>%</span></div>
            <div className="stat-detail">100% of solar consumed on-site</div>
          </div>
        </div>
      </div>

      {/* Cumulative Energy & Financial Impact Row */}
      <div className="stats-grid" style={{ marginTop: '-8px' }}>
        <div className="stat-card">
          <div className="stat-icon mint"><Leaf size={18} /></div>
          <div className="stat-copy">
            <div className="stat-label">Est. Daily Energy Generated</div>
            <div className="stat-number">{fmt(dailySolarKwh, 0)} <span>kWh/day</span></div>
            <div className="stat-detail">Accumulated clean energy over 24-hour cycle</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon gold"><ShieldCheck size={18} /></div>
          <div className="stat-copy">
            <div className="stat-label">Avoided CO₂ Emissions</div>
            <div className="stat-number">{fmt(dailyAvoidedCo2Kg, 1)} <span>kg/day</span></div>
            <div className="stat-detail">Displacing Karnataka CEA grid factor (0.70 kg/kWh)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon mint"><TrendingUp size={18} /></div>
          <div className="stat-copy">
            <div className="stat-label">Daily Tariff Offset</div>
            <div className="stat-number">₹{fmt(dailySavingsInr, 0)}</div>
            <div className="stat-detail">Calculated at commercial rate ₹{electricityTariff.toFixed(2)}/kWh</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon dark"><BarChart3 size={18} /></div>
          <div className="stat-copy">
            <div className="stat-label">Est. Monthly Savings</div>
            <div className="stat-number">₹{fmt(monthlySavingsInr, 0)}</div>
            <div className="stat-detail">~{fmt(dailySolarKwh * 30, 0)} kWh monthly offset</div>
          </div>
        </div>
      </div>

      {/* Interactive Power-Flow Visualization */}
      <section className="dashboard-section power-flow-container">
        <div className="section-head">
          <div>
            <h3>Interactive Power-Flow Architecture</h3>
            <p className="section-subtitle">
              Instantaneous power flow: Sunlight → Rooftop PV Array → Central Inverter → Hospital Distribution → Remaining Grid Import
            </p>
          </div>
          <div className="power-flow-time-control">
            <span className="time-label">Simulation Time: <strong>{String(simulatedHour).padStart(2, '0')}:00</strong></span>
            <input
              type="range"
              min="0"
              max="23"
              step="1"
              value={simulatedHour}
              onChange={(e) => setSimulatedHour(Number(e.target.value))}
              aria-label="Simulation Time Slider"
              className="time-slider"
            />
          </div>
        </div>

        <div className="power-flow-diagram">
          {/* Node 1: Sunlight */}
          <div className="power-node sun-node">
            <div className="node-icon sun"><Sun size={24} /></div>
            <div className="node-title">Sunlight & Irradiance</div>
            <div className="node-val">
              {simulatedHour >= 6 && simulatedHour <= 18 ? `${Math.round(850 * Math.sin(((simulatedHour - 6) / 12) * Math.PI))} W/m²` : '0 W/m² (Night)'}
            </div>
            <div className="node-sub">Incident GHI on Roof</div>
          </div>

          <div className={`flow-connector ${currentSolarKw > 0 ? 'active' : 'idle'}`}>
            <div className="flow-line" />
            <ArrowRight size={16} className="flow-arrow" />
            <span className="flow-badge">{fmt(currentSolarKw / (inverterEfficiency || 0.96), 1)} kW DC</span>
          </div>

          {/* Node 2: PV Array */}
          <div className="power-node pv-node">
            <div className="node-icon pv"><Building2 size={24} /></div>
            <div className="node-title">Rooftop PV Array</div>
            <div className="node-val">{pvCapacitySetting.toFixed(1)} kWp</div>
            <div className="node-sub">24 Monocrystalline Panels</div>
          </div>

          <div className={`flow-connector ${currentSolarKw > 0 ? 'active' : 'idle'}`}>
            <div className="flow-line" />
            <ArrowRight size={16} className="flow-arrow" />
            <span className="flow-badge">96% Eff</span>
          </div>

          {/* Node 3: Inverter */}
          <div className="power-node inverter-node">
            <div className="node-icon inverter"><Zap size={24} /></div>
            <div className="node-title">Central Inverter</div>
            <div className="node-val">{fmt(currentSolarKw, 1)} kW AC</div>
            <div className="node-sub">Pure Sine Wave 415V 3Ø</div>
          </div>

          <div className={`flow-connector ${currentSolarKw > 0 ? 'active' : 'idle'}`}>
            <div className="flow-line" />
            <ArrowRight size={16} className="flow-arrow" />
            <span className="flow-badge">{fmt(currentSolarKw, 1)} kW AC</span>
          </div>

          {/* Node 4: Main Distribution Busbar */}
          <div className="power-node busbar-node">
            <div className="node-icon busbar"><Activity size={24} /></div>
            <div className="node-title">Hospital Main Panel</div>
            <div className="node-val">{fmt(buildingDemandKw, 1)} kW</div>
            <div className="node-sub">Net Connected Demand</div>
          </div>

          <div className="flow-connector active">
            <div className="flow-line" />
            <ArrowRight size={16} className="flow-arrow" />
            <span className="flow-badge">100% Used</span>
          </div>

          {/* Node 5: 40 Monitored Zones Load */}
          <div className="power-node loads-node">
            <div className="node-icon loads"><Building2 size={24} /></div>
            <div className="node-title">40 Monitored Zones</div>
            <div className="node-val">{rooms.length} Clinical Zones</div>
            <div className="node-sub">Lighting, HVAC & Critical Loads</div>
          </div>
        </div>

        {/* Shortfall & Grid Import Callout */}
        <div className="grid-shortfall-callout">
          <div className="shortfall-item">
            <span className="shortfall-label">Instantaneous Solar Generation:</span>
            <strong className="text-gold">{fmt(currentSolarKw, 1)} kW</strong>
          </div>
          <span className="shortfall-plus">+</span>
          <div className="shortfall-item">
            <span className="shortfall-label">BESCOM Grid Shortfall Import:</span>
            <strong className="text-amber">{fmt(gridImportKw, 1)} kW</strong>
          </div>
          <span className="shortfall-equals">=</span>
          <div className="shortfall-item">
            <span className="shortfall-label">Total Hospital Demand:</span>
            <strong className="text-navy">{fmt(buildingDemandKw, 1)} kW</strong>
          </div>
        </div>
      </section>

      {/* 24-Hour Diurnal Solar Generation vs Hospital Demand Chart */}
      <section className="dashboard-section">
        <div className="section-head">
          <div>
            <h3>24-Hour Diurnal Solar Generation vs Hospital Demand Profile</h3>
            <p className="section-subtitle">
              Simulated 24-hour diurnal curve showing clean solar generation peaking during daylight hours and remaining demand supplied by utility grid.
            </p>
          </div>
          <div className="chart-legend-row">
            <span className="legend-chip"><span className="legend-swatch-solar" /> Solar Generation (kW)</span>
            <span className="legend-chip"><span className="legend-swatch-grid" /> Grid Import (kW)</span>
            <span className="legend-chip"><span className="legend-swatch-demand" /> Total Demand (kW)</span>
          </div>
        </div>

        <div className="solar-chart-container">
          <div className="solar-bars-grid">
            {hourlyProfile.map((point) => {
              const solarHeightPct = (point.solarKw / maxProfileKw) * 100;
              const gridHeightPct = (point.gridKw / maxProfileKw) * 100;
              const isSelected = point.hourNum === simulatedHour;

              return (
                <div 
                  key={point.hour} 
                  className={`solar-bar-col ${isSelected ? 'selected-hour' : ''}`}
                  onClick={() => setSimulatedHour(point.hourNum)}
                  title={`${point.hour}: Demand ${point.demandKw} kW | Solar ${point.solarKw} kW | Grid ${point.gridKw} kW`}
                >
                  <div className="solar-stacked-bar">
                    <div 
                      className="bar-segment grid" 
                      style={{ height: `${gridHeightPct}%` }}
                    />
                    <div 
                      className="bar-segment solar" 
                      style={{ height: `${solarHeightPct}%` }}
                    />
                  </div>
                  <span className="bar-label">{point.hour.slice(0, 2)}</span>
                </div>
              );
            })}
          </div>

          <div className="chart-y-axis">
            <span>{Math.round(maxProfileKw)} kW</span>
            <span>{Math.round(maxProfileKw * 0.75)} kW</span>
            <span>{Math.round(maxProfileKw * 0.5)} kW</span>
            <span>{Math.round(maxProfileKw * 0.25)} kW</span>
            <span>0 kW</span>
          </div>
        </div>
      </section>

      {/* Technical Specifications & Assumptions */}
      <div className="dashboard-two-col">
        <div className="dashboard-card">
          <div className="card-header">
            <h4><Sun size={16} /> Rooftop Photovoltaic Array Specifications</h4>
          </div>
          <table className="tech-specs-table">
            <tbody>
              <tr>
                <td>System Capacity</td>
                <td><strong>25.0 kWp (Proposed Array)</strong></td>
              </tr>
              <tr>
                <td>Module Type</td>
                <td>Commercial Monocrystalline Tier-1 PV</td>
              </tr>
              <tr>
                <td>Module Quantity</td>
                <td>24 Panels (12 East Terrace, 12 West Terrace)</td>
              </tr>
              <tr>
                <td>Tilt & Orientation</td>
                <td>12° Fixed Tilt facing True South (180° Azimuth)</td>
              </tr>
              <tr>
                <td>Inverter Rating</td>
                <td>25 kW Central 3-Phase Grid-Tied Inverter (96% eff)</td>
              </tr>
              <tr>
                <td>On-Site Self Consumption</td>
                <td><strong>100% (Zero export, all solar offsets hospital load)</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h4><Info size={16} /> Digital Twin Simulation Assumptions</h4>
          </div>
          <div className="card-body-text">
            <p>
              <strong>Distinction of Units:</strong> Instantaneous power is reported in <em>kilowatts (kW)</em>, representing dynamic load and generation. Cumulative energy output and consumption are tracked in <em>kilowatt-hours (kWh)</em>.
            </p>
            <p>
              <strong>Campus Grounding:</strong> The rooftop array is modeled as a proposed sustainability intervention on the CDSIMER campus digital twin. In accordance with clinical guidelines, EV charging features are excluded from this facility model.
            </p>
            <div className="notice gold" style={{ marginTop: '12px' }}>
              <CheckCircle2 size={15} />
              <span>
                Solar telemetry is synchronized with the 40 hospital monitored zones. Reducing room lighting or HVAC loads immediately decreases building electrical demand and increases the effective solar contribution percentage.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
