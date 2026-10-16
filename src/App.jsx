import React, { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BedDouble, Building2,
  CheckCircle2, ChevronDown, ChevronRight, CircleHelp, CloudSun, Droplets,
  FileText, Gauge, Leaf, Lightbulb, Map, Menu, Monitor, PlugZap, Recycle,
  RotateCcw, Search, ShieldCheck, SlidersHorizontal, Sun, Users, Wind, X,
  Zap, PanelsTopLeft, House, Sprout, Eye, EyeOff, ArrowUpRightFromSquare,
  Download, Printer, AlertOctagon, BellRing, Sliders, Check,
  TreeDeciduous, BatteryCharging, Thermometer, Info, Sparkles, Layers,
  PanelRightClose, PanelRightOpen, Footprints, Clock, LayoutDashboard
} from 'lucide-react';
import HospitalScene from './components/HospitalScene.jsx';
import LandingPage from './components/LandingPage.jsx';
import FacilityOverviewDashboard from './components/FacilityOverviewDashboard.jsx';
import ParameterValidationPanel from './components/ParameterValidationPanel.jsx';
import EnergyCarbonDashboard from './components/sustainability/EnergyCarbonDashboard.jsx';
import WaterMaterialsDashboard from './components/sustainability/WaterMaterialsDashboard.jsx';
import HospitalMonitoredZones from './components/HospitalMonitoredZones.jsx';
import SolarPowerDashboard from './components/sustainability/SolarPowerDashboard.jsx';
import {
  calculateEnergyMetrics,
  calculateWaterMetrics,
  calculatePaperMetrics,
  calculateWasteMetrics,
  generateSustainabilityRecommendations,
  SUSTAINABILITY_CONSTANTS
} from './data/sustainabilityEngine.js';
import { 
  floors, 
  initialRooms, 
  sustainabilityDefaults, 
  initialIncidentAlerts, 
  initialSimulatorPolicies,
  calculateRoomPower,
  syncRoomOccupancy
} from './data/hospitalData.js';

const navItems = [
  { id: 'facility-overview', label: 'Facility Overview', icon: LayoutDashboard },
  { id: 'operations-overview', label: 'Operations Overview', icon: Activity },
  { id: 'twin', label: '3D Hospital Twin', icon: PanelsTopLeft, live: true },
  { id: 'zones', label: 'Room & Zone Operations', icon: Layers },
  { id: 'energy', label: 'Energy, Solar & Carbon', icon: Zap },
  { id: 'resources', label: 'Water & Materials', icon: Droplets },
  { id: 'insights', label: 'Sustainability Insights', icon: Sprout },
  { id: 'simulator', label: 'Sustainability Scenarios', icon: Sliders },
  { id: 'alerts', label: 'Alerts & Events', icon: BellRing },
  { id: 'reports', label: 'Reports', icon: FileText },
];

const fmt = (n, digits = 1) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

