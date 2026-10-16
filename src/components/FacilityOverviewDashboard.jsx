import React, { useState, useMemo } from 'react';
import {
  Building2, Users, Zap, Droplets, Sun, AlertTriangle, AlertOctagon,
  ChevronRight, ArrowRight, ShieldCheck, Activity, BedDouble, Lightbulb,
  Wind, Clock, Layers, PanelsTopLeft, ArrowUpRight, BarChart3, PieChart,
  TrendingUp, Sliders, Info, CheckCircle2, RotateCcw
} from 'lucide-react';
import { calculateRoomPower } from '../data/hospitalArchitectureData.js';

const fmt = (n, digits = 1) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

// 8 Canonical CDSIMER Department Definitions
export const HOSPITAL_DEPARTMENTS = [
  {
    id: 'icu',
    name: 'ICU & Critical Care',
    category: 'Critical Care',
    roomIds: ['F3-Z01', 'F3-Z04', 'F3-Z05', 'F2-Z09'],
    color: '#b45309', // Deep ochre/gold
    icon: ShieldCheck,
  },
  {
    id: 'ot',
    name: 'Operating Theatres & Surgical Suites',
    category: 'Surgical Operations',
    roomIds: ['F3-Z02', 'F3-Z03', 'F3-Z06', 'F3-Z07', 'F3-Z08', 'F3-Z09', 'F3-Z10'],
    color: '#8c5e32', // Rich bronze
    icon: Activity,
  },
  {
    id: 'radiology',
    name: 'Radiology & Diagnostic Imaging',
    category: 'Diagnostics',
    roomIds: ['GF-Z04', 'GF-Z05', 'F1-Z04'],
    color: '#c5a04f', // Antique gold
    icon: Zap,
  },
  {
    id: 'wards',
    name: 'Patient Inpatient Wards',
    category: 'Inpatient Care',
    roomIds: ['F2-Z01', 'F2-Z02', 'F2-Z03', 'F2-Z04', 'F2-Z05', 'F2-Z06', 'F2-Z07', 'F2-Z10'],
    color: '#684832', // Warm chocolate brown
    icon: BedDouble,
  },
  {
    id: 'opd',
    name: 'OPD & Specialty Consultation',
    category: 'Outpatient Care',
    roomIds: ['GF-Z06', 'GF-Z07', 'F1-Z02', 'F1-Z03', 'F1-Z06', 'F1-Z07', 'F1-Z10'],
    color: '#9c7a4b', // Amber-ochre
    icon: Users,
  },
  {
    id: 'emergency',
    name: 'Emergency Services & Triage',
    category: 'Emergency Care',
    roomIds: ['GF-Z02', 'GF-Z03'],
    color: '#c2410c', // Muted terracotta
    icon: AlertTriangle,
  },
  {
    id: 'reception',
    name: 'Reception & Waiting Areas',
    category: 'Public & Admin',
    roomIds: ['GF-Z01', 'GF-Z09', 'F1-Z08', 'F1-Z09'],
    color: '#a38a72', // Warm taupe
    icon: Building2,
  },
  {
    id: 'laboratory',
    name: 'Laboratory & Support Facilities',
    category: 'Clinical Support',
    roomIds: ['GF-Z08', 'GF-Z10', 'F1-Z01', 'F1-Z05', 'F2-Z08'],
    color: '#523e32', // Deep brown
    icon: Layers,
  },
];

