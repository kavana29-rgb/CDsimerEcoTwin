import React, { useState, useMemo } from 'react';
import {
  Building2, Users, Zap, Droplets, Lightbulb, Wind, Eye,
  CheckCircle2, AlertTriangle, ShieldCheck, Filter, Search,
  SlidersHorizontal, ChevronRight, BedDouble, RotateCcw
} from 'lucide-react';

import { calculateRoomPower } from '../data/hospitalArchitectureData.js';

const fmt = (n, digits = 1) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export default function HospitalMonitoredZones({
  rooms = [],
  updateRoom = () => {},
  onSelectRoom = () => {},
  onInspectInTwin = () => {},
  initialSearchQuery = '',
}) {
  const [floorFilter, setFloorFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [lightingFilter, setLightingFilter] = useState('ALL');
  const [hvacFilter, setHvacFilter] = useState('ALL');
  const [alertFilter, setAlertFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');

  React.useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      setFloorFilter('ALL');
      setCategoryFilter('ALL');
      setLightingFilter('ALL');
      setHvacFilter('ALL');
      setAlertFilter('ALL');
    }
  }, [initialSearchQuery]);

  // Programmatic verification of the 40 zones requirement
  const validation = useMemo(() => {
    const gf = rooms.filter(r => r.floorId === 'GF').length;
    const f1 = rooms.filter(r => r.floorId === 'F1').length;
    const f2 = rooms.filter(r => r.floorId === 'F2').length;
    const f3 = rooms.filter(r => r.floorId === 'F3').length;
    const total = rooms.length;
    const isValid = total === 40 && gf === 10 && f1 === 10 && f2 === 10 && f3 === 10;
    return { total, gf, f1, f2, f3, isValid };
  }, [rooms]);

  // Derive department categories
  const categories = useMemo(() => {
    const set = new Set();
    rooms.forEach(r => {
      const cat = r.safetyCategory || (r.critical ? 'Critical Care' : 'Clinical');
      set.add(cat);
    });
    return Array.from(set);
  }, [rooms]);

  // Filtered zones
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      // Floor filter
      if (floorFilter !== 'ALL' && room.floorId !== floorFilter) return false;

      // Category filter
      if (categoryFilter !== 'ALL') {
        const cat = room.safetyCategory || (room.critical ? 'Critical Care' : 'Clinical');
        if (cat !== categoryFilter) return false;
      }

      // Lighting filter
      if (lightingFilter === 'ON' && !room.lightOn) return false;
      if (lightingFilter === 'OFF' && room.lightOn) return false;

      // HVAC filter
      if (hvacFilter !== 'ALL' && room.hvacMode !== hvacFilter) return false;

      // Alert filter (unoccupied with lights on or critical status)
      if (alertFilter === 'SETBACK_RECOMMENDED' && !(room.people === 0 && room.lightOn && !room.critical)) return false;
      if (alertFilter === 'CRITICAL' && !room.critical) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = room.name.toLowerCase().includes(query);
        const matchesId = room.id.toLowerCase().includes(query);
        const matchesDept = (room.department || '').toLowerCase().includes(query);
        const matchesType = (room.type || '').toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesDept && !matchesType) return false;
      }

      return true;
    });
  }, [rooms, floorFilter, categoryFilter, lightingFilter, hvacFilter, alertFilter, searchQuery]);

  return (
    <div className="page-stack hospital-monitored-zones">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="eyebrow">FACILITY OPERATIONS & CONTROL</div>
          <h1>Room & Zone Operations ({rooms.length} Monitored Zones)</h1>
          <p>
            Real-time occupancy, manual lighting toggles, HVAC eco-modes, and instant 3D twin inspection across all 40 monitored clinical and operational zones.
          </p>
        </div>

        {/* Programmatic Validation Badge */}
        <div className={`validation-chip ${validation.isValid ? 'valid' : 'invalid'}`}>
          <CheckCircle2 size={16} />
          <div>
            <strong>40 Monitored Zones Validated</strong>
            <small>GF: {validation.gf} · F1: {validation.f1} · F2: {validation.f2} · F3: {validation.f3}</small>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="zone-filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search room name, ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search zones"
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        {/* Floor Filter Tabs */}
        <div className="filter-group">
          <span className="filter-label">Level:</span>
          <div className="filter-pills">
            {['ALL', 'GF', 'F1', 'F2', 'F3'].map(floorId => (
              <button
                key={floorId}
                className={`pill-btn ${floorFilter === floorId ? 'active' : ''}`}
                onClick={() => setFloorFilter(floorId)}
              >
                {floorId === 'ALL' ? 'All (40)' : floorId === 'GF' ? 'GF (10)' : `${floorId} (10)`}
              </button>
            ))}
          </div>
        </div>

        {/* Department Category Filter */}
        <div className="filter-group">
          <span className="filter-label">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
            aria-label="Filter by department category"
          >
            <option value="ALL">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Lighting Filter */}
        <div className="filter-group">
          <span className="filter-label">Lighting:</span>
          <select
            value={lightingFilter}
            onChange={(e) => setLightingFilter(e.target.value)}
            className="filter-select"
            aria-label="Filter by lighting status"
          >
            <option value="ALL">All States</option>
            <option value="ON">Lighting ON</option>
            <option value="OFF">Lighting OFF</option>
          </select>
        </div>

        {/* HVAC Filter */}
        <div className="filter-group">
          <span className="filter-label">HVAC:</span>
          <select
            value={hvacFilter}
            onChange={(e) => setHvacFilter(e.target.value)}
            className="filter-select"
            aria-label="Filter by HVAC status"
          >
            <option value="ALL">All Modes</option>
            <option value="Running">Running (100%)</option>
            <option value="Eco">Eco (-35%)</option>
            <option value="Idle">Idle (Standby)</option>
          </select>
        </div>

        {/* Alerts Filter */}
        <div className="filter-group">
          <span className="filter-label">Alerts:</span>
          <select
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value)}
            className="filter-select"
            aria-label="Filter by alerts"
          >
            <option value="ALL">All Zones</option>
            <option value="SETBACK_RECOMMENDED">Energy Setback Opportunity</option>
            <option value="CRITICAL">Critical Care Only</option>
          </select>
        </div>

        {(floorFilter !== 'ALL' || categoryFilter !== 'ALL' || lightingFilter !== 'ALL' || hvacFilter !== 'ALL' || alertFilter !== 'ALL' || searchQuery) && (
          <button 
            className="reset-filters-btn"
            onClick={() => {
              setFloorFilter('ALL');
              setCategoryFilter('ALL');
              setLightingFilter('ALL');
              setHvacFilter('ALL');
              setAlertFilter('ALL');
              setSearchQuery('');
            }}
            title="Reset all filters"
          >
            <RotateCcw size={13} /> Reset Filters
          </button>
        )}
      </div>

      {/* Master Facility Controls Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#ffffff',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #e2ece5',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lightbulb size={16} color="#C5A04F" />
          <strong style={{ fontSize: '13px', color: '#133526' }}>Master Facility Lighting Controls:</strong>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {rooms.filter(r => r.lightOn).length} of {rooms.length} zones illuminated
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              rooms.forEach(r => {
                if (!r.critical && r.people === 0 && r.lightOn) {
                  updateRoom(r.id, prev => ({ ...prev, lightOn: false }));
                }
              });
            }}
            style={{
              background: '#eff7f2',
              color: '#166e51',
              border: '1px solid #c2e2cf',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Turn OFF Unoccupied Lights</span>
          </button>

          <button
            onClick={() => {
              rooms.forEach(r => {
                if (!r.critical) {
                  updateRoom(r.id, prev => ({ ...prev, lightOn: false }));
                }
              });
            }}
            style={{
              background: '#fffbeb',
              color: '#b45309',
              border: '1px solid #fde68a',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>All Non-Critical Lights OFF</span>
          </button>

          <button
            onClick={() => {
              rooms.forEach(r => {
                updateRoom(r.id, prev => ({ ...prev, lightOn: true }));
              });
            }}
            style={{
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={12} />
            <span>Turn All ON</span>
          </button>
        </div>
      </div>

      {/* Grid of 40 Monitored Zone Cards */}
      <div className="monitored-zones-grid">
        {filteredRooms.length > 0 ? (
          filteredRooms.map(room => {
            // Room-level power demand via unified power engine
            const { totalKw: totalRoomKw, lightKw, bedsideKw, hvacKw, equipmentKw } = calculateRoomPower(room);

            const areaM2 = room.dimensions ? Math.round(room.dimensions[0] * room.dimensions[1]) : 28;
            const isSetbackCandidate = !room.critical && room.people === 0 && room.lightOn;
            const dailyWaterLitres = (room.waterLph || 0) * 24;

            return (
              <div 
                key={room.id}
                className={`zone-monitoring-card ${isSetbackCandidate ? 'has-setback-alert' : ''}`}
              >
                {/* Card Topline */}
                <div className="card-topline">
                  <div className="topline-left">
                    <span className="floor-badge">{room.floorName || room.floorId}</span>
                    <strong className="zone-id-tag">{room.id}</strong>
                  </div>
                  <div className="topline-right">
                    {room.critical ? (
                      <span className="status-chip critical" title="Critical clinical zone with safety lock">
                        <ShieldCheck size={12} /> Critical
                      </span>
                    ) : room.provisional ? (
                      <span className="status-chip provisional" title="Provisional placement based on clinical adjacency">
                        Provisional
                      </span>
                    ) : (
                      <span className="status-chip verified" title="Verified architectural layout feature">
                        Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Title & Department */}
                <div className="card-title-area">
                  <h3 className="zone-title" title={room.name}>{room.name}</h3>
                  <div className="zone-category-row">
                    <span className="category-pill">{room.safetyCategory || (room.critical ? 'Critical Care' : 'Clinical')}</span>
                    <span className="area-text">~{areaM2} m²</span>
                  </div>
                </div>

                {/* Aligned Metrics Grid */}
                <div className="card-metrics-row">
                  <div className="metric-box">
                    <div className="metric-lbl"><Users size={13} /> Occupancy</div>
                    <div className="metric-val">
                      <strong>{room.people}</strong>
                      <span>/ {room.capacity}</span>
                    </div>
                    {room.beds > 0 && (
                      <small className="metric-sub">{Math.min(room.beds, room.occupiedBeds || 0)}/{room.beds} beds</small>
                    )}
                  </div>

                  <div className="metric-box">
                    <div className="metric-lbl"><Zap size={13} /> Power Demand</div>
                    <div className="metric-val">
                      <strong>{fmt(totalRoomKw, 2)}</strong>
                      <span>kW</span>
                    </div>
                    <small className="metric-sub">Simulated Load</small>
                  </div>

                  <div className="metric-box">
                    <div className="metric-lbl"><Droplets size={13} /> Daily Water</div>
                    <div className="metric-val">
                      <strong>{fmt(dailyWaterLitres, 0)}</strong>
                      <span>L/d</span>
                    </div>
                    <small className="metric-sub">{room.waterLph} L/h</small>
                  </div>
                </div>

                {/* Environmental Controls */}
                <div className="card-systems-row">
                  {/* Lighting Switch */}
                  <div className="system-item lighting">
                    <div className="system-label">
                      <Lightbulb size={14} color={room.lightOn ? '#C5A04F' : '#8C7565'} />
                      <span>Lighting ({room.lightKw.toFixed(2)} kW)</span>
                    </div>
                    <button
                      className={`btn-switch-toggle ${room.lightOn ? 'on' : 'off'} ${room.critical ? 'locked' : ''}`}
                      onClick={() => {
                        if (!room.critical) {
                          updateRoom(room.id, r => ({ ...r, lightOn: !r.lightOn }));
                        }
                      }}
                      disabled={room.critical}
                      title={room.critical ? 'Clinical Lock: Lighting locked in critical care unit' : `Turn lighting ${room.lightOn ? 'OFF' : 'ON'}`}
                    >
                      <span className="toggle-slider" />
                      <span className="toggle-text">{room.lightOn ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  {/* HVAC Mode Selector */}
                  <div className="system-item hvac">
                    <div className="system-label">
                      <Wind size={14} />
                      <span>HVAC Mode</span>
                    </div>
                    <select
                      value={room.hvacMode}
                      onChange={(e) => updateRoom(room.id, r => ({ ...r, hvacMode: e.target.value }))}
                      disabled={room.critical}
                      className="hvac-select"
                      title={room.critical ? 'Clinical Lock: HVAC locked in critical care' : 'Change HVAC state'}
                    >
                      <option value="Running">Running (100%)</option>
                      <option value="Eco">Eco (-35%)</option>
                      {!room.critical && <option value="Idle">Idle (Standby)</option>}
                    </select>
                  </div>
                </div>

                {/* Bedside Task Light Summary (if applicable) */}
                {room.bedsList && room.bedsList.length > 0 && (
                  <div className="bedside-indicator-strip">
                    <BedDouble size={13} />
                    <span>
                      {room.bedsList.filter(b => b.bedsideLight !== false).length} of {room.bedsList.length} Bedside Task Lamps Active ({(room.bedsList.filter(b => b.bedsideLight !== false).length * 0.04).toFixed(2)} kW)
                    </span>
                  </div>
                )}

                {/* Energy Setback Alert Banner */}
                {isSetbackCandidate && (
                  <div className="card-setback-strip">
                    <span>💡 0 occupants · Lighting setback opportunity</span>
                    <button
                      className="btn-setback-quick"
                      onClick={() => updateRoom(room.id, r => ({ ...r, lightOn: false }))}
                    >
                      Turn Off
                    </button>
                  </div>
                )}

                {/* Inspect in 3D Twin Action */}
                <button
                  className="btn-inspect-twin"
                  onClick={() => onInspectInTwin(room)}
                  title={`Inspect ${room.name} inside the 3D CDSIMER digital twin`}
                >
                  <Eye size={15} />
                  <span>Inspect in 3D Twin</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            );
          })
        ) : (
          <div className="empty-zones-state">
            <AlertTriangle size={28} />
            <h3>No Monitored Zones Match the Current Filters</h3>
            <p>Try resetting the level, category, or search filters above.</p>
            <button 
              className="primary-button"
              onClick={() => {
                setFloorFilter('ALL');
                setCategoryFilter('ALL');
                setLightingFilter('ALL');
                setHvacFilter('ALL');
                setAlertFilter('ALL');
                setSearchQuery('');
              }}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