function StatCard({ icon: Icon, label, value, unit, detail, tint = 'mint' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tint}`}><Icon size={18} /></div>
      <div className="stat-copy">
        <div className="stat-label">{label}</div>
        <div className="stat-number">{value}<span>{unit}</span></div>
        {detail && <div className="stat-detail">{detail}</div>}
      </div>
    </div>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      aria-label={label}
      className={`toggle ${value ? 'on' : ''}`}
      onClick={() => onChange(!value)}
    >
      <span />
    </button>
  );
}

// Room Architectural & Operational Inspector
function RoomInspector({ room, updateRoom, close, floorName, onEnterWalkthrough, onCollapse, isDocked = false }) {
  if (!room) return null;

  const powerData = calculateRoomPower(room);
  const currentKw = powerData.totalKw;
  const isSensitive = room.critical;

  const totalBeds = room.beds || 0;
  const bedsList = room.bedsList || [];
  const occupiedBedCount = bedsList.length > 0 
    ? bedsList.filter(b => b.occupied).length 
    : Math.min(totalBeds, room.occupiedBeds || 0);

  // Handlers for Occupancy Simulation
  const handleAddPerson = () => {
    if (room.people >= room.capacity) return;
    updateRoom(room.id, r => syncRoomOccupancy(r, { visitors: (r.visitors || 0) + 1 }));
  };

  const handleRemovePerson = () => {
    if (room.people <= 0) return;
    updateRoom(room.id, r => {
      if ((r.visitors || 0) > 0) {
        return syncRoomOccupancy(r, { visitors: r.visitors - 1 });
      }
      if ((r.beds || 0) > 0 && (r.occupiedBeds || 0) > 0 && r.bedsList) {
        const lastOccIdx = [...r.bedsList].map(b => b.occupied).lastIndexOf(true);
        if (lastOccIdx >= 0) {
          const updatedBeds = r.bedsList.map((b, i) => i === lastOccIdx ? { ...b, occupied: false } : b);
          return syncRoomOccupancy(r, { bedsList: updatedBeds });
        }
      }
      if ((r.staff || 0) > 0) {
        return syncRoomOccupancy(r, { staff: r.staff - 1 });
      }
      return syncRoomOccupancy(r, { patients: Math.max(0, (r.patients || 0) - 1) });
    });
  };

  const handleResetOccupancy = () => {
    const defaultRoom = initialRooms.find(ir => ir.id === room.id);
    if (!defaultRoom) return;
    updateRoom(room.id, r => syncRoomOccupancy(r, {
      people: defaultRoom.people,
      patients: defaultRoom.patients || 0,
      staff: defaultRoom.staff || (defaultRoom.critical ? 2 : 1),
      visitors: defaultRoom.visitors || 0,
      occupiedBeds: defaultRoom.occupiedBeds || 0,
      bedsList: defaultRoom.bedsList?.map(b => ({ ...b })) || [],
    }));
  };

  const handleToggleBedOccupancy = (bedId) => {
    updateRoom(room.id, r => {
      const updatedBeds = (r.bedsList || []).map(b => {
        if (b.id === bedId) {
          const nextOcc = !b.occupied;
          return {
            ...b,
            occupied: nextOcc,
            bedsideLight: nextOcc ? true : b.bedsideLight,
          };
        }
        return b;
      });
      return syncRoomOccupancy(r, { bedsList: updatedBeds });
    });
  };

  const handleToggleBedsideLamp = (bedId) => {
    updateRoom(room.id, r => ({
      ...r,
      bedsList: (r.bedsList || []).map(b => 
        b.id === bedId ? { ...b, bedsideLight: !(b.bedsideLight !== false) } : b
      ),
    }));
  };

  return (
    <div className="inspector-card">
      {/* 1. Compact Header */}
      <div className="inspector-head compact">
        <div className="inspector-head-left">
          <div className="inspector-badge-row">
            <span className="room-id-tag">{room.id}</span>
            <span className="room-dept-tag">{room.department || room.type}</span>
            {isSensitive && (
              <span className="room-crit-pill">
                <ShieldCheck size={11} /> Critical Care
              </span>
            )}
            {room.provisional ? (
              <span className="room-prov-pill" title="Provisional placement">Provisional</span>
            ) : (
              <span className="room-verif-pill" title="Verified drawing placement">Verified</span>
            )}
          </div>
          <h3 className="inspector-room-title">{room.name}</h3>
        </div>
        {!isDocked && (
          <div className="inspector-header-actions">
            {onCollapse && (
              <button className="icon-button" onClick={onCollapse} title="Collapse inspector" aria-label="Collapse inspector">
                <PanelRightClose size={15}/>
              </button>
            )}
            <button className="icon-button" onClick={close} aria-label="Close inspector" title="Close inspector">
              <X size={15}/>
            </button>
          </div>
        )}
      </div>

      {/* 360 Walkthrough Quick Action Button */}
      <button
        className="btn-enter-walkthrough compact"
        onClick={() => onEnterWalkthrough(room)}
        title="Step inside room for realistic 360° first-person inspection"
      >
        <Footprints size={14} />
        <span>Enter 360° Room Walkthrough</span>
        <ChevronRight size={14} />
      </button>

      {/* Clinical Critical Zone Notice */}
      {isSensitive && (
        <div className="notice-mini blue">
          <ShieldCheck size={13}/>
          <span>Critical clinical care zone. Telemetry locked to clinical safety setpoints.</span>
        </div>
      )}

      {/* Compact Metrics Quad (People, Beds, Power, Water) */}
      <div className="inspector-stats-grid">
        <div className="is-stat">
          <span className="is-label"><Users size={11} /> Total People</span>
          <strong className="is-val">{room.people} / {room.capacity}</strong>
        </div>
        <div className="is-stat">
          <span className="is-label"><BedDouble size={11} /> Beds</span>
          <strong className="is-val">{totalBeds > 0 ? `${occupiedBedCount} / ${totalBeds}` : 'N/A'}</strong>
        </div>
        <div className="is-stat">
          <span className="is-label"><Zap size={11} /> Power Demand</span>
          <strong className="is-val">{fmt(currentKw)} <small>kW</small></strong>
        </div>
        <div className="is-stat">
          <span className="is-label"><Droplets size={11} /> Water Flow</span>
          <strong className="is-val">{room.waterLph || 0} <small>L/h</small></strong>
        </div>
      </div>

      {/* SECTION 1: Occupancy and Beds */}
      <section className="control-section compact-sec">
        <div className="section-title-compact">
          <span>1. Occupancy & Beds</span>
          <small>{room.patients || 0} Pat · {room.staff || 0} Stf · {room.visitors || 0} Vis</small>
        </div>

        <div className="people-controls-compact">
          <button
            className="btn-sim-op"
            onClick={handleAddPerson}
            disabled={room.people >= room.capacity}
            title="Simulate 1 visitor entering room"
          >
            <Users size={12}/> +1 Person
          </button>
          <button
            className="btn-sim-op"
            onClick={handleRemovePerson}
            disabled={room.people <= 0}
            title="Simulate 1 occupant leaving room"
          >
            −1 Person
          </button>
          <button
            className="btn-sim-reset"
            onClick={handleResetOccupancy}
            title="Restore baseline configured occupancy"
          >
            <RotateCcw size={12}/> Reset
          </button>
        </div>

        {/* Individual Bed Status Cards (if room has beds) */}
        {totalBeds > 0 && bedsList.length > 0 && (
          <div className="individual-bedside-section compact-bedside" style={{ marginTop: '8px' }}>
            <div className="section-head-mini">
              <div>
                <strong>Bed Status Cards ({bedsList.length} Beds)</strong>
                <span>{occupiedBedCount} / {totalBeds} Occupied</span>
              </div>
              <span className="bedside-power-pill">
                {occupiedBedCount} Patients Active
              </span>
            </div>
            <div className="bed-lamps-cards-list">
              {bedsList.map(bed => {
                const isOcc = bed.occupied;
                return (
                  <div key={bed.id} className={`bed-task-card ${isOcc ? 'occupied' : 'vacant'}`}>
                    <div className="bed-card-main">
                      <div className="bed-card-left">
                        <div className="bed-title-line">
                          <BedDouble size={13} />
                          <strong>{bed.label}</strong>
                          <span className={`occupancy-tag ${isOcc ? 'occupied' : 'vacant'}`}>
                            {isOcc ? 'Occupied' : 'Vacant'}
                          </span>
                        </div>
                        <span className="lamp-status-text">
                          {isOcc ? 'Patient Admitted (3D avatar on bed)' : 'Bed Clean & Available'}
                        </span>
                      </div>
                      <div className="bed-card-right">
                        <button
                          className={`btn-bed-toggle-occ ${isOcc ? 'btn-vacate' : 'btn-occupy'}`}
                          onClick={() => handleToggleBedOccupancy(bed.id)}
                          title={isOcc ? `Discharge patient from ${bed.label}` : `Admit patient to ${bed.label}`}
                        >
                          {isOcc ? 'Vacate Bed' : 'Occupy Bed'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: Lighting and Individual Bedside Lamps */}
      <section className="control-section compact-sec">
        <div className="section-title-compact">
          <span>2. Lighting & Bedside Lamps</span>
          <small>{fmt(powerData.totalLightingKw, 2)} kW total</small>
        </div>

        <div className="control-row-compact">
          <div className="crc-info-left">
            <Lightbulb size={15} color={room.lightOn ? '#B88A3B' : '#8C7565'} />
            <div>
              <strong>Main Room Lighting</strong>
              <span>{room.lightOn ? 'ON' : 'OFF'} · {powerData.lightKw.toFixed(2)} kW load</span>
            </div>
          </div>
          <Toggle
            value={room.lightOn}
            onChange={value => updateRoom(room.id, r => ({ ...r, lightOn: value }))}
            label="Main room lighting"
            disabled={isSensitive}
          />
        </div>

        {/* Individual Bedside Task Lamps */}
        {totalBeds > 0 && bedsList.length > 0 && (
          <div className="individual-bedside-section compact-bedside" style={{ marginTop: '8px' }}>
            <div className="section-head-mini">
              <div>
                <strong>Individual Bedside Task Lamps ({bedsList.length})</strong>
                <span>0.04 kW / lamp · Synced with 3D model</span>
              </div>
              <span className="bedside-power-pill">
                {fmt(powerData.bedsideKw, 2)} kW
              </span>
            </div>
            <div className="bed-lamps-cards-list">
              {bedsList.map(bed => {
                const isLampOn = bed.bedsideLight !== false;
                const lampKw = bed.bedsideLightPowerKw || 0.04;

                return (
                  <div key={`lamp-${bed.id}`} className={`bed-task-card ${isLampOn ? 'lamp-on' : 'lamp-off'}`}>
                    <div className="bed-card-main">
                      <div className="bed-card-left">
                        <div className="bed-title-line">
                          <Lightbulb size={13} color={isLampOn ? '#eab308' : '#94a3b8'} />
                          <strong>{bed.label} Lamp</strong>
                          <span className={`lamp-chip ${isLampOn ? 'chip-on' : 'chip-off'}`}>
                            {isLampOn ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <span className="lamp-status-text">
                          {isLampOn ? `Active · ${lampKw.toFixed(2)} kW` : `Off · 0.00 kW`}
                        </span>
                      </div>
                      <div className="bed-card-right">
                        <button
                          className={`btn-bed-switch ${isLampOn ? 'on' : 'off'}`}
                          onClick={() => handleToggleBedsideLamp(bed.id)}
                          title={`Switch bedside lamp ${isLampOn ? 'OFF' : 'ON'}`}
                        >
                          <span className="switch-thumb" />
                          <span className="switch-txt">{isLampOn ? 'ON' : 'OFF'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: HVAC and Ventilation */}
      <section className="control-section compact-sec">
        <div className="section-title-compact">
          <span>3. HVAC & Ventilation</span>
          <small>{fmt(powerData.hvacKw, 2)} kW load</small>
        </div>

        <div className="control-row-compact">
          <div className="crc-info-left">
            <Wind size={15} color="#684832" />
            <div>
              <strong>Operational Mode</strong>
              <span>{room.hvacMode} · {isSensitive ? 'Clinical Safety Lock' : 'Manual Override'}</span>
            </div>
          </div>
          <select
            aria-label="HVAC mode"
            value={room.hvacMode}
            onChange={e => updateRoom(room.id, r => ({ ...r, hvacMode: e.target.value }))}
            disabled={isSensitive}
            className="compact-select"
            title={isSensitive ? 'Clinical safety restriction: Locked in critical care zones' : 'Adjust room HVAC state'}
          >
            <option value="Running">Running (100% · {fmt(room.hvacKw)} kW)</option>
            <option value="Eco">Eco (-35% · {fmt((room.hvacKw || 1.8) * 0.65)} kW)</option>
            <option value="Ventilation">Ventilation (Airflow · {fmt((room.hvacKw || 1.8) * 0.15)} kW)</option>
            {!isSensitive && <option value="Idle">Idle (Standby · {fmt((room.hvacKw || 1.8) * 0.12)} kW)</option>}
          </select>
        </div>

        <div className="hvac-parameters-compact">
          <div className="hvac-param-chip">
            <Thermometer size={12} />
            <span>Setpoint: <strong>{room.hvacMode === 'Eco' ? '24.0°C' : '21.5°C'}</strong></span>
          </div>
          <div className="hvac-param-chip">
            <Activity size={12} />
            <span>Airflow: <strong>{isSensitive ? '15 ACH (HEPA)' : '8 ACH (Clean)'}</strong></span>
          </div>
        </div>
      </section>

      {/* SECTION 4: Connected Devices */}
      <section className="control-section compact-sec">
        <div className="section-title-compact">
          <span>4. Connected Devices</span>
          <small>{room.devices?.filter(d => d.online).length}/{room.devices?.length || 0} online</small>
        </div>
        <div className="compact-devices-list">
          {room.devices?.map(device => (
            <div className="device-row-compact" key={device.id}>
              <span className={`device-status ${device.online ? 'online' : 'offline'}`}/>
              <div className="device-info-compact">
                <strong>{device.name}</strong>
                <small>{device.id}</small>
              </div>
              <button
                className={`text-action ${device.online ? 'danger' : 'healthy'}`}
                onClick={() => updateRoom(room.id, r => ({
                  ...r,
                  devices: r.devices.map(d => d.id === device.id ? { ...d, online: !d.online } : d)
                }))}
              >
                {device.online ? 'Disconnect' : 'Reconnect'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: Sustainability Insights */}
      <section className="control-section compact-sec">
        <div className="section-title-compact">
          <span>5. Sustainability Insights</span>
          <small>Modelled Impact</small>
        </div>

        {/* Unoccupied Room Setback Alert if applicable */}
        {!isSensitive && room.people === 0 && room.lightOn && (
          <div className="setback-alert-compact" style={{ marginBottom: '8px' }}>
            <div className="sac-left">
              <Lightbulb size={14} color="#d97706" />
              <div>
                <strong>Unoccupied Lighting Setback</strong>
                <span>0 occupants with {room.lightKw.toFixed(1)} kW lights active.</span>
              </div>
            </div>
            <button
              className="btn-sac-action"
              onClick={() => updateRoom(room.id, r => ({ ...r, lightOn: false }))}
            >
              Turn Off
            </button>
          </div>
        )}

        <div className="sustainability-insights-mini-grid">
          <div className="sim-chip">
            <span className="sim-label">Daily Energy:</span>
            <strong className="sim-val">{fmt(currentKw * 24, 1)} kWh/day</strong>
          </div>
          <div className="sim-chip">
            <span className="sim-label">Carbon Footprint:</span>
            <strong className="sim-val">{fmt((currentKw * 24) * 0.70, 1)} kg CO₂e/day</strong>
          </div>
          <div className="sim-chip">
            <span className="sim-label">Water Flow:</span>
            <strong className="sim-val">{fmt((room.waterLph || 0) * 24, 0)} L/day</strong>
          </div>
        </div>
      </section>

      <div className="disclaimer-mini">Operational digital twin simulation telemetry · CDsimer facility model.</div>
    </div>
  );
}

// Facility Operations Dashboard (Overview)
function DashboardOverview({
  rooms,
  selectRoom,
  setPage,
  totals,
  alerts,
  updateRoom,
  selectedRoomId,
  setSelectedRoomId,
  sustainabilityParams,
  updateSustainabilityParam,
  onResetBaseline,
  onApplyGreenSetpoints,
}) {
  const [query, setQuery] = useState('');
  const visible = rooms.filter(r => `${r.name} ${r.id} ${r.floorId} ${r.department || r.type}`.toLowerCase().includes(query.toLowerCase()));
  const activeAlerts = alerts.filter(a => a.status === 'active');

  return (
    <div className="page-stack">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">FACILITY OPERATIONS · CDSIMER DIGITAL TWIN</div>
          <h1>Hospital Operations Dashboard</h1>
          <p>Real-time overview of CDSIMER digital twin: architectural levels, simulated demand, validated parameter engine, and environmental indicators.</p>
        </div>
        <div className="demo-badge"><span/> SIMULATION MODE ACTIVE</div>
      </div>

      <div className="stats-grid">
        <StatCard icon={Building2} label="Architectural Levels" value="4" unit=" floors" detail="GF, F1, F2, F3" />
        <StatCard icon={Users} label="Simulated Occupants" value={totals.people} unit=" people" detail={`${totals.occupiedBeds} of ${totals.beds} beds occupied`} tint="blue" />
        <StatCard icon={Zap} label="Modelled Demand" value={fmt(totals.power)} unit=" kW" detail={`${fmt(totals.lightingKw)} kW light • ${fmt(totals.hvacKw)} kW HVAC`} tint="amber" />
        <StatCard icon={Droplets} label="Potable Water Flow" value={totals.water || 185} unit=" L/h" detail="~4,440 L/day across monitored zones" tint="mint" />
      </div>

      {/* Incident Alert Banner */}
      {activeAlerts.length > 0 && (
        <div className="dashboard-alert-banner" onClick={() => setPage('alerts')}>
          <div className="alert-banner-left">
            <AlertOctagon size={18} />
            <strong>{activeAlerts.length} Active System {activeAlerts.length > 1 ? 'Alerts' : 'Alert'} Detected</strong>
            <span>— {activeAlerts[0].title}</span>
          </div>
          <button className="banner-link">View Alerts <ChevronRight size={14} /></button>
        </div>
      )}

      {/* Dedicated Interactive Parameter Inspection & Validation Panel */}
      <ParameterValidationPanel
        rooms={rooms}
        updateRoom={updateRoom}
        selectedRoomId={selectedRoomId}
        setSelectedRoomId={setSelectedRoomId}
        sustainabilityParams={sustainabilityParams}
        updateSustainabilityParam={updateSustainabilityParam}
        onResetBaseline={onResetBaseline}
        onApplyGreenSetpoints={onApplyGreenSetpoints}
      />

      <div className="section-heading">
        <div>
          <h2>Structured Room Directory (40 Monitored Zones)</h2>
          <p>Exactly 10 interactive department zones per level across Ground, First, Second, and Third floors. Click any zone to open 3D inspection.</p>
        </div>
        <button className="outline-button" onClick={() => setPage('twin')}>Open 3D Hospital Twin <ChevronRight size={16}/></button>
      </div>

      <div className="room-toolbar">
        <div className="search-box">
          <Search size={16}/>
          <input placeholder="Search 40 rooms, floors or departments..." value={query} onChange={e => setQuery(e.target.value)}/>
        </div>
        <span className="tiny-label">{visible.length} of 40 structured rooms visible</span>
      </div>

      <div className="room-grid">
        {visible.map(room => {
          const kw = calculateRoomPower(room).totalKw;
          const allGood = room.devices && room.devices.every(d => d.online);
          return (
            <button className="room-card" key={room.id} onClick={() => selectRoom(room)}>
              <div className="room-card-top">
                <span className="room-code">{room.id}</span>
                <span className={`health-dot ${allGood ? 'good' : 'bad'}`} title={allGood ? 'All devices online' : 'Device connectivity issue'}/>
              </div>
              <h3>{room.name}</h3>
              <div className="room-meta">
                <span><Users size={14}/>{room.people} people {room.beds > 0 ? `• ${room.occupiedBeds}/${room.beds} beds` : ''}</span>
                <span><Lightbulb size={14}/>{room.lightOn ? 'Lights ON' : 'Lights OFF'}</span>
                <span><ShieldCheck size={14}/>{room.safetyCategory || (room.critical ? 'Critical' : 'Clinical')}</span>
              </div>
              <div className="room-card-foot">
                <span>{room.hvacMode === 'Running' ? 'HVAC active' : `HVAC ${room.hvacMode.toLowerCase()}`}</span>
                <strong>{fmt(kw)} kW</strong>
              </div>
            </button>
          );
        })}
      </div>

      <div className="callout">
        <div className="callout-icon"><CircleHelp size={20}/></div>
        <div>
          <strong>Architectural Source Grounding</strong>
          <p>CDSIMER hospital building outline and circulation reconstructed from photographic floor plan references. 40 interactive zones model operational departments.</p>
        </div>
        <button onClick={() => setPage('twin')}>Explore 3D Hospital Twin <ChevronRight size={15}/></button>
      </div>
    </div>
  );
}

// 3D Twin View Page with Walkthrough & Split Blueprint Mode
function TwinPage({
  selectedFloor,
  setSelectedFloor,
  selectedRoom,
  selectRoom,
  rooms,
  setPage,
  updateRoom,
  isImmersive,
  setIsImmersive,
  modelLayer,
  setModelLayer,
  heatmapMode,
  setHeatmapMode,
  onEnterWalkthrough,
}) {
  const [viewMode, setViewMode] = useState('building'); // 'building' | 'floor' | 'exploded'
  const [show3dLabels, setShow3dLabels] = useState(true);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);

  // When a room is selected from any page or card, isolate its floor and expand the inspector panel
  React.useEffect(() => {
    if (selectedRoom) {
      setViewMode('floor');
      setInspectorCollapsed(false);
    }
  }, [selectedRoom?.id]);

  const floor = floors.find(f => f.id === selectedFloor) || floors[0];
  const floorRooms = rooms.filter(r => r.floorId === selectedFloor);

  return (
    <div className="page-stack twin-page">
      <div className="page-header">
        <div>
          <div className="eyebrow">ARCHITECTURAL FOUNDATION & 3D MODEL</div>
          <h1>3D Hospital Digital Twin</h1>
          <p>Coherent multi-level hospital shell, interactive floor cutaways, and realistic 360° room walkthroughs.</p>
        </div>
      </div>



      <div className={`twin-layout ${inspectorCollapsed || isImmersive ? 'inspector-collapsed' : ''}`}>
          <div className="twin-main">
            <div className="scene-titlebar">
              <div>
                <strong>CDsimerEcoTwin Architectural Model</strong>
                <span>Appearance guided by supplied exterior photograph & floor plans</span>
              </div>
              <div className="scene-titlebar-right">
                <div className="view-pill">
                  <Eye size={14}/> {isImmersive ? '360° Walkthrough' : viewMode === 'building' ? 'Whole Building' : `${floor.name} Cutaway`}
                </div>
                {!isImmersive && (
                  <button
                    className={`btn-toggle-inspector ${inspectorCollapsed ? 'collapsed' : 'expanded'}`}
                    onClick={() => setInspectorCollapsed(!inspectorCollapsed)}
                    title={inspectorCollapsed ? "Expand Room Inspector Panel" : "Collapse Room Inspector for Fullwidth 3D View"}
                    aria-label={inspectorCollapsed ? "Expand Inspector" : "Collapse Inspector"}
                  >
                    {inspectorCollapsed ? <PanelRightOpen size={14} /> : <PanelRightClose size={14} />}
                    <span>{inspectorCollapsed ? 'Show Inspector' : 'Collapse Panel'}</span>
                  </button>
                )}
              </div>
            </div>

            <HospitalScene
              selectedFloor={selectedFloor}
              setSelectedFloor={setSelectedFloor}
              selectedRoomId={selectedRoom?.id}
              setSelectedRoomId={(id) => {
                const r = rooms.find(rm => rm.id === id);
                if (r) selectRoom(r);
              }}
              viewMode={viewMode}
              setViewMode={setViewMode}
              heatmapMode={heatmapMode}
              setHeatmapMode={setHeatmapMode}
              modelLayer={modelLayer}
              setModelLayer={setModelLayer}
              show3dLabels={show3dLabels}
              setShow3dLabels={setShow3dLabels}
              isImmersive={isImmersive}
              setIsImmersive={setIsImmersive}
              rooms={rooms}
              updateRoom={updateRoom}
            />

            {!isImmersive && (
              <div className="scene-footer">
                <span><span className="legend-swatch selected"/>Selected floor</span>
                <span><span className="legend-swatch neutral"/>Exterior shell</span>
                <span>Double-click any room to enter 360° interior walkthrough</span>
              </div>
            )}

            {/* Quick Reopen Tab when Inspector is Collapsed */}
            {inspectorCollapsed && !isImmersive && (
              <button
                className="floating-inspector-expand-btn"
                onClick={() => setInspectorCollapsed(false)}
                title="Expand Room Inspector Panel"
                id="floating-expand-inspector-btn"
              >
                <PanelRightOpen size={15} />
                <span>{selectedRoom ? `Inspect ${selectedRoom.id}` : 'Room Inspector'}</span>
              </button>
            )}
          </div>

          <aside className="room-sidebar">
            {selectedRoom ? (
              <div className="docked-inspector-wrapper">
                <div className="docked-nav-bar">
                  <button
                    className="btn-dock-back"
                    onClick={() => selectRoom(null)}
                    title={`Return to ${floor.name} room list`}
                  >
                    <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} />
                    <span>{floor.name} Rooms ({floorRooms.length})</span>
                  </button>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      className="icon-button"
                      onClick={() => setInspectorCollapsed(true)}
                      title="Collapse Room Inspector for wider 3D view"
                      aria-label="Collapse inspector"
                    >
                      <PanelRightClose size={14} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => selectRoom(null)}
                      title="Deselect room"
                      aria-label="Deselect room"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <RoomInspector
                  room={selectedRoom}
                  updateRoom={updateRoom}
                  close={() => selectRoom(null)}
                  floorName={floor.name}
                  onEnterWalkthrough={onEnterWalkthrough}
                  onCollapse={() => setInspectorCollapsed(true)}
                  isDocked={true}
                />
              </div>
            ) : (
              <div className="floor-rooms-directory">
                <div className="panel-heading compact">
                  <div>
                    <div className="eyebrow">{floor.name}</div>
                    <h3>Floor Zone Directory</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span className="count-pill">{floorRooms.length} Zones</span>
                    <button
                      className="icon-button collapse-btn"
                      onClick={() => setInspectorCollapsed(true)}
                      title="Collapse inspector panel"
                      aria-label="Collapse inspector"
                    >
                      <PanelRightClose size={14} />
                    </button>
                  </div>
                </div>
                <p className="panel-help-compact">
                  Select any zone below or in the 3D model to inspect controls & telemetry.
                </p>

                <div className="compact-zone-list">
                  {floorRooms.length ? (
                    floorRooms.map(room => {
                      const kw = calculateRoomPower(room).totalKw.toFixed(1);
                      const allOnline = room.devices && room.devices.every(d => d.online);

                      return (
                        <div key={room.id} className="compact-room-entry">
                          <div className="cre-top-row">
                            <div className="cre-badges">
                              <span className="cre-code">{room.id}</span>
                              <span className="cre-dept">{room.department || room.type}</span>
                              {room.critical && <span className="cre-crit-tag">Critical</span>}
                              {room.provisional && <span className="cre-prov-tag" title="Provisional placement">Prov</span>}
                            </div>
                            <span
                              className={`cre-health-dot ${allOnline ? 'online' : 'alert'}`}
                              title={allOnline ? 'All IoT devices online' : 'IoT device alert'}
                            />
                          </div>

                          <div className="cre-title" title={room.name}>{room.name}</div>

                          <div className="cre-metrics-row">
                            <span className="cre-metric">
                              <Users size={11} /> {room.people}/{room.capacity}
                            </span>
                            {room.beds > 0 && (
                              <span className="cre-metric">
                                <BedDouble size={11} /> {room.occupiedBeds || 0}/{room.beds}
                              </span>
                            )}
                            <span className="cre-metric">
                              <Zap size={11} /> {kw} kW
                            </span>
                            <span className={`cre-hvac-tag ${room.hvacMode.toLowerCase()}`}>
                              {room.hvacMode}
                            </span>
                          </div>

                          <div className="cre-actions-row">
                            <button
                              className="btn-cre-inspect"
                              onClick={() => selectRoom(room)}
                              title={`Inspect ${room.name} controls & telemetry`}
                            >
                              <Eye size={12} /> Inspect
                            </button>
                            <button
                              className="btn-cre-walk"
                              onClick={() => {
                                selectRoom(room);
                                onEnterWalkthrough(room);
                              }}
                              title={`Enter 360° Walkthrough for ${room.name}`}
                            >
                              <Footprints size={12} /> 360° Walk
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-state">No rooms mapped to this floor yet.</div>
                  )}
                </div>

                <button
                  className="primary-button full compact-btn"
                  onClick={() => {
                    if (viewMode === 'floor') {
                      setViewMode('building');
                    } else {
                      setViewMode('floor');
                    }
                  }}
                >
                  <RotateCcw size={13} />
                  <span>{viewMode === 'floor' ? 'Return to Whole Hospital Shell' : `Isolate ${floor.name} Cutaway`}</span>
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

// Sustainability Simulator (What-If Scenario Planner)
function SimulatorPage({
  rooms = [],
  policies = {},
  setPolicies = () => {},
  sustainabilityParams = {},
  updateSustainabilityParam = () => {},
  onResetBaseline = () => {},
}) {
  const electricityRate = sustainabilityParams.electricityRate ?? SUSTAINABILITY_CONSTANTS.DEFAULT_ELECTRICITY_TARIFF; // ₹8.50 / kWh
  const emissionFactor = sustainabilityParams.gridEmissionFactor ?? SUSTAINABILITY_CONSTANTS.DEFAULT_GRID_EMISSION_FACTOR; // 0.70 kg CO2 / kWh
  const waterTariff = sustainabilityParams.waterTariffPerKL ?? SUSTAINABILITY_CONSTANTS.DEFAULT_WATER_TARIFF_PER_KL; // ₹45.0 / kL
  const paperBaseline = sustainabilityParams.paperSheetsPerDay ?? SUSTAINABILITY_CONSTANTS.BASELINE_PAPER_SHEETS_PER_DAY; // 1200 sheets/day
  const wasteBaseline = sustainabilityParams.biomedicalWasteKgPerDay ?? SUSTAINABILITY_CONSTANTS.BASELINE_BIOMEDICAL_WASTE_KG_PER_DAY; // 35.0 kg/day

  // 1. Stable Baseline Calculations (Reference Starting Condition)
  const baseline = useMemo(() => {
    // Gross unmitigated electrical power
    const totalKw = rooms.reduce((acc, r) => acc + (r.lightKw || 0.6) + (r.hvacKw || 1.8) + (r.critical ? 2.5 : 1.2), 0);
    const dailyKwh = totalKw * 24;
    const costDaily = dailyKwh * electricityRate;
    const carbonDaily = dailyKwh * emissionFactor;

    // Baseline Water (sum of room baseline water flows)
    const waterDaily = rooms.reduce((acc, r) => acc + (r.waterLph || 0) * 24, 0);
    const waterCostDaily = (waterDaily / 1000) * waterTariff;

    // Baseline Paper
    const paperDaily = paperBaseline;
    const paperCostDaily = paperDaily * 0.60;
    const paperWeightKg = paperDaily * 0.005;

    // Baseline Biomedical Waste
    const wasteDaily = wasteBaseline;

    return {
      powerKw: totalKw,
      dailyKwh,
      costDaily,
      costAnnual: costDaily * 365,
      carbonDaily,
      carbonAnnualTonnes: (carbonDaily * 365) / 1000,
      waterDaily,
      waterCostDaily,
      waterAnnualM3: (waterDaily * 365) / 1000,
      paperDaily,
      paperCostDaily,
      paperWeightKg,
      wasteDaily,
    };
  }, [rooms, electricityRate, emissionFactor, waterTariff, paperBaseline, wasteBaseline]);

  // 2. Proposed Optimized Calculations (Derived strictly from active policy levers)
  const optimized = useMemo(() => {
    let savedPowerKw = 0;

    // Lever 1: Occupancy-aware automated setback (excluding critical care)
    if (policies.autoSetbackUnoccupied) {
      rooms.forEach(r => {
        if (!r.critical && r.people === 0) {
          savedPowerKw += (r.lightKw || 0.6) * 0.80; // 80% lighting reduction
          savedPowerKw += (r.hvacKw || 1.8) * 0.45; // 45% HVAC setback
        }
      });
    }

    // Lever 2: Smart HVAC in non-clinical zones
    if (policies.smartHvacNonClinical) {
      rooms.forEach(r => {
        if (!r.critical) {
          savedPowerKw += (r.hvacKw || 1.8) * 0.15; // 15% efficiency float
        }
      });
    }

    const optHospitalKw = Math.max(10, baseline.powerKw - savedPowerKw);
    const optGrossHospitalKwh = optHospitalKw * 24;

    // Financial & Emissions derived from Electricity
    const costDaily = optGrossHospitalKwh * electricityRate;
    const costAnnual = costDaily * 365;
    const carbonDaily = optGrossHospitalKwh * emissionFactor;
    const carbonAnnualTonnes = (carbonDaily * 365) / 1000;

    // Lever 3: Low-flow plumbing fixtures
    const waterDaily = policies.lowFlowPlumbing ? baseline.waterDaily * 0.75 : baseline.waterDaily;
    const waterCostDaily = (waterDaily / 1000) * waterTariff;
    const waterAnnualM3 = (waterDaily * 365) / 1000;

    // Lever 4: Paperless digital health records / EMR
    const paperDaily = policies.digitalEmrWorkflow ? baseline.paperDaily * 0.30 : baseline.paperDaily;
    const paperCostDaily = paperDaily * 0.60;
    const paperWeightKg = paperDaily * 0.005;
    const treesSavedAnnual = (((baseline.paperDaily - paperDaily) * 365) / 8000).toFixed(1);

    // Lever 5: Biomedical waste segregation audit
    const wasteDaily = policies.wasteSegregationAudit ? baseline.wasteDaily * 0.86 : baseline.wasteDaily;

    // Overall delta calculations
    const savedKwhDaily = Math.max(0, baseline.dailyKwh - optGrossHospitalKwh);
    const savedCostDaily = Math.max(0, baseline.costDaily - costDaily);
    const savedCarbonDaily = Math.max(0, baseline.carbonDaily - carbonDaily);
    const savedWaterDaily = Math.max(0, baseline.waterDaily - waterDaily);
    const savedPaperDaily = Math.max(0, baseline.paperDaily - paperDaily);
    const savedWasteDaily = Math.max(0, baseline.wasteDaily - wasteDaily);

    const safePct = (base, opt) => base > 0 ? (((base - opt) / base) * 100).toFixed(1) : '0.0';

    return {
      powerKw: optHospitalKw,
      grossHospitalKwh: optGrossHospitalKwh,
      costDaily,
      costAnnual,
      carbonDaily,
      carbonAnnualTonnes,
      waterDaily,
      waterCostDaily,
      waterAnnualM3,
      paperDaily,
      paperCostDaily,
      paperWeightKg,
      treesSavedAnnual,
      wasteDaily,
      savedKwhDaily,
      savedCostDaily,
      savedCostAnnual: savedCostDaily * 365,
      savedCarbonDaily,
      savedCarbonAnnualTonnes: (savedCarbonDaily * 365) / 1000,
      savedWaterDaily,
      savedPaperDaily,
      savedWasteDaily,
      pctKwhSaved: safePct(baseline.dailyKwh, optGrossHospitalKwh),
      pctCostSaved: safePct(baseline.costDaily, costDaily),
      pctCarbonSaved: safePct(baseline.carbonDaily, carbonDaily),
      pctWaterSaved: safePct(baseline.waterDaily, waterDaily),
      pctPaperSaved: safePct(baseline.paperDaily, paperDaily),
      pctWasteSaved: safePct(baseline.wasteDaily, wasteDaily),
    };
  }, [rooms, policies, baseline, electricityRate, emissionFactor, waterTariff]);

  const togglePolicy = (key) => setPolicies(p => ({ ...p, [key]: !p[key] }));

  const handleResetAllScenarios = () => {
    setPolicies({
      autoSetbackUnoccupied: false,
      smartHvacNonClinical: false,
      lowFlowPlumbing: false,
      digitalEmrWorkflow: false,
      wasteSegregationAudit: false,
      offPeakScheduling: false,
    });
  };

  const handleEnableAllPolicies = () => {
    setPolicies({
      autoSetbackUnoccupied: true,
      smartHvacNonClinical: true,
      lowFlowPlumbing: true,
      digitalEmrWorkflow: true,
      wasteSegregationAudit: true,
      offPeakScheduling: true,
    });
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <div className="eyebrow">WHAT-IF SCENARIO WORKFLOW & DECARBONIZATION</div>
          <h1>Hospital Sustainability Optimization Simulator</h1>
          <p>
            Structured 5-step workflow to evaluate energy, water, and circular interventions across 40 monitored zones.
          </p>
        </div>
        <div className="simulator-quick-actions">
          <button className="sim-btn-pill reset" onClick={handleResetAllScenarios} title="Disable all policies to inspect pure baseline">
            <RotateCcw size={14} />
            <span>Reset All Scenarios</span>
          </button>
          <button className="sim-btn-pill apply" onClick={handleEnableAllPolicies} title="Engage complete green hospital package">
            <Check size={14} />
            <span>Enable All Green Policies</span>
          </button>
          <button className="sim-btn-pill baseline-reset" onClick={onResetBaseline} title="Restore default hospital room states">
            <Sliders size={14} />
            <span>Restore Baseline</span>
          </button>
        </div>
      </div>

      {/* STEP A: CHOOSE BASELINE */}
      <div className="content-card">
        <div className="section-heading">
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#C5A04F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STEP A · STARTING CONDITION</span>
            <h2 style={{ margin: '2px 0 0', fontSize: '16px', color: '#133526' }}>Facility Baseline Reference</h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#526b5d' }}>Unmitigated starting condition prior to green interventions across all 40 monitored zones.</p>
          </div>
          <button className="sim-btn-pill baseline-reset" onClick={onResetBaseline} title="Restore pure baseline room states">
            <RotateCcw size={13} />
            <span>Restore Baseline Values</span>
          </button>
        </div>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginTop: '12px' }}>
          <div style={{ background: '#f8faf9', padding: '12px', borderRadius: '8px', border: '1px solid #e2ece5' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Baseline Electrical Draw</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#133526', marginTop: '2px' }}>{fmt(baseline.powerKw, 1)} kW ({fmt(baseline.dailyKwh, 0)} kWh/day)</div>
          </div>
          <div style={{ background: '#f8faf9', padding: '12px', borderRadius: '8px', border: '1px solid #e2ece5' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Baseline Electricity Cost</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>₹{fmt(baseline.costDaily, 0)}/day</div>
          </div>
          <div style={{ background: '#f8faf9', padding: '12px', borderRadius: '8px', border: '1px solid #e2ece5' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Baseline Grid Emissions</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#166e51', marginTop: '2px' }}>{fmt(baseline.carbonDaily, 0)} kg CO₂e/day</div>
          </div>
          <div style={{ background: '#f8faf9', padding: '12px', borderRadius: '8px', border: '1px solid #e2ece5' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Baseline Water Consumption</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>{fmt(baseline.waterDaily, 0)} L/day</div>
          </div>
        </div>
      </div>

      {/* STEP B: SELECT INTERVENTIONS (NO EV) */}
      <div className="content-card">
        <div className="section-heading">
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#C5A04F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STEP B · POLICY SELECTION</span>
            <h2 style={{ margin: '2px 0 0', fontSize: '16px', color: '#133526' }}>Select Policy Interventions (6 Configurable Levers)</h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#526b5d' }}>Toggle individual sustainability policies to observe calculated facility impacts.</p>
          </div>
          <span className="count-pill">6 Available Levers (No EV)</span>
        </div>

        <div className="simulator-levers-list">
          {/* Lever 1 */}
          <div className="sim-lever-row">
            <div className="lever-info">
              <div className="lever-icon green"><Lightbulb size={18} /></div>
              <div>
                <strong>Occupancy-Aware Automated Setback</strong>
                <p>Automatically dim lighting by 80% and drop HVAC to idle when room occupancy reaches 0 (strictly excludes ICU & OTs).</p>
                <div className="lever-meta">Saves ~{fmt(rooms.filter(r => !r.critical && r.people === 0).reduce((s, r) => s + (r.lightKw || 0.6) * 0.8 + (r.hvacKw || 1.8) * 0.45, 0) * 24, 0)} kWh/day across empty non-clinical zones</div>
              </div>
            </div>
            <Toggle
              value={policies.autoSetbackUnoccupied ?? false}
              onChange={() => togglePolicy('autoSetbackUnoccupied')}
              label="Automated occupancy setback"
            />
          </div>

          {/* Lever 2 */}
          <div className="sim-lever-row">
            <div className="lever-info">
              <div className="lever-icon blue"><Wind size={18} /></div>
              <div>
                <strong>Smart HVAC Temperature Float in Non-Clinical Spaces</strong>
                <p>Adjust non-clinical thermostat setpoints from 22°C to 24°C in reception, offices, and public corridors.</p>
                <div className="lever-meta">Yields 15% chiller compressor power reduction without impacting clinical procedures</div>
              </div>
            </div>
            <Toggle
              value={policies.smartHvacNonClinical ?? false}
              onChange={() => togglePolicy('smartHvacNonClinical')}
              label="Smart HVAC setback"
            />
          </div>

          {/* Lever 3 */}
          <div className="sim-lever-row">
            <div className="lever-info">
              <div className="lever-icon blue"><Droplets size={18} /></div>
              <div>
                <strong>Low-Flow Plumbing Fixtures & Infrared Sensor Aerators</strong>
                <p>Install aerator nozzles and motion-sensor scrub taps reducing potable water flow by 25% in eligible fixtures.</p>
                <div className="lever-meta">Conserves ~{fmt(baseline.waterDaily * 0.25, 0)} Litres/day (~{fmt((baseline.waterDaily * 0.25 * 365) / 1000, 1)} kL/year)</div>
              </div>
            </div>
            <Toggle
              value={policies.lowFlowPlumbing ?? false}
              onChange={() => togglePolicy('lowFlowPlumbing')}
              label="Low flow plumbing"
            />
          </div>

          {/* Lever 4 */}
          <div className="sim-lever-row">
            <div className="lever-info">
              <div className="lever-icon amber"><FileText size={18} /></div>
              <div>
                <strong>Paperless Electronic Medical Records (EMR) Digitization</strong>
                <p>Replace paper prescriptions, patient charts, and lab requisitions with unified digital hospital tablets.</p>
                <div className="lever-meta">Reduces paper usage by 70% (~840 sheets/day avoided; preserves ~38 trees annually)</div>
              </div>
            </div>
            <Toggle
              value={policies.digitalEmrWorkflow ?? false}
              onChange={() => togglePolicy('digitalEmrWorkflow')}
              label="Digital EMR workflow"
            />
          </div>

          {/* Lever 5 */}
          <div className="sim-lever-row">
            <div className="lever-info">
              <div className="lever-icon green"><Recycle size={18} /></div>
              <div>
                <strong>Biomedical Waste Segregation Audit & Packaging Diversion</strong>
                <p>Enforce strict point-of-generation sorting to prevent uncontaminated sterile packaging entering incineration.</p>
                <div className="lever-meta">Diverts 14% of waste (~4.9 kg/day) into autoclaved recyclable plastic streams</div>
              </div>
            </div>
            <Toggle
              value={policies.wasteSegregationAudit ?? false}
              onChange={() => togglePolicy('wasteSegregationAudit')}
              label="Waste segregation audit"
            />
          </div>

          {/* Lever 6 */}
          <div className="sim-lever-row">
            <div className="lever-info">
              <div className="lever-icon amber"><Zap size={18} /></div>
              <div>
                <strong>Off-Peak Autoclave & Non-Emergency Scheduling</strong>
                <p>Shift high-temperature CSSD sterilization runs and heavy laundry cycles to off-peak tariff periods.</p>
                <div className="lever-meta">Flattens afternoon electrical demand spikes without compromising surgical readiness</div>
              </div>
            </div>
            <Toggle
              value={policies.offPeakScheduling ?? false}
              onChange={() => togglePolicy('offPeakScheduling')}
              label="Off peak scheduling"
            />
          </div>
        </div>
      </div>

      {/* STEP C: REVIEW ASSUMPTIONS */}
      <div className="content-card">
        <div className="section-heading">
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#C5A04F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STEP C · PARAMETERS & BENCHMARKS</span>
            <h2 style={{ margin: '2px 0 0', fontSize: '16px', color: '#133526' }}>Review Physical Assumptions & Utility Tariffs</h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#526b5d' }}>Calibrated regional benchmarks used for financial savings and emission reductions.</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
          <div style={{ background: '#f8faf9', padding: '12px', borderRadius: '8px', border: '1px solid #e2ece5' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Commercial Power Tariff</span>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#133526', marginTop: '4px' }}>₹{electricityRate.toFixed(2)} / kWh</div>
            <small style={{ color: '#64748b', fontSize: '10.5px' }}>Karnataka BESCOM commercial healthcare tariff</small>
          </div>
          <div style={{ background: '#f8faf9', padding: '12px', borderRadius: '8px', border: '1px solid #e2ece5' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Grid Emission Factor</span>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#133526', marginTop: '4px' }}>{emissionFactor.toFixed(2)} kg CO₂e / kWh</div>
            <small style={{ color: '#64748b', fontSize: '10.5px' }}>Central Electricity Authority (CEA) benchmark</small>
          </div>
          <div style={{ background: '#f8faf9', padding: '12px', borderRadius: '8px', border: '1px solid #e2ece5' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Water Supply Tariff</span>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#133526', marginTop: '4px' }}>₹{waterTariff.toFixed(2)} / kL</div>
            <small style={{ color: '#64748b', fontSize: '10.5px' }}>Institutional bulk potable water benchmark</small>
          </div>
          <div style={{ background: '#f8faf9', padding: '12px', borderRadius: '8px', border: '1px solid #e2ece5' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Paper & Waste Baselines</span>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#133526', marginTop: '4px' }}>1,200 sheets/day · 35 kg/day waste</div>
            <small style={{ color: '#64748b', fontSize: '10.5px' }}>Pre-digitization outpatient & ward volume</small>
          </div>
        </div>
      </div>

      {/* STEP D: COMPARE RESULTS */}
      <div className="content-card">
        <div className="section-heading">
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#C5A04F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STEP D · IMPACT EVALUATION</span>
            <h2 style={{ margin: '2px 0 0', fontSize: '16px', color: '#133526' }}>Compare Baseline vs Optimized Results</h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#526b5d' }}>Quantified performance improvements resulting from active policy selections.</p>
          </div>
        </div>

        {/* 6 Comparison KPI Cards */}
        <section className="sim-comparison-grid" style={{ marginTop: '14px' }}>
          {/* Electricity */}
          <article className="sim-kpi-compare">
            <div className="compare-top">
              <span>Net Grid Electricity (24h)</span>
              <Zap size={18} color="#2ca664" />
            </div>
            <div className="compare-values">
              <div className="val-block baseline">
                <small>Baseline</small>
                <strong>{fmt(baseline.dailyKwh, 0)} <span className="unit">kWh</span></strong>
              </div>
              <div className="val-arrow">→</div>
              <div className="val-block optimised">
                <small>Optimised</small>
                <strong>{fmt(optimized.grossHospitalKwh, 0)} <span className="unit">kWh</span></strong>
              </div>
            </div>
            <div className="compare-foot good">
              <span>Avoids {fmt(optimized.savedKwhDaily, 0)} kWh/day ({optimized.pctKwhSaved}% reduction)</span>
            </div>
          </article>

          {/* Operating Cost */}
          <article className="sim-kpi-compare">
            <div className="compare-top">
              <span>Estimated Electricity Cost</span>
              <Gauge size={18} color="#2ca664" />
            </div>
            <div className="compare-values">
              <div className="val-block baseline">
                <small>Baseline</small>
                <strong>₹{fmt(baseline.costDaily, 0)}</strong>
              </div>
              <div className="val-arrow">→</div>
              <div className="val-block optimised">
                <small>Optimised</small>
                <strong>₹{fmt(optimized.costDaily, 0)}</strong>
              </div>
            </div>
            <div className="compare-foot good">
              <span>Projected Annual Savings: ₹{fmt(optimized.savedCostAnnual, 0)}</span>
            </div>
          </article>

          {/* Carbon Emissions */}
          <article className="sim-kpi-compare">
            <div className="compare-top">
              <span>Estimated Grid Carbon (24h)</span>
              <CloudSun size={18} color="#2ca664" />
            </div>
            <div className="compare-values">
              <div className="val-block baseline">
                <small>Baseline</small>
                <strong>{fmt(baseline.carbonDaily, 0)} <span className="unit">kg CO₂e</span></strong>
              </div>
              <div className="val-arrow">→</div>
              <div className="val-block optimised">
                <small>Optimised</small>
                <strong>{fmt(optimized.carbonDaily, 0)} <span className="unit">kg CO₂e</span></strong>
              </div>
            </div>
            <div className="compare-foot good">
              <span>Avoids {fmt(optimized.savedCarbonDaily, 0)} kg CO₂e/day ({fmt(optimized.savedCarbonAnnualTonnes, 1)} t/yr)</span>
            </div>
          </article>

          {/* Water Consumption */}
          <article className="sim-kpi-compare">
            <div className="compare-top">
              <span>Potable Water Consumption</span>
              <Droplets size={18} color="#0284c7" />
            </div>
            <div className="compare-values">
              <div className="val-block baseline">
                <small>Baseline</small>
                <strong>{fmt(baseline.waterDaily, 0)} <span className="unit">L/day</span></strong>
              </div>
              <div className="val-arrow">→</div>
              <div className="val-block optimised">
                <small>Optimised</small>
                <strong>{fmt(optimized.waterDaily, 0)} <span className="unit">L/day</span></strong>
              </div>
            </div>
            <div className="compare-foot good">
              <span>Saves {fmt(optimized.savedWaterDaily, 0)} L/day ({optimized.pctWaterSaved}% reduction)</span>
            </div>
          </article>

          {/* Administrative Paper */}
          <article className="sim-kpi-compare">
            <div className="compare-top">
              <span>Hospital Paper Usage</span>
              <FileText size={18} color="#d97706" />
            </div>
            <div className="compare-values">
              <div className="val-block baseline">
                <small>Baseline</small>
                <strong>{fmt(baseline.paperDaily, 0)} <span className="unit">sheets</span></strong>
              </div>
              <div className="val-arrow">→</div>
              <div className="val-block optimised">
                <small>Optimised</small>
                <strong>{fmt(optimized.paperDaily, 0)} <span className="unit">sheets</span></strong>
              </div>
            </div>
            <div className="compare-foot good">
              <span>Conserves ~{optimized.treesSavedAnnual} trees/year with digital EMR</span>
            </div>
          </article>

          {/* Biomedical Waste */}
          <article className="sim-kpi-compare">
            <div className="compare-top">
              <span>Incineration Biomedical Waste</span>
              <Recycle size={18} color="#16a34a" />
            </div>
            <div className="compare-values">
              <div className="val-block baseline">
                <small>Baseline</small>
                <strong>{fmt(baseline.wasteDaily, 1)} <span className="unit">kg/day</span></strong>
              </div>
              <div className="val-arrow">→</div>
              <div className="val-block optimised">
                <small>Optimised</small>
                <strong>{fmt(optimized.wasteDaily, 1)} <span className="unit">kg/day</span></strong>
              </div>
            </div>
            <div className="compare-foot good">
              <span>Diverts {fmt(optimized.savedWasteDaily * 365, 0)} kg/yr packaging plastics</span>
            </div>
          </article>
        </section>

        {/* Detailed Impact Matrix Table */}
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ fontSize: '13px', margin: '0 0 10px', color: '#133526' }}>Detailed Resource Impact Matrix</h4>
          <div className="table-responsive">
            <table className="sim-matrix-table">
              <thead>
                <tr>
                  <th>Resource Stream</th>
                  <th>Unit</th>
                  <th>Baseline Reference</th>
                  <th>Optimized Scenario</th>
                  <th>Projected Reduction</th>
                  <th>Gain (%)</th>
                  <th>Calculation Assumptions & Basis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Grid Electricity Demand</strong></td>
                  <td>kWh / day</td>
                  <td>{fmt(baseline.dailyKwh, 0)}</td>
                  <td><strong style={{ color: '#166e51' }}>{fmt(optimized.grossHospitalKwh, 0)}</strong></td>
                  <td>−{fmt(optimized.savedKwhDaily, 0)}</td>
                  <td><span className="matrix-pct-pill good">−{optimized.pctKwhSaved}%</span></td>
                  <td>Unoccupied setbacks + non-clinical HVAC setpoint float</td>
                </tr>
                <tr>
                  <td><strong>Electricity Expenditure</strong></td>
                  <td>₹ / day</td>
                  <td>₹{fmt(baseline.costDaily, 0)}</td>
                  <td><strong style={{ color: '#166e51' }}>₹{fmt(optimized.costDaily, 0)}</strong></td>
                  <td>−₹{fmt(optimized.savedCostDaily, 0)}</td>
                  <td><span className="matrix-pct-pill good">−{optimized.pctCostSaved}%</span></td>
                  <td>Karnataka commercial healthcare tariff (₹{electricityRate.toFixed(2)}/kWh) applied to facility draw</td>
                </tr>
                <tr>
                  <td><strong>Grid Scope 2 Emissions</strong></td>
                  <td>kg CO₂e / day</td>
                  <td>{fmt(baseline.carbonDaily, 0)}</td>
                  <td><strong style={{ color: '#166e51' }}>{fmt(optimized.carbonDaily, 0)}</strong></td>
                  <td>−{fmt(optimized.savedCarbonDaily, 0)}</td>
                  <td><span className="matrix-pct-pill good">−{optimized.pctCarbonSaved}%</span></td>
                  <td>CEA grid factor (0.70 kg CO₂e/kWh); reduced demand directly avoids grid generation</td>
                </tr>
                <tr>
                  <td><strong>Potable Water Volume</strong></td>
                  <td>Litres / day</td>
                  <td>{fmt(baseline.waterDaily, 0)}</td>
                  <td><strong style={{ color: '#0284c7' }}>{fmt(optimized.waterDaily, 0)}</strong></td>
                  <td>−{fmt(optimized.savedWaterDaily, 0)}</td>
                  <td><span className="matrix-pct-pill blue">−{optimized.pctWaterSaved}%</span></td>
                  <td>25% reduction on eligible fixtures (aerator nozzles, sensor scrub sinks in CSSD & Cafeteria)</td>
                </tr>
                <tr>
                  <td><strong>Administrative Paper</strong></td>
                  <td>sheets / day</td>
                  <td>{fmt(baseline.paperDaily, 0)}</td>
                  <td><strong style={{ color: '#d97706' }}>{fmt(optimized.paperDaily, 0)}</strong></td>
                  <td>−{fmt(optimized.savedPaperDaily, 0)}</td>
                  <td><span className="matrix-pct-pill amber">−{optimized.pctPaperSaved}%</span></td>
                  <td>70% digital EMR workflow; saves ~{optimized.treesSavedAnnual} trees/yr & ₹{fmt(optimized.savedPaperDaily * 0.60 * 365, 0)}/yr</td>
                </tr>
                <tr>
                  <td><strong>Biomedical Incineration</strong></td>
                  <td>kg / day</td>
                  <td>{fmt(baseline.wasteDaily, 1)}</td>
                  <td><strong style={{ color: '#16a34a' }}>{fmt(optimized.wasteDaily, 1)}</strong></td>
                  <td>−{fmt(optimized.savedWasteDaily, 1)}</td>
                  <td><span className="matrix-pct-pill green">−{optimized.pctWasteSaved}%</span></td>
                  <td>Audit diverts clean packaging plastics from Yellow incineration stream into Red autoclaved recycling</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* STEP E: RESET & EXPORT */}
      <div className="content-card" style={{ background: '#f8faf9', padding: '16px' }}>
        <div className="section-heading" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#C5A04F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STEP E · EXPORT & RESET</span>
            <h2 style={{ margin: '2px 0 0', fontSize: '16px', color: '#133526' }}>Document & Reset Scenario Findings</h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#526b5d' }}>Generate compliance documentation or restore default room operational telemetry.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="outline-button"
              onClick={handleResetAllScenarios}
              title="Disable all policies to inspect pure baseline"
            >
              <RotateCcw size={14} />
              <span>Reset Scenarios</span>
            </button>
            <button
              className="primary-button"
              onClick={() => {
                if (setPage) setPage('reports');
              }}
              title="Navigate to audit reports for export"
            >
              <FileText size={14} />
              <span>Generate Audit Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clinical Life-Safety Safeguard Notice */}
      <div className="notice blue">
        <ShieldCheck size={20} />
        <div>
          <strong>Clinical Life-Safety & Uninterruptible Care Protocol</strong>
          <p>
            Automated energy setback rules strictly bypass critical care zones including Intensive Care (ICU Module A), 
            Neonatal ICU (NICU), Major Operating Theatres (OT-1, OT-2), and Emergency Resuscitation. 
            These clinical zones maintain 100% continuous lighting, uninterruptible power supply (UPS), 
            and positive-pressure HEPA air filtration at all times regardless of simulator policy selections.
          </p>
        </div>
      </div>
    </div>
  );
}

// Incident Alerts & Telemetry Response Center
function AlertsPage({ alerts, setAlerts, updateRoom }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'resolved'

  const filtered = alerts.filter(a => filter === 'all' ? true : a.status === filter);

  const handleAcknowledge = (id) => {
    setAlerts(curr => curr.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
  };

  const handleResolve = (id) => {
    setAlerts(curr => curr.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
  };

  const triggerVentilatorFault = () => {
    const newAlert = {
      id: `alt-${Date.now().toString().slice(-4)}`,
      severity: 'Critical',
      title: 'Simulated Ventilator Telemetry Drop (ICU)',
      roomId: 'F3-R01',
      roomName: 'Intensive Care Unit (ICU Module A)',
      floor: 'Third Floor',
      deviceId: 'F3-R01-D01',
      description: 'Telemetry heartbeat lost on medical gateway. Immediate bedside verification dispatched.',
      status: 'active',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    };
    setAlerts(curr => [newAlert, ...curr]);
    updateRoom('F3-R01', r => ({
      ...r,
      devices: r.devices.map((d, i) => i === 0 ? { ...d, online: false } : d)
    }));
  };

  const triggerWaterLeak = () => {
    const newAlert = {
      id: `alt-${Date.now().toString().slice(-4)}`,
      severity: 'Warning',
      title: 'Secondary Water Flow Surge (CSSD Sterilization)',
      roomId: 'F3-R03',
      roomName: 'Central Sterile Supply Department (CSSD)',
      floor: 'Third Floor',
      deviceId: 'F3-R03-D02',
      description: 'Abnormal flow rate of 38 L/h detected during idle cycle. Solenoid bypass check required.',
      status: 'active',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    };
    setAlerts(curr => [newAlert, ...curr]);
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <div className="eyebrow">CENTRALIZED TELEMETRY & DISPATCH</div>
          <h1>Incident Alerts & Facility Response</h1>
          <p>Real-time anomaly detection across medical IoT nodes, electrical loads, and environmental risers.</p>
        </div>
        <div className="demo-trigger-group">
          <button className="btn-trigger red" onClick={triggerVentilatorFault}>
            <AlertOctagon size={14} /> Simulate ICU Ventilator Drop
          </button>
          <button className="btn-trigger blue" onClick={triggerWaterLeak}>
            <Droplets size={14} /> Simulate Riser Water Surge
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="alerts-filter-bar">
        {['all', 'active', 'resolved'].map(f => (
          <button
            key={f}
            className={`alert-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' && `All Incidents (${alerts.length})`}
            {f === 'active' && `Active Issues (${alerts.filter(a => a.status === 'active').length})`}
            {f === 'resolved' && `Resolved History (${alerts.filter(a => a.status === 'resolved').length})`}
          </button>
        ))}
      </div>

      <div className="alerts-feed">
        {filtered.map(alert => (
          <div className={`alert-card ${alert.severity.toLowerCase()}`} key={alert.id}>
            <div className="alert-badge-col">
              <span className={`alert-sev-tag ${alert.severity.toLowerCase()}`}>{alert.severity}</span>
              <span className="alert-time">{alert.timestamp}</span>
            </div>
            <div className="alert-body">
              <div className="alert-room-tag">{alert.floor} · {alert.roomName} ({alert.roomId})</div>
              <h3>{alert.title}</h3>
              <p>{alert.description}</p>
              {alert.deviceId && <div className="alert-device">Node ID: <code>{alert.deviceId}</code></div>}
            </div>
            <div className="alert-actions">
              {alert.status === 'active' ? (
                <>
                  <button className="btn-ack" onClick={() => handleAcknowledge(alert.id)}>Acknowledge</button>
                  <button className="btn-resolve" onClick={() => handleResolve(alert.id)}>Mark Resolved</button>
                </>
              ) : (
                <span className="resolved-tag"><CheckCircle2 size={14} /> Resolved</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Formal Audit Documentation & Printable Sustainability Reports
function ReportsPage({ rooms = [], totals = {}, policies = {}, sustainabilityParams = {} }) {
  const handlePrint = () => {
    window.print();
  };

  const electricityTariff = sustainabilityParams.electricityTariff ?? SUSTAINABILITY_CONSTANTS.DEFAULT_ELECTRICITY_TARIFF;
  const gridEmissionFactor = sustainabilityParams.gridEmissionFactor ?? SUSTAINABILITY_CONSTANTS.DEFAULT_GRID_EMISSION_FACTOR;
  const waterTariff = sustainabilityParams.waterTariffPerKL ?? SUSTAINABILITY_CONSTANTS.DEFAULT_WATER_TARIFF_PER_KL;

  // Integrated metrics
  const energyMetrics = useMemo(() => calculateEnergyMetrics(rooms, { electricityTariff, gridEmissionFactor }), [rooms, electricityTariff, gridEmissionFactor]);
  const waterMetrics = useMemo(() => calculateWaterMetrics(rooms, { waterTariffPerKL: waterTariff, lowFlowReductionPct: policies.lowFlowPlumbing ? 25 : 0 }), [rooms, waterTariff, policies.lowFlowPlumbing]);
  const paperMetrics = useMemo(() => calculatePaperMetrics({ baselineSheets: sustainabilityParams.paperSheetsPerDay || 1200, digitalWorkflowReductionPct: policies.digitalEmrWorkflow ? 70 : 0 }), [sustainabilityParams.paperSheetsPerDay, policies.digitalEmrWorkflow]);
  const wasteMetrics = useMemo(() => calculateWasteMetrics({ baselineBiomedicalKg: sustainabilityParams.biomedicalWasteKgPerDay || 35.0, segregationAuditActive: policies.wasteSegregationAudit }), [sustainabilityParams.biomedicalWasteKgPerDay, policies.wasteSegregationAudit]);

  const downloadCSV = () => {
    const headers = [
      'Room ID', 'Room Name', 'Floor', 'Department', 'Clinical Zone',
      'Approx Dimensions', 'Area (m2)', 'Occupancy', 'Capacity',
      'Lighting State', 'HVAC Mode', 'Current Power (kW)', 'Daily Energy (kWh)',
      'Water Flow (L/h)', 'Daily Water (L)', 'Estimated Daily Carbon (kg CO2e)', 'Devices Connected'
    ];
    const rows = rooms.map(r => {
      const kw = (r.lightOn ? (r.lightKw || 0.6) : 0) + (r.hvacMode === 'Running' ? (r.hvacKw || 1.8) : r.hvacMode === 'Eco' ? (r.hvacKw || 1.8) * 0.65 : (r.hvacKw || 1.8) * 0.12) + (r.critical ? 1.5 : 0.4);
      const dims = r.dimensions ? `${r.dimensions[0]}x${r.dimensions[1]}` : 'N/A';
      const area = r.dimensions ? (r.dimensions[0] * r.dimensions[1]).toFixed(1) : 'N/A';
      const dailyKwh = kw * 24;
      const dailyWaterL = (r.waterLph || 0) * 24;
      const dailyCarbonKg = dailyKwh * gridEmissionFactor;

      return [
        r.id,
        `"${r.name}"`,
        `"${r.floorName}"`,
        `"${r.department || r.type}"`,
        r.critical ? 'Critical' : 'Clinical',
        dims,
        area,
        r.people,
        r.capacity,
        r.lightOn ? 'ON' : 'OFF',
        r.hvacMode,
        kw.toFixed(2),
        dailyKwh.toFixed(1),
        r.waterLph || 0,
        dailyWaterL.toFixed(0),
        dailyCarbonKg.toFixed(2),
        r.devices ? r.devices.length : 0,
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CDsimerEcoTwin_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = () => {
    const reportData = {
      platform: 'CDsimerEcoTwin — Green Hospital Digital Twin',
      reportType: 'Comprehensive Facility Sustainability & Telemetry Audit',
      timestamp: new Date().toISOString(),
      metadata: {
        floors: 4,
        totalRooms: rooms.length,
        occupancy: totals.people,
        electricalDemandKw: totals.power,
        monitoredWaterFlowLph: totals.water,
      },
      sustainabilityPerformance: {
        electricity: {
          grossDailyKwh: energyMetrics.grossDailyKwh,
          totalInstantKw: energyMetrics.totalInstantKw,
          lightingKw: energyMetrics.totalLightingKw,
          hvacKw: energyMetrics.totalHvacKw,
          equipmentKw: energyMetrics.totalEquipmentKw,
          estimatedCostDailyINR: energyMetrics.grossDailyKwh * electricityTariff,
          estimatedCarbonKgDaily: energyMetrics.grossDailyKwh * gridEmissionFactor,
        },
        water: {
          baselineDailyLitres: waterMetrics.baselineDailyLitres,
          optimizedDailyLitres: waterMetrics.optimizedDailyLitres,
          savedDailyLitres: waterMetrics.savedDailyLitres,
          litresPerBedDay: waterMetrics.litresPerBedDay,
          litresPerPersonDay: waterMetrics.litresPerPersonDay,
        },
        paper: {
          baselineSheetsDaily: paperMetrics.baselineSheets,
          optimizedSheetsDaily: paperMetrics.optimizedSheets,
          treesSavedAnnual: paperMetrics.treesSavedAnnual,
        },
        biomedicalWaste: {
          baselineKgDaily: wasteMetrics.baselineBiomedicalKg,
          optimizedKgDaily: wasteMetrics.optimizedBiomedicalKg,
          divertedPackagingKgAnnual: wasteMetrics.savedBiomedicalKgAnnual,
        },
      },
      activePolicies: policies,
      rooms: rooms.map(r => ({
        id: r.id,
        name: r.name,
        floor: r.floorName,
        department: r.department,
        safetyCategory: r.safetyCategory,
        dimensions: r.dimensions,
        isVerified: r.isVerified,
        occupancy: r.people,
        capacity: r.capacity,
        lightOn: r.lightOn,
        hvacMode: r.hvacMode,
        waterLph: r.waterLph,
        devices: r.devices,
      })),
    };
    const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `CDsimerEcoTwin_Digital_Twin_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-stack printable-report-page">
      <div className="page-header no-print">
        <div>
          <div className="eyebrow">AUDIT DOCUMENTATION & COMPLIANCE</div>
          <h1>Hospital Sustainability & Telemetry Report</h1>
          <p>Generate verifiable operational summaries, environmental audit tables, and download telemetry data.</p>
        </div>
        <div className="report-action-buttons">
          <button className="btn-report-dl" onClick={downloadCSV}>
            <Download size={14} /> Download CSV Telemetry
          </button>
          <button className="btn-report-dl" onClick={downloadJSON}>
            <Download size={14} /> Download JSON Data
          </button>
          <button className="btn-report-print" onClick={handlePrint}>
            <Printer size={14} /> Print Formal Report
          </button>
        </div>
      </div>

      {/* Formal Printable Document Card */}
      <div className="formal-report-paper">
        <div className="report-doc-header">
          <div>
            <div className="doc-institution">CHAMARAJANAGAR INSTITUTE OF MEDICAL SCIENCES (CDSIMER)</div>
            <h2>Green Hospital Digital Twin Operational Audit</h2>
            <div className="doc-sub">Facility Reference: Main Hospital Institutional Block · 4 Storeys · 32m × 14m Footprint</div>
          </div>
          <div className="doc-meta-box">
            <div><strong>Audit Reference:</strong> CD-ECO-2026-Q4</div>
            <div><strong>Generated:</strong> {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div><strong>Compliance Standard:</strong> IGBC Green Healthcare Benchmark</div>
          </div>
        </div>

        <div className="doc-executive-summary">
          <h3>1. Executive Facility Summary</h3>
          <p>
            This audit report documents the spatial geometry, illustrative baseline telemetry, and proposed clean energy interventions
            for the CDSIMER Hospital Block, reconstructed from campus architectural floor-plan display boards (Ground, First, Second, Third Floors)
            and authenticated exterior photographs.
          </p>
          <div className="doc-summary-grid">
            <div className="doc-kpi-item">
              <span>Structured Floors</span>
              <strong>4 Levels</strong>
              <small>GF to 3rd Floor</small>
            </div>
            <div className="doc-kpi-item">
              <span>Monitored Clinical Rooms</span>
              <strong>{rooms.length} Spaces</strong>
              <small>100% Mapped to Blueprint</small>
            </div>
            <div className="doc-kpi-item">
              <span>Instantaneous Demand</span>
              <strong>{fmt(totals.power)} kW</strong>
              <small>Lighting + HVAC + Med</small>
            </div>
            <div className="doc-kpi-item">
              <span>Simulated Occupancy</span>
              <strong>{totals.people} Persons</strong>
              <small>Patients, Staff, Visitors</small>
            </div>
            <div className="doc-kpi-item">
              <span>Potable Water Flow</span>
              <strong>{totals.water || 0} L/h</strong>
              <small>~{fmt((totals.water || 0) * 24, 0)} L/day monitored</small>
            </div>
          </div>
        </div>

        {/* Section 2: Sustainability Performance Summary */}
        <div className="doc-section">
          <h3>2. Multi-Resource Sustainability Performance Summary</h3>
          <div className="doc-summary-grid" style={{ marginBottom: '16px' }}>
            <div className="doc-kpi-item">
              <span>Gross Daily Electricity</span>
              <strong>{fmt(energyMetrics.grossDailyKwh, 0)} kWh</strong>
              <small>Estimated: ₹{fmt(energyMetrics.grossDailyKwh * electricityTariff, 0)}/day</small>
            </div>
            <div className="doc-kpi-item">
              <span>Daily Carbon Footprint</span>
              <strong>{fmt(energyMetrics.grossDailyKwh * gridEmissionFactor, 0)} kg CO₂e</strong>
              <small>Grid emission factor: {gridEmissionFactor.toFixed(2)} kg/kWh</small>
            </div>
            <div className="doc-kpi-item">
              <span>Water Intensity</span>
              <strong>{waterMetrics.litresPerBedDay} L/bed-day</strong>
              <small>{waterMetrics.litresPerPersonDay} L/person-day</small>
            </div>
            <div className="doc-kpi-item">
              <span>Digital EMR Conservation</span>
              <strong>{paperMetrics.treesSavedAnnual} Trees / yr</strong>
              <small>~{fmt(paperMetrics.savedSheetsDaily, 0)} sheets/day avoided</small>
            </div>
            <div className="doc-kpi-item">
              <span>Biomedical Incineration</span>
              <strong>{fmt(wasteMetrics.optimizedBiomedicalKg, 1)} kg/day</strong>
              <small>Diverts {fmt(wasteMetrics.savedBiomedicalKgAnnual, 0)} kg/yr packaging</small>
            </div>
          </div>
        </div>

        <div className="doc-section">
          <h3>3. Room-by-Room Operational Audit & Telemetry Matrix (40 Monitored Zones)</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Room Name</th>
                <th>Floor</th>
                <th>Clinical Zone</th>
                <th>Area</th>
                <th>Occupancy</th>
                <th>Lights</th>
                <th>HVAC</th>
                <th>Load (kW)</th>
                <th>Daily kWh</th>
                <th>Water (L/d)</th>
                <th>Devices</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(r => {
                const kw = (r.lightOn ? (r.lightKw || 0.6) : 0) + (r.hvacMode === 'Running' ? (r.hvacKw || 1.8) : r.hvacMode === 'Eco' ? (r.hvacKw || 1.8) * 0.65 : (r.hvacKw || 1.8) * 0.12) + (r.critical ? 1.5 : 0.4);
                const area = r.dimensions ? `${(r.dimensions[0] * r.dimensions[1]).toFixed(0)} m²` : 'Provisional';
                const dailyWater = (r.waterLph || 0) * 24;
                return (
                  <tr key={r.id}>
                    <td><code>{r.id}</code></td>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.floorName}</td>
                    <td>
                      <span className={`pill-zone ${r.critical ? 'crit' : 'norm'}`}>
                        {r.safetyCategory || (r.critical ? 'Critical' : 'Clinical')}
                      </span>
                    </td>
                    <td>{area}</td>
                    <td>{r.people}/{r.capacity}</td>
                    <td>{r.lightOn ? 'ON' : 'OFF'}</td>
                    <td>{r.hvacMode}</td>
                    <td>{kw.toFixed(1)}</td>
                    <td>{(kw * 24).toFixed(0)}</td>
                    <td>{dailyWater > 0 ? dailyWater.toFixed(0) : '—'}</td>
                    <td>{r.devices?.filter(d => d.online).length}/{r.devices?.length || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="doc-disclaimer-box">
          <strong>Academic Digital Twin Verification Notice</strong>
          <p>
            Values in this document reflect structured baseline models and simulated operational policies. 
            All measurements should be corroborated with calibrated physical telemetry prior to executing physical capital investments.
          </p>
        </div>
      </div>
    </div>
  );
}

// Sustainability Insights & State-Aware Recommendation Engine
function InsightsPage({
  rooms = [],
  policies = {},
  setPolicies = () => {},
  totals = {},
  setPage = () => {},
  updateRoom = () => {},
  onNavigateToRoom = () => {},
  sustainabilityParams = {},
  updateSustainabilityParam = () => {},
  onResetBaseline = () => {},
  initialTab = 'observations'
}) {
  const [subView, setSubView] = useState(initialTab); // 'observations' | 'scenarios'
  const [filterType, setFilterType] = useState('ALL');

  // Generate dynamic, state-aware recommendations from current room and policy states
  const recommendations = useMemo(() => {
    return generateSustainabilityRecommendations(rooms, policies);
  }, [rooms, policies]);

  const filtered = useMemo(() => {
    if (filterType === 'ALL') return recommendations;
    return recommendations.filter(r => r.type === filterType);
  }, [recommendations, filterType]);

  const actionableCount = recommendations.filter(r => r.actionType !== 'NONE').length;
  const highPriorityCount = recommendations.filter(r => r.priority === 'High').length;

  if (subView === 'scenarios') {
    return (
      <div className="page-stack">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button
            className="outline-button"
            onClick={() => setSubView('observations')}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <Sprout size={15} />
            <span>Automated Observations ({recommendations.length})</span>
          </button>
          <button
            className="primary-button"
            onClick={() => setSubView('scenarios')}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <SlidersHorizontal size={15} />
            <span>What-If Decarbonization Sandbox</span>
          </button>
        </div>

        <SimulatorPage
          rooms={rooms}
          policies={policies}
          setPolicies={setPolicies}
          sustainabilityParams={sustainabilityParams}
          updateSustainabilityParam={updateSustainabilityParam}
          onResetBaseline={onResetBaseline}
          setPage={setPage}
        />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <div className="eyebrow">INTELLIGENT DECISION SUPPORT & OPTIMIZATION</div>
          <h1>Sustainability Insights & Automated Observations</h1>
          <p>
            Deterministic rule-based recommendations derived from simulated occupancy, lighting states, 
            HVAC schedules, and spatial floor-plan parameters. All clinical critical care zones are protected by safety locks.
          </p>
        </div>
        <div className="calculation-badge">
          <span>Engine: Deterministic State-Aware Analysis</span>
        </div>
      </div>

      {/* Sub-view Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <button
          className="primary-button"
          onClick={() => setSubView('observations')}
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          <Sprout size={15} />
          <span>Automated Observations ({recommendations.length})</span>
        </button>
        <button
          className="outline-button"
          onClick={() => setSubView('scenarios')}
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          <SlidersHorizontal size={15} />
          <span>What-If Decarbonization Sandbox</span>
        </button>
      </div>

      {/* Snapshot Hero Banner */}
      <div className="insight-hero">
        <div className="insight-hero-icon"><Sprout size={28}/></div>
        <div>
          <div className="eyebrow">FACILITY INTELLIGENCE SNAPSHOT</div>
          <h2>
            {recommendations.length} Active System Observation{recommendations.length > 1 ? 's' : ''} Identified
          </h2>
          <p>
            {actionableCount > 0 
              ? `${actionableCount} immediate energy-saving actions available (${highPriorityCount} high priority). One-click execution updates live 3D visual states.`
              : 'All 40 monitored zones are operating within optimal green parameters.'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="alerts-filter-bar">
        {[
          { id: 'ALL', label: `All Observations (${recommendations.length})` },
          { id: 'energy_setback', label: `Lighting Setback (${recommendations.filter(r => r.type === 'energy_setback').length})` },
          { id: 'hvac_efficiency', label: `HVAC Efficiency (${recommendations.filter(r => r.type === 'hvac_efficiency').length})` },
          { id: 'iaq_fresh_air', label: `Indoor Air Quality (${recommendations.filter(r => r.type === 'iaq_fresh_air').length})` },
          { id: 'clinical_safeguard', label: `Clinical Safeguards (${recommendations.filter(r => r.type === 'clinical_safeguard').length})` },
          { id: 'water_conservation', label: `Water Conservation (${recommendations.filter(r => r.type === 'water_conservation').length})` },
        ].map(tab => (
          <button
            key={tab.id}
            className={`alert-tab ${filterType === tab.id ? 'active' : ''}`}
            onClick={() => setFilterType(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recommendations Feed */}
      <div className="insight-list">
        {filtered.length > 0 ? (
          filtered.map(rec => (
            <div className={`insight-card ${rec.priority.toLowerCase()}`} key={rec.id}>
              <div className={`insight-priority ${rec.priority.toLowerCase()}`}>
                {rec.type === 'energy_setback' && <Lightbulb size={20} />}
                {rec.type === 'hvac_efficiency' && <Wind size={20} />}
                {rec.type === 'iaq_fresh_air' && <Activity size={20} />}
                {rec.type === 'clinical_safeguard' && <ShieldCheck size={20} />}
                {rec.type === 'water_conservation' && <Droplets size={20} />}
              </div>

              <div className="insight-body">
                <div className="insight-header-tags">
                  <span className={`pill-priority ${rec.priority.toLowerCase()}`}>
                    {rec.priority} Priority
                  </span>
                  <span className="insight-room-tag">
                    {rec.floorName} · {rec.roomName} ({rec.roomId})
                  </span>
                </div>

                <h3>{rec.title}</h3>

                <div className="insight-detected-box">
                  <strong>Detected Simulated Condition:</strong>
                  <p>{rec.condition}</p>
                </div>

                <p className="insight-explanation">{rec.explanation}</p>

                <div className="insight-meta-grid">
                  <div>
                    <span className="meta-label">Proposed Action:</span>
                    <strong>{rec.proposedAction}</strong>
                  </div>
                  <div>
                    <span className="meta-label">Projected Resource Impact:</span>
                    <strong style={{ color: '#166e51' }}>{rec.projectedImpact}</strong>
                  </div>
                </div>

                {rec.safetyNote && (
                  <div className="insight-safety-note">
                    <ShieldCheck size={14} />
                    <span>{rec.safetyNote}</span>
                  </div>
                )}
              </div>

              <div className="insight-actions-col">
                {rec.actionType === 'TOGGLE_LIGHT' && (
                  <button
                    className="primary-button small"
                    onClick={() => updateRoom(rec.roomId, r => ({ ...r, lightOn: false }))}
                    title="Switch off lighting for this empty room"
                  >
                    <Lightbulb size={14} />
                    <span>Turn Off Lighting</span>
                  </button>
                )}

                {rec.actionType === 'SET_HVAC_ECO' && (
                  <button
                    className="primary-button small"
                    onClick={() => updateRoom(rec.roomId, r => ({ ...r, hvacMode: 'Eco' }))}
                    title="Set HVAC mode to Eco for this empty room"
                  >
                    <Wind size={14} />
                    <span>Set HVAC to Eco</span>
                  </button>
                )}

                {rec.roomId && rec.roomId !== 'ROOFTOP' && (
                  <button
                    className="outline-button small"
                    onClick={() => onNavigateToRoom(rec.roomId, rec.floorId)}
                    title="Inspect room in 3D Hospital Twin"
                  >
                    <Eye size={14} />
                    <span>Inspect Zone</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="content-card empty-state">
            <CheckCircle2 size={32} color="#166e51" style={{ marginBottom: '12px' }} />
            <h3>No Observations in Selected Category</h3>
            <p>All monitored hospital spaces are operating in adherence to sustainability policies.</p>
          </div>
        )}
      </div>

      <div className="notice amber" style={{ marginTop: '24px' }}>
        <Info size={18} />
        <div>
          <strong>State-Aware Intelligence Architecture Notice</strong>
          <p>
            Observations are continuously evaluated against active room simulation parameters, occupancy sensors, 
            and hospital architectural policies. Recommendations automatically update or clear as room parameters change.
          </p>
        </div>
      </div>
    </div>
  );
}



export default function App() {
  const [page, setPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#/, '');
      const validPages = [
        'landing',
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
      if (validPages.includes(hash)) {
        return hash;
      }
    }
    return 'landing';
  });
  const [mobileNav, setMobileNav] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('GF');
  const [rooms, setRooms] = useState(initialRooms);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [isImmersive, setIsImmersive] = useState(false);
  const [modelLayer, setModelLayer] = useState('LayerB'); // 'LayerB' (Proposed) | 'LayerA' (Baseline)
  const [heatmapMode, setHeatmapMode] = useState('Normal'); // 'Normal' | 'Energy' | 'Occupancy' | 'Devices' | 'Water'
  const [alerts, setAlerts] = useState(initialIncidentAlerts);
  const [policies, setPolicies] = useState(initialSimulatorPolicies);

  // Synchronize hash with page state for bookmarking and direct refresh
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentHash = window.location.hash.replace(/^#/, '');
      if (page === 'landing') {
        if (currentHash && currentHash !== 'landing') {
          try {
            window.history.pushState(null, '', window.location.pathname + window.location.search);
          } catch {
            window.location.hash = '';
          }
        }
      } else if (currentHash !== page) {
        window.location.hash = page;
      }
    }
  }, [page]);

  // Handle browser back/forward and hash changes
  React.useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const validPages = [
        'landing',
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
      if (validPages.includes(hash)) {
        setPage(hash);
      } else if (!hash) {
        setPage('landing');
      }
    };

    window.addEventListener('hashchange', handleHashSync);
    window.addEventListener('popstate', handleHashSync);
    return () => {
      window.removeEventListener('hashchange', handleHashSync);
      window.removeEventListener('popstate', handleHashSync);
    };
  }, []);

  // Live Clock (Asia/Kolkata - CDSIMER Hospital Local Time)
  const [currentTime, setCurrentTime] = useState(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const liveClockFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(currentTime);
  }, [currentTime]);

  // Modelled instantaneous rooftop solar generation for proposed 180 kWp array
  const currentSolarKw = useMemo(() => {
    const hour = currentTime.getHours() + currentTime.getMinutes() / 60;
    if (hour < 6 || hour > 18) return 0;
    const factor = Math.sin(((hour - 6) / 12) * Math.PI);
    return Number((180 * Math.pow(factor, 1.35) * 0.96 * 0.85).toFixed(1));
  }, [currentTime]);

  // Macro Sustainability Levers (Validated Facility Parameters)
  const [sustainabilityParams, setSustainabilityParams] = useState({
    gridEmissionFactor: 0.70, // kg CO2e/kWh
    electricityRate: 8.50, // INR/kWh
    waterTariffPerKL: 45.0, // INR/kL
    paperSheetsPerDay: 1200, // sheets/day
    biomedicalWasteKgPerDay: 35.0, // kg/day
  });

  const updateSustainabilityParam = (key, val) => {
    setSustainabilityParams(prev => ({ ...prev, [key]: val }));
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || null;

  // Real-time aggregate calculations across all 40 monitored zones
  const totals = useMemo(() => {
    return rooms.reduce((acc, r) => {
      acc.people += r.people || 0;
      acc.capacity += r.capacity || 0;
      acc.beds += r.beds || 0;
      const occBeds = r.bedsList 
        ? r.bedsList.filter(b => b.occupied).length 
        : Math.min(r.beds || 0, r.occupiedBeds || 0);
      acc.occupiedBeds += occBeds;
      const powerBreakdown = calculateRoomPower(r);
      acc.lightingKw += powerBreakdown.totalLightingKw;
      acc.hvacKw += powerBreakdown.hvacKw;
      acc.equipmentKw = (acc.equipmentKw || 0) + powerBreakdown.equipmentKw;
      acc.power += powerBreakdown.totalKw;
      acc.waterLph += (r.waterLph || 0);
      acc.devices += r.devices?.length || 0;
      acc.online += r.devices?.filter(d => d.online).length || 0;
      return acc;
    }, {
      people: 0,
      capacity: 0,
      beds: 0,
      occupiedBeds: 0,
      lightingKw: 0,
      hvacKw: 0,
      equipmentKw: 0,
      power: 0,
      waterLph: 0,
      devices: 0,
      online: 0,
    });
  }, [rooms]);

  const updateRoom = (id, updater) => setRooms(current => current.map(r => r.id === id ? updater(r) : r));

  const selectRoom = (roomOrId) => {
    if (!roomOrId) {
      setSelectedRoomId(null);
      return;
    }
    const room = typeof roomOrId === 'string'
      ? rooms.find(r => r.id === roomOrId)
      : (roomOrId.id ? rooms.find(r => r.id === roomOrId.id) || roomOrId : roomOrId);
    if (room) {
      setSelectedRoomId(room.id);
      if (room.floorId) setSelectedFloor(room.floorId);
      if (page !== 'twin') setPage('twin');
    }
  };

  const handleNavigateToRoom = (roomOrId, floorId) => {
    const rId = typeof roomOrId === 'string' ? roomOrId : roomOrId?.id;
    const fId = typeof roomOrId === 'object' ? roomOrId?.floorId || floorId : floorId;
    const r = rooms.find(rm => rm.id === rId);
    if (r) {
      selectRoom(r);
    } else if (fId) {
      setSelectedFloor(fId);
      setPage('twin');
    }
  };

  const handleEnterWalkthrough = (room) => {
    selectRoom(room);
    setIsImmersive(true);
  };

  const handleExploreTwin = (floorId = 'GF', targetPage = 'twin') => {
    setSelectedFloor(floorId);
    setPage(targetPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetBaseline = () => {
    setRooms(initialRooms);
    setSustainabilityParams({
      gridEmissionFactor: 0.70,
      electricityRate: 8.50,
      waterTariffPerKL: 45.0,
      paperSheetsPerDay: 1200,
      biomedicalWasteKgPerDay: 35.0,
    });
    setPolicies(initialSimulatorPolicies);
  };

  const handleApplyGreenSetpoints = () => {
    setRooms(curr => curr.map(r => {
      if (r.safetyCategory === 'Critical') return r;
      const updatedLight = r.people === 0 ? false : r.lightOn;
      const updatedHvac = r.people === 0 ? 'Ventilation' : 'Eco';
      return {
        ...r,
        lightOn: updatedLight,
        hvacMode: updatedHvac,
      };
    }));
    setPolicies(prev => ({
      ...prev,
      autoSetbackUnoccupied: true,
      smartHvacNonClinical: true,
      lowFlowPlumbing: true,
    }));
  };

  const activeNav = navItems.find(n => n.id === page) || navItems[1];
  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

  if (page === 'landing') {
    return <LandingPage onExploreTwin={handleExploreTwin} rooms={rooms} totals={totals} />;
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
        <div className="brand" onClick={() => { setPage('facility-overview'); setIsImmersive(false); }} style={{ cursor: 'pointer' }} title="CDsimerEcoTwin Facility Overview">
          <div className="brand-mark"><Leaf size={24}/></div>
          <div><strong>CDsimerEcoTwin</strong><span>GREEN HOSPITAL DIGITAL TWIN</span></div>
        </div>

        <div className="side-label">FACILITY INTELLIGENCE</div>
        <nav>
          {navItems.map(item => {
            const Icon = item.icon;
            const isItemActive = page === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isItemActive ? 'active' : ''}`}
                onClick={() => {
                  setPage(item.id);
                  setMobileNav(false);
                  if (item.id !== 'twin') setIsImmersive(false);
                }}
              >
                <Icon size={18}/>
                <span>{item.label}</span>
                {item.id === 'twin' && <span className="nav-live"/>}
                {item.id === 'alerts' && activeAlertsCount > 0 && (
                  <span className="nav-alert-chip">{activeAlertsCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="side-spacer"/>

        <div className="provisional-card">
          <div className="provisional-heading"><ShieldCheck size={16}/><strong>Campus Twin Active</strong></div>
          <p>40 monitored clinical and operational zones configured across 4 architectural levels.</p>
        </div>

        <div className="sidebar-foot"><span className="pulse-dot"/> Local simulation active</div>
      </aside>

      {mobileNav && <button className="nav-backdrop" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}

      <main className="main-area">
        <header className="topbar no-print">
          <div className="topbar-left">
            <div className="breadcrumb">
              <button className="text-breadcrumb-btn" onClick={() => { setPage('facility-overview'); setIsImmersive(false); }}>CDsimerEcoTwin</button>
              <ChevronRight size={14}/>
              <strong>{activeNav.label}</strong>
              {isImmersive && (
                <>
                  <ChevronRight size={14}/>
                  <span style={{ color: '#b45309', fontWeight: 700 }}>360° Walkthrough</span>
                </>
              )}
            </div>
          </div>

          <div className="topbar-right">
            <div className="live-clock-pill" title="CDSIMER Campus Local Time (Asia/Kolkata · IST)">
              <Clock size={13} className="clock-icon" />
              <span className="clock-time">{liveClockFormatted}</span>
              <span className="clock-tz">IST</span>
            </div>
            <div className="sim-chip"><span/> SIMULATION MODE</div>
            <button className="help-button" onClick={() => setPage('landing')} title="About CDSIMER Facility Twin"><CircleHelp size={17}/></button>
            <div className="avatar">CD</div>
          </div>
        </header>

        <div className="content-area">
          {page === 'facility-overview' && (
            <FacilityOverviewDashboard
              rooms={rooms}
              totals={totals}
              alerts={alerts}
              setPage={setPage}
              onSelectDepartment={(deptName) => {
                setDepartmentFilter(deptName);
                setPage('zones');
              }}
              onInspectInTwin={handleNavigateToRoom}
              currentSolarKw={currentSolarKw}
            />
          )}

          {(page === 'operations-overview' || page === 'overview') && (
            <DashboardOverview
              rooms={rooms}
              selectRoom={selectRoom}
              setPage={setPage}
              totals={totals}
              alerts={alerts}
              updateRoom={updateRoom}
              selectedRoomId={selectedRoomId}
              setSelectedRoomId={setSelectedRoomId}
              sustainabilityParams={sustainabilityParams}
              updateSustainabilityParam={updateSustainabilityParam}
              onResetBaseline={handleResetBaseline}
              onApplyGreenSetpoints={handleApplyGreenSetpoints}
            />
          )}

          {page === 'twin' && (
            <TwinPage
              selectedFloor={selectedFloor}
              setSelectedFloor={setSelectedFloor}
              selectedRoom={selectedRoom}
              selectRoom={selectRoom}
              rooms={rooms}
              setPage={setPage}
              updateRoom={updateRoom}
              isImmersive={isImmersive}
              setIsImmersive={setIsImmersive}
              modelLayer={modelLayer}
              setModelLayer={setModelLayer}
              heatmapMode={heatmapMode}
              setHeatmapMode={setHeatmapMode}
              onEnterWalkthrough={handleEnterWalkthrough}
            />
          )}

          {page === 'zones' && (
            <HospitalMonitoredZones
              rooms={rooms}
              updateRoom={updateRoom}
              onSelectRoom={selectRoom}
              onInspectInTwin={(room) => {
                selectRoom(room);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              initialSearchQuery={departmentFilter}
            />
          )}

          {page === 'energy' && (
            <EnergyCarbonDashboard
              rooms={rooms}
              updateRoom={updateRoom}
              sustainabilityParams={sustainabilityParams}
              updateSustainabilityParam={updateSustainabilityParam}
              onNavigateToRoom={handleNavigateToRoom}
            />
          )}

          {page === 'resources' && (
            <WaterMaterialsDashboard
              rooms={rooms}
              sustainabilityParams={sustainabilityParams}
              updateSustainabilityParam={updateSustainabilityParam}
              onNavigateToRoom={handleNavigateToRoom}
            />
          )}

          {page === 'insights' && (
            <InsightsPage
              rooms={rooms}
              policies={policies}
              totals={totals}
              setPage={setPage}
              updateRoom={updateRoom}
              onNavigateToRoom={handleNavigateToRoom}
            />
          )}

          {page === 'simulator' && (
            <SimulatorPage
              rooms={rooms}
              policies={policies}
              setPolicies={setPolicies}
              sustainabilityParams={sustainabilityParams}
              updateSustainabilityParam={updateSustainabilityParam}
              onResetBaseline={handleResetBaseline}
            />
          )}

          {page === 'alerts' && (
            <AlertsPage
              alerts={alerts}
              setAlerts={setAlerts}
              updateRoom={updateRoom}
            />
          )}

          {page === 'reports' && (
            <ReportsPage
              rooms={rooms}
              totals={totals}
              policies={policies}
              sustainabilityParams={sustainabilityParams}
            />
          )}
        </div>
      </main>
    </div>
  );
}