export default function FacilityOverviewDashboard({
  rooms = [],
  totals = {},
  alerts = [],
  setPage = () => {},
  onSelectDepartment = () => {},
  onInspectInTwin = () => {},
  currentSolarKw = 112.4,
  liveWeather = { cloudCover: 35 },
}) {
  const [energySortOrder, setEnergySortOrder] = useState('highest'); // 'highest' | 'lowest' | 'name'
  const [trendPeriod, setTrendPeriod] = useState('hourly'); // 'hourly' | 'daily' | 'weekly'
  const [trendMetric, setTrendMetric] = useState('demand'); // 'demand' (kW) | 'energy' (kWh)
  const [activeTooltip, setActiveTooltip] = useState(null);

  // 1. Department Calculations strictly from all 40 rooms
  const departmentData = useMemo(() => {
    return HOSPITAL_DEPARTMENTS.map(dept => {
      const deptRooms = rooms.filter(r => dept.roomIds.includes(r.id));
      let powerKw = 0;
      let lightingKw = 0;
      let hvacKw = 0;
      let equipmentKw = 0;
      let people = 0;
      let capacity = 0;
      let beds = 0;
      let occupiedBeds = 0;
      let waterLph = 0;

      deptRooms.forEach(r => {
        const p = calculateRoomPower(r);
        powerKw += p.totalKw;
        lightingKw += p.totalLightingKw;
        hvacKw += p.hvacKw;
        equipmentKw += p.equipmentKw;
        people += (r.people || 0);
        capacity += (r.capacity || 0);
        beds += (r.beds || 0);
        const occBeds = r.bedsList
          ? r.bedsList.filter(b => b.occupied).length
          : Math.min(r.beds || 0, r.occupiedBeds || 0);
        occupiedBeds += occBeds;
        waterLph += (r.waterLph || 0);
      });

      const occupancyRate = capacity > 0 ? (people / capacity) * 100 : 0;
      const bedOccupancyRate = beds > 0 ? (occupiedBeds / beds) * 100 : null;

      return {
        ...dept,
        roomCount: deptRooms.length,
        rooms: deptRooms,
        powerKw,
        lightingKw,
        hvacKw,
        equipmentKw,
        people,
        capacity,
        occupancyRate,
        beds,
        occupiedBeds,
        bedOccupancyRate,
        waterLph,
      };
    });
  }, [rooms]);

  // Total Building Demand (sum of departments)
  const totalDemandKw = useMemo(() => {
    return departmentData.reduce((acc, d) => acc + d.powerKw, 0);
  }, [departmentData]);

  // Sort department energy
  const sortedDepartmentsByEnergy = useMemo(() => {
    const list = [...departmentData];
    if (energySortOrder === 'highest') {
      return list.sort((a, b) => b.powerKw - a.powerKw);
    } else if (energySortOrder === 'lowest') {
      return list.sort((a, b) => a.powerKw - b.powerKw);
    } else {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [departmentData, energySortOrder]);

  // Max department power for horizontal bar scale
  const maxDeptPower = useMemo(() => {
    return Math.max(...departmentData.map(d => d.powerKw), 1);
  }, [departmentData]);

  // Energy Load Categories for Donut Chart
  const energyBreakdown = useMemo(() => {
    const lighting = departmentData.reduce((acc, d) => acc + d.lightingKw, 0);
    const hvac = departmentData.reduce((acc, d) => acc + d.hvacKw, 0);
    const equipment = departmentData.reduce((acc, d) => acc + d.equipmentKw, 0);
    const total = lighting + hvac + equipment;

    return [
      {
        id: 'equipment',
        label: 'Medical & Diagnostic Equipment',
        kw: equipment,
        pct: total > 0 ? (equipment / total) * 100 : 0,
        color: '#8c5e32',
      },
      {
        id: 'hvac',
        label: 'HVAC & Thermal Conditioning',
        kw: hvac,
        pct: total > 0 ? (hvac / total) * 100 : 0,
        color: '#b45309',
      },
      {
        id: 'lighting',
        label: 'Interior & Task Lighting',
        kw: lighting,
        pct: total > 0 ? (lighting / total) * 100 : 0,
        color: '#c5a04f',
      },
    ];
  }, [departmentData]);

  // Simulated Demonstration Time Series Data for Resource Consumption Trends
  const trendSeries = useMemo(() => {
    if (trendPeriod === 'hourly') {
      // 24 hours today
      const hours = [
        '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
        '12:00', '14:00', '16:00', '18:00', '20:00', '22:00',
      ];
      // Multipliers representing nocturnal low, morning clinic ramp, afternoon peak, evening dip
      const demandMultipliers = [0.55, 0.52, 0.50, 0.68, 0.95, 1.08, 1.15, 1.12, 1.05, 0.98, 0.82, 0.65];
      return hours.map((t, i) => {
        const valKw = totalDemandKw * demandMultipliers[i];
        const valKwh = valKw * 2; // 2 hour duration step
        return {
          label: t,
          demandKw: Number(valKw.toFixed(1)),
          energyKwh: Number(valKwh.toFixed(1)),
        };
      });
    } else if (trendPeriod === 'daily') {
      // 7 days of current week
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dailyMultipliers = [1.02, 1.05, 1.04, 1.01, 0.98, 0.82, 0.76];
      return days.map((d, i) => {
        const avgKw = totalDemandKw * dailyMultipliers[i];
        const dayKwh = avgKw * 24;
        return {
          label: d,
          demandKw: Number(avgKw.toFixed(1)),
          energyKwh: Number(dayKwh.toFixed(0)),
        };
      });
    } else {
      // 4 weeks of current month
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const weekMultipliers = [0.98, 1.02, 1.04, 0.99];
      return weeks.map((w, i) => {
        const avgKw = totalDemandKw * weekMultipliers[i];
        const weekKwh = avgKw * 24 * 7;
        return {
          label: w,
          demandKw: Number(avgKw.toFixed(1)),
          energyKwh: Number(weekKwh.toFixed(0)),
        };
      });
    }
  }, [trendPeriod, totalDemandKw]);

  const maxTrendVal = useMemo(() => {
    if (trendMetric === 'demand') {
      return Math.max(...trendSeries.map(s => s.demandKw), 1);
    }
    return Math.max(...trendSeries.map(s => s.energyKwh), 1);
  }, [trendSeries, trendMetric]);

  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="page-stack facility-overview-root">
      {/* 1. Header Banner */}
      <div className="facility-dashboard-header">
        <div className="fdh-left">
          <div className="fdh-eyebrow">
            <span className="fdh-tag">FACILITY INTELLIGENCE DASHBOARD</span>
            <span className="fdh-source">CDSIMER 4-STOREY CAMPUS BLOCK · 40 MONITORED ZONES</span>
          </div>
          <h1>Hospital Facility Operations & Visual Analytics</h1>
          <p>
            Real-time visual monitoring of instantaneous electrical demand, departmental occupancy distributions,
            clean solar contribution, and environmental indicators across all four architectural levels.
          </p>
        </div>
        <div className="fdh-actions">
          <button
            className="fdh-quick-link twin"
            onClick={() => setPage('twin')}
            title="Launch interactive 3D digital twin"
          >
            <PanelsTopLeft size={16} />
            <span>Open 3D Twin</span>
          </button>
          <button
            className="fdh-quick-link zones"
            onClick={() => setPage('zones')}
            title="Inspect 40 monitored zones"
          >
            <Layers size={16} />
            <span>Room & Zone Operations</span>
          </button>
        </div>
      </div>

      {/* 2. Top Compact KPI Quintet */}
      <div className="facility-kpi-grid">
        {/* KPI 1: Building Power Demand */}
        <div className="fkpi-card">
          <div className="fkpi-head">
            <span className="fkpi-title">Building Power Demand</span>
            <div className="fkpi-icon amber"><Zap size={18} /></div>
          </div>
          <div className="fkpi-val-row">
            <span className="fkpi-num">{fmt(totals.power || totalDemandKw)}</span>
            <span className="fkpi-unit">kW</span>
          </div>
          <div className="fkpi-detail">
            <span>{fmt(totals.lightingKw)} kW light · {fmt(totals.hvacKw)} kW HVAC</span>
          </div>
          <div className="fkpi-foot">
            <span className="fkpi-badge live">Instantaneous Power</span>
          </div>
        </div>

        {/* KPI 2: Campus Occupancy */}
        <div className="fkpi-card">
          <div className="fkpi-head">
            <span className="fkpi-title">Campus Occupancy</span>
            <div className="fkpi-icon blue"><Users size={18} /></div>
          </div>
          <div className="fkpi-val-row">
            <span className="fkpi-num">{totals.people || 0}</span>
            <span className="fkpi-unit">people</span>
          </div>
          <div className="fkpi-detail">
            <span>{totals.occupiedBeds || 0} of {totals.beds || 38} beds occupied ({totals.beds > 0 ? ((totals.occupiedBeds / totals.beds) * 100).toFixed(0) : 0}%)</span>
          </div>
          <div className="fkpi-foot">
            <span className="fkpi-badge info">{totals.capacity > 0 ? `${((totals.people / totals.capacity) * 100).toFixed(0)}% Capacity` : 'Active'}</span>
          </div>
        </div>

        {/* KPI 3: Active Alerts */}
        <div className="fkpi-card" onClick={() => setPage('alerts')} style={{ cursor: 'pointer' }} title="View all system alerts">
          <div className="fkpi-head">
            <span className="fkpi-title">Active System Alerts</span>
            <div className={`fkpi-icon ${activeAlertsCount > 0 ? 'red' : 'green'}`}>
              {activeAlertsCount > 0 ? <AlertOctagon size={18} /> : <CheckCircle2 size={18} />}
            </div>
          </div>
          <div className="fkpi-val-row">
            <span className="fkpi-num">{activeAlertsCount}</span>
            <span className="fkpi-unit">{activeAlertsCount === 1 ? 'alert' : 'alerts'}</span>
          </div>
          <div className="fkpi-detail">
            <span>{activeAlertsCount > 0 ? alerts.find(a => a.status === 'active')?.title || 'Attention needed' : 'All 40 zones nominal'}</span>
          </div>
          <div className="fkpi-foot">
            <span className={`fkpi-badge ${activeAlertsCount > 0 ? 'alert' : 'ok'}`}>
              {activeAlertsCount > 0 ? 'Requires Inspection →' : 'Optimal Status'}
            </span>
          </div>
        </div>

        {/* KPI 4: Solar Generation */}
        <div className="fkpi-card" onClick={() => setPage('energy')} style={{ cursor: 'pointer' }} title="View solar telemetry">
          <div className="fkpi-head">
            <span className="fkpi-title">Rooftop Solar PV</span>
            <div className="fkpi-icon gold"><Sun size={18} /></div>
          </div>
          <div className="fkpi-val-row">
            <span className="fkpi-num">{fmt(currentSolarKw)}</span>
            <span className="fkpi-unit">kW</span>
          </div>
          <div className="fkpi-detail">
            <span>Proposed 180 kWp · {liveWeather.cloudCover}% cloud cover</span>
          </div>
          <div className="fkpi-foot">
            <span className="fkpi-badge model">Modelled Estimate</span>
          </div>
        </div>

        {/* KPI 5: Monitored Water Flow */}
        <div className="fkpi-card" onClick={() => setPage('resources')} style={{ cursor: 'pointer' }} title="View water telemetry">
          <div className="fkpi-head">
            <span className="fkpi-title">Monitored Water Flow</span>
            <div className="fkpi-icon cyan"><Droplets size={18} /></div>
          </div>
          <div className="fkpi-val-row">
            <span className="fkpi-num">{totals.waterLph || totals.water || 185}</span>
            <span className="fkpi-unit">L/h</span>
          </div>
          <div className="fkpi-detail">
            <span>~{fmt((totals.waterLph || totals.water || 185) * 24, 0)} L/day continuous process flow</span>
          </div>
          <div className="fkpi-foot">
            <span className="fkpi-badge info">Metered Wet Zones</span>
          </div>
        </div>
      </div>

      {/* 3. VISUAL ANALYTICS SECTION: Charts A & B */}
      <div className="analytics-grid-two-col">
        {/* CHART A: Department Energy Consumption — Horizontal Bar Chart */}
        <div className="analytics-card" id="chart-department-energy">
          <div className="chart-header">
            <div>
              <div className="chart-eyebrow">CHART A · RANKED ELECTRICAL POWER DEMAND</div>
              <h2>Department Energy Consumption (kW)</h2>
              <p>
                Instantaneous electrical load aggregated from configured lighting, HVAC, and medical diagnostic equipment across all 40 rooms.
              </p>
            </div>
            <div className="chart-controls">
              <span className="sort-label">Sort:</span>
              <button
                className={`sort-pill ${energySortOrder === 'highest' ? 'active' : ''}`}
                onClick={() => setEnergySortOrder('highest')}
                title="Sort highest to lowest demand"
              >
                Highest
              </button>
              <button
                className={`sort-pill ${energySortOrder === 'lowest' ? 'active' : ''}`}
                onClick={() => setEnergySortOrder('lowest')}
                title="Sort lowest to highest demand"
              >
                Lowest
              </button>
              <button
                className={`sort-pill ${energySortOrder === 'name' ? 'active' : ''}`}
                onClick={() => setEnergySortOrder('name')}
                title="Sort alphabetically"
              >
                A–Z
              </button>
            </div>
          </div>

          <div className="horizontal-bar-chart-container">
            <div className="hbars-list">
              {sortedDepartmentsByEnergy.map((dept, index) => {
                const widthPct = Math.max(4, Math.min(100, (dept.powerKw / maxDeptPower) * 100));
                const sharePct = totalDemandKw > 0 ? ((dept.powerKw / totalDemandKw) * 100).toFixed(1) : '0.0';

                return (
                  <div
                    key={dept.id}
                    className="hbar-row"
                    onClick={() => {
                      onSelectDepartment(dept.name);
                      setPage('zones');
                    }}
                    title={`Click to inspect ${dept.name} (${dept.roomCount} zones) in Room & Zone Operations\nDemand: ${dept.powerKw.toFixed(1)} kW (${sharePct}%)\nLighting: ${dept.lightingKw.toFixed(1)} kW · HVAC: ${dept.hvacKw.toFixed(1)} kW · Equipment: ${dept.equipmentKw.toFixed(1)} kW`}
                  >
                    <div className="hbar-label-col">
                      <span className="dept-rank">#{index + 1}</span>
                      <strong className="dept-name">{dept.name}</strong>
                      <span className="dept-room-count">({dept.roomCount} zones)</span>
                    </div>

                    <div className="hbar-track-col">
                      <div className="hbar-track">
                        <div
                          className="hbar-fill"
                          style={{
                            width: `${widthPct}%`,
                            background: `linear-gradient(90deg, ${dept.color}dd, ${dept.color})`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="hbar-metrics-col">
                      <strong className="hbar-val">{dept.powerKw.toFixed(1)} <small>kW</small></strong>
                      <span className="hbar-share">{sharePct}%</span>
                      <ChevronRight size={13} className="hbar-arrow" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="chart-foot-note">
              <span className="foot-legend">
                <span className="foot-indicator" /> Total Facility Instantaneous Demand: <strong>{totalDemandKw.toFixed(1)} kW</strong>
              </span>
              <span className="foot-action-hint">💡 Click any department bar to filter its zones in Room & Zone Operations</span>
            </div>
          </div>
        </div>

        {/* CHART B: Department Occupancy — Bar Chart */}
        <div className="analytics-card" id="chart-department-occupancy">
          <div className="chart-header">
            <div>
              <div className="chart-eyebrow">CHART B · CAPACITY UTILIZATION & HEADCOUNT</div>
              <h2>Department Occupancy Rate (%)</h2>
              <p>
                Calculated occupancy rate: Current Occupants / Configured Capacity × 100, with distinct tracking of inpatient beds.
              </p>
            </div>
          </div>

          <div className="occupancy-bars-container">
            <div className="occ-bars-list">
              {departmentData.map(dept => {
                const rate = Math.min(100, dept.occupancyRate);
                const isHigh = rate >= 80;

                return (
                  <div
                    key={dept.id}
                    className="occ-bar-item"
                    onClick={() => {
                      onSelectDepartment(dept.name);
                      setPage('zones');
                    }}
                    title={`Click to inspect ${dept.name}\nPeople: ${dept.people} of ${dept.capacity} capacity (${rate.toFixed(0)}%)\n${dept.beds > 0 ? `Beds: ${dept.occupiedBeds} of ${dept.beds} occupied (${((dept.occupiedBeds / dept.beds) * 100).toFixed(0)}%)` : 'Clinical/Office Capacity'}`}
                  >
                    <div className="occ-item-header">
                      <div className="occ-item-title-group">
                        <strong className="occ-dept-title">{dept.name}</strong>
                        {dept.beds > 0 ? (
                          <span className="occ-bed-pill">
                            <BedDouble size={11} /> {dept.occupiedBeds}/{dept.beds} Inpatient Beds
                          </span>
                        ) : (
                          <span className="occ-staff-pill">
                            <Users size={11} /> Non-Bed Facility
                          </span>
                        )}
                      </div>
                      <div className="occ-item-stats">
                        <span className="occ-fraction">{dept.people} / {dept.capacity} pers.</span>
                        <strong className={`occ-pct ${isHigh ? 'high' : 'normal'}`}>{rate.toFixed(0)}%</strong>
                      </div>
                    </div>

                    <div className="occ-track">
                      <div
                        className={`occ-fill ${isHigh ? 'high' : 'normal'}`}
                        style={{ width: `${Math.max(3, rate)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="chart-foot-note">
              <span className="foot-legend">
                Overall Campus: <strong>{totals.people}</strong> present across <strong>{totals.capacity}</strong> total capacity
              </span>
              <span className="foot-action-hint">🛌 Inpatient wards track clinical beds separately from waiting/staff occupants</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. VISUAL ANALYTICS SECTION: Charts C & D */}
      <div className="analytics-grid-two-col" style={{ marginTop: '20px' }}>
        {/* CHART C: Energy Breakdown — Donut Chart */}
        <div className="analytics-card" id="chart-energy-breakdown">
          <div className="chart-header">
            <div>
              <div className="chart-eyebrow">CHART C · ELECTRICAL LOAD COMPOSITION</div>
              <h2>Facility Energy Breakdown</h2>
              <p>
                Contribution of Lighting, HVAC, and Medical/Diagnostic equipment derived from active zone parameters.
              </p>
            </div>
          </div>

          <div className="donut-chart-layout">
            {/* SVG Donut */}
            <div className="donut-svg-wrapper">
              <svg viewBox="0 0 200 200" className="donut-svg">
                {/* Background Ring */}
                <circle cx="100" cy="100" r="70" fill="none" stroke="#f2ebdc" strokeWidth="26" />
                {(() => {
                  let accumulatedPct = 0;
                  const circumference = 2 * Math.PI * 70; // ~439.82

                  return energyBreakdown.map(cat => {
                    const strokeDasharray = `${(cat.pct / 100) * circumference} ${circumference}`;
                    const strokeDashoffset = -((accumulatedPct / 100) * circumference);
                    accumulatedPct += cat.pct;

                    return (
                      <circle
                        key={cat.id}
                        cx="100"
                        cy="100"
                        r="70"
                        fill="none"
                        stroke={cat.color}
                        strokeWidth="26"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 100 100)"
                        className="donut-segment"
                        style={{ transition: 'stroke-dasharray 0.4s ease, stroke 0.3s ease' }}
                      />
                    );
                  });
                })()}
              </svg>
              {/* Donut Center Label */}
              <div className="donut-center-copy">
                <span className="dcc-sub">TOTAL DEMAND</span>
                <strong className="dcc-main">{totalDemandKw.toFixed(1)}</strong>
                <span className="dcc-unit">kW Power</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="donut-legend-list">
              {energyBreakdown.map(cat => (
                <div key={cat.id} className="donut-legend-item">
                  <div className="dli-top">
                    <span className="dli-dot" style={{ background: cat.color }} />
                    <strong className="dli-label">{cat.label}</strong>
                    <span className="dli-pct">{cat.pct.toFixed(1)}%</span>
                  </div>
                  <div className="dli-bottom">
                    <span className="dli-kw">{cat.kw.toFixed(2)} kW demand</span>
                    <span className="dli-note">
                      {cat.id === 'lighting' ? 'Toggled in zone controls' : cat.id === 'hvac' ? 'Chiller & AHU setpoints' : 'Fixed medical baselines'}
                    </span>
                  </div>
                </div>
              ))}

              <div className="donut-dynamic-note">
                <Info size={13} color="#b45309" />
                <span>
                  Updates dynamically when room lights or HVAC modes are changed in Room & Zone Operations.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CHART D: Resource Consumption Trends — Line Chart */}
        <div className="analytics-card" id="chart-consumption-trends">
          <div className="chart-header">
            <div>
              <div className="chart-eyebrow">CHART D · TEMPORAL CONSUMPTION TRENDS</div>
              <h2>Resource Consumption Trends</h2>
              <p>
                Diurnal and multi-day consumption profiles based on CDSIMER 40-zone operational assumptions.
              </p>
            </div>
            <div className="chart-controls">
              {/* Metric Toggle */}
              <div className="segmented-toggle">
                <button
                  className={trendMetric === 'demand' ? 'active' : ''}
                  onClick={() => setTrendMetric('demand')}
                >
                  Power (kW)
                </button>
                <button
                  className={trendMetric === 'energy' ? 'active' : ''}
                  onClick={() => setTrendMetric('energy')}
                >
                  Energy (kWh)
                </button>
              </div>

              {/* Period Selector */}
              <div className="segmented-toggle">
                <button
                  className={trendPeriod === 'hourly' ? 'active' : ''}
                  onClick={() => setTrendPeriod('hourly')}
                >
                  Hourly
                </button>
                <button
                  className={trendPeriod === 'daily' ? 'active' : ''}
                  onClick={() => setTrendPeriod('daily')}
                >
                  Daily
                </button>
                <button
                  className={trendPeriod === 'weekly' ? 'active' : ''}
                  onClick={() => setTrendPeriod('weekly')}
                >
                  Weekly
                </button>
              </div>
            </div>
          </div>

          <div className="line-chart-container">
            {/* SVG Trend Line */}
            <div className="trend-svg-box">
              <svg viewBox="0 0 500 200" preserveAspectRatio="none" className="trend-svg">
                {/* Horizontal Gridlines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="#f2ebdc" strokeDasharray="3 3" />
                <line x1="0" y1="90" x2="500" y2="90" stroke="#f2ebdc" strokeDasharray="3 3" />
                <line x1="0" y1="140" x2="500" y2="140" stroke="#f2ebdc" strokeDasharray="3 3" />

                {(() => {
                  const paddingX = 30;
                  const paddingY = 20;
                  const usableW = 500 - paddingX * 2;
                  const usableH = 200 - paddingY * 2;

                  const points = trendSeries.map((s, idx) => {
                    const x = paddingX + (idx / (trendSeries.length - 1)) * usableW;
                    const val = trendMetric === 'demand' ? s.demandKw : s.energyKwh;
                    const y = 200 - paddingY - (val / (maxTrendVal * 1.15)) * usableH;
                    return { x, y, ...s, val };
                  });

                  const pathStr = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                  const areaStr = `${pathStr} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`;

                  return (
                    <>
                      {/* Gradient Fill */}
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#c5a04f" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#c5a04f" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      <path d={areaStr} fill="url(#trendGradient)" />
                      {/* Line Stroke */}
                      <path d={pathStr} fill="none" stroke="#b45309" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Interactive Data Dots */}
                      {points.map((p, i) => (
                        <g key={i} className="trend-dot-group">
                          <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#b45309" strokeWidth="2.5" />
                          <title>{`${p.label}: ${p.val} ${trendMetric === 'demand' ? 'kW' : 'kWh'}`}</title>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* X-Axis Labels */}
            <div className="trend-x-axis">
              {trendSeries.map((s, i) => (
                <span key={i} className="x-label">{s.label}</span>
              ))}
            </div>

            {/* Honest Data Source Disclaimer */}
            <div className="chart-foot-note simulated">
              <span className="sim-badge">Model Assumption</span>
              <span className="sim-text">
                Simulated Demonstration Time Series: Derived from CDSIMER clinical schedules & diurnal hospital profiles (not physical CDSIMER hardware telemetry).
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Direct Quick Links to Interactive 3D Model & Detailed Zone Table */}
      <div className="facility-twin-banner">
        <div className="ftb-left">
          <div className="ftb-icon"><Building2 size={24} /></div>
          <div>
            <h3>Seamless Architectural Integration</h3>
            <p>
              Inspect all 40 monitored zones mapped to CDSIMER architectural drawings, with live 3D room highlighting,
              headcount simulation, individual bed admission cards, and first-person 360° walkthroughs.
            </p>
          </div>
        </div>
        <div className="ftb-right">
          <button className="ftb-btn primary" onClick={() => setPage('twin')}>
            <PanelsTopLeft size={16} />
            <span>Launch 3D Hospital Twin</span>
            <ArrowRight size={16} />
          </button>
          <button className="ftb-btn secondary" onClick={() => setPage('zones')}>
            <Layers size={16} />
            <span>Room & Zone Operations</span>
          </button>
        </div>
      </div>
    </div>
  );
}
