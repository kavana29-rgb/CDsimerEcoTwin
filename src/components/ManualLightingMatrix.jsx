import React, { useState, useMemo } from 'react';
import {
  Lightbulb, Zap, ShieldCheck, AlertTriangle, CheckCircle2,
  Filter, Search, RotateCcw, Power, Eye, ChevronRight,
  TrendingDown, Sparkles
} from 'lucide-react';

const fmt = (n, digits = 1) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export default function ManualLightingMatrix({
  rooms = [],
  updateRoom = () => {},
  onInspectInTwin = () => {},
}) {
  const [floorTab, setFloorTab] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Summary statistics across all 40 rooms
  const stats = useMemo(() => {
    let totalLights = rooms.length;
    let activeLights = 0;
    let activeKw = 0;
    let eligibleSetbackCount = 0;
    let eligibleSetbackKw = 0;
    let lockedCount = 0;

    rooms.forEach(r => {
      if (r.lightOn) {
        activeLights++;
        activeKw += (r.lightKw || 0.6);
      }
      if (r.critical) {
        lockedCount++;
      } else if (r.people === 0 && r.lightOn) {
        eligibleSetbackCount++;
        eligibleSetbackKw += (r.lightKw || 0.6);
      }
    });

    return {
      totalLights,
      activeLights,
      inactiveLights: totalLights - activeLights,
      activeKw,
      eligibleSetbackCount,
      eligibleSetbackKw,
      lockedCount,
    };
  }, [rooms]);

  // Bulk action: Turn off all permitted unoccupied room lights
  const handleTurnOffEligible = () => {
    rooms.forEach(r => {
      if (!r.critical && r.people === 0 && r.lightOn) {
        updateRoom(r.id, prev => ({ ...prev, lightOn: false }));
      }
    });
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      // Floor filter
      if (floorTab !== 'ALL' && room.floorId !== floorTab) return false;

      // Status filter
      if (statusFilter === 'ON' && !room.lightOn) return false;
      if (statusFilter === 'OFF' && room.lightOn) return false;
      if (statusFilter === 'LOCKED' && !room.critical) return false;
      if (statusFilter === 'ELIGIBLE' && (room.critical || room.people > 0 || !room.lightOn)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = room.name.toLowerCase().includes(q);
        const matchesId = room.id.toLowerCase().includes(q);
        const matchesDept = (room.department || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesDept) return false;
      }

      return true;
    });
  }, [rooms, floorTab, statusFilter, searchQuery]);

  return (
    <div className="page-stack manual-lighting-matrix">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="eyebrow">FACILITY CONTROLS · ENERGY MANAGEMENT</div>
          <h1>Manual Lighting Control Matrix</h1>
          <p>
            Synchronized room-level lighting switches across 40 clinical zones. Real-time propagation to 3D architectural twin and power demand calculations.
          </p>
        </div>

        {stats.eligibleSetbackCount > 0 && (
          <button 
            className="primary-button setback-bulk-btn"
            onClick={handleTurnOffEligible}
            title="Turn off lighting in all unoccupied non-clinical zones"
          >
            <Sparkles size={16} />
            <span>Turn Off {stats.eligibleSetbackCount} Unoccupied Lights ({fmt(stats.eligibleSetbackKw, 2)} kW)</span>
          </button>
        )}
      </div>

      {/* Lighting Metrics Summary Strip */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon gold"><Lightbulb size={18} /></div>
          <div className="stat-copy">
            <div className="stat-label">Active Room Lights</div>
            <div className="stat-number">{stats.activeLights} <span>/ {stats.totalLights}</span></div>
            <div className="stat-detail">{stats.inactiveLights} fixtures currently switched OFF</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber"><Zap size={18} /></div>
          <div className="stat-copy">
            <div className="stat-label">Active Lighting Load</div>
            <div className="stat-number">{fmt(stats.activeKw, 2)} <span>kW</span></div>
            <div className="stat-detail">Instantaneous hospital lighting demand</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon mint"><TrendingDown size={18} /></div>
          <div className="stat-copy">
            <div className="stat-label">Eligible for Setback</div>
            <div className="stat-number">{stats.eligibleSetbackCount} <span>zones</span></div>
            <div className="stat-detail">{fmt(stats.eligibleSetbackKw, 2)} kW potential immediate savings</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon dark"><ShieldCheck size={18} /></div>
          <div className="stat-copy">
            <div className="stat-label">Clinical Safety Locks</div>
            <div className="stat-number">{stats.lockedCount} <span>zones</span></div>
            <div className="stat-detail">ICU & surgical zones require clinical sign-off</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="matrix-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by zone ID or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search lighting zones"
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
                className={`pill-btn ${floorTab === floorId ? 'active' : ''}`}
                onClick={() => setFloorTab(floorId)}
              >
                {floorId === 'ALL' ? 'All (40)' : floorId}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <span className="filter-label">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
            aria-label="Filter by lighting status"
          >
            <option value="ALL">All Statuses</option>
            <option value="ON">Lights ON ({stats.activeLights})</option>
            <option value="OFF">Lights OFF ({stats.inactiveLights})</option>
            <option value="ELIGIBLE">Unoccupied Setback ({stats.eligibleSetbackCount})</option>
            <option value="LOCKED">Clinical Locked ({stats.lockedCount})</option>
          </select>
        </div>

        {(floorTab !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
          <button 
            className="reset-filters-btn"
            onClick={() => {
              setFloorTab('ALL');
              setStatusFilter('ALL');
              setSearchQuery('');
            }}
          >
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>

      {/* Matrix Room Cards List */}
      <div className="matrix-cards-grid">
        {filteredRooms.map(room => {
          // Dynamic simulated room power demand
          const bedsideKw = (room.bedsList || []).reduce((sum, b) => sum + (b.bedsideLight !== false ? (b.bedsideLightPowerKw || 0.04) : 0), 0);
          const lightKw = room.lightOn ? (room.lightKw || 0.6) : 0;
          const hvacKw = room.hvacMode === 'Running' ? (room.hvacKw || 1.8) : room.hvacMode === 'Eco' ? (room.hvacKw || 1.8) * 0.65 : (room.hvacKw || 1.8) * 0.12;
          const equipKw = room.critical ? 1.5 : 0.4;
          const currentTotalKw = lightKw + bedsideKw + hvacKw + equipKw;

          const isUnoccupiedOn = !room.critical && room.people === 0 && room.lightOn;

          return (
            <div 
              key={room.id}
              className={`matrix-card ${room.lightOn ? 'light-active' : 'light-off'} ${room.critical ? 'is-locked' : ''} ${isUnoccupiedOn ? 'setback-alert' : ''}`}
            >
              {/* Header */}
              <div className="matrix-card-head">
                <div className="head-left">
                  <span className="floor-badge">{room.floorName || room.floorId}</span>
                  <strong className="zone-id">{room.id}</strong>
                </div>
                <div className="head-right">
                  {room.critical ? (
                    <span className="clinical-lock-tag" title="Clinical safety lock: Lighting modifications restricted">
                      <ShieldCheck size={13} /> Clinical Safety Lock
                    </span>
                  ) : (
                    <span className="manual-allowed-tag">
                      <CheckCircle2 size={13} /> Manual Switching Permitted
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Dept */}
              <div className="matrix-card-body">
                <h3 className="room-name">{room.name}</h3>
                <div className="room-dept">{room.department || room.type}</div>

                {/* Telemetry info row */}
                <div className="telemetry-row">
                  <div className="telemetry-pill">
                    <span>Occupancy:</span>
                    <strong>{room.people} / {room.capacity}</strong>
                  </div>
                  <div className="telemetry-pill">
                    <span>Lighting Load:</span>
                    <strong>{room.lightKw.toFixed(2)} kW</strong>
                  </div>
                  <div className="telemetry-pill">
                    <span>Room Demand:</span>
                    <strong>{fmt(currentTotalKw, 2)} kW</strong>
                  </div>
                </div>

                {/* Inline Alert / Explanation */}
                {room.critical ? (
                  <div className="lock-explanation">
                    <ShieldCheck size={14} />
                    <span>Clinical safety protocol: Lighting adjustments locked for intensive patient safety.</span>
                  </div>
                ) : isUnoccupiedOn ? (
                  <div className="setback-explanation">
                    <Lightbulb size={14} />
                    <span>Unoccupied room with lights active. Manual setback recommended.</span>
                  </div>
                ) : null}
              </div>

              {/* Controls Footer */}
              <div className="matrix-card-footer">
                <div className="switch-control-area">
                  <span className="switch-state-label">
                    Light Status: <strong>{room.lightOn ? 'ACTIVE (ON)' : 'STANDBY (OFF)'}</strong>
                  </span>
                  <button
                    className={`prominent-light-switch ${room.lightOn ? 'on' : 'off'} ${room.critical ? 'locked' : ''}`}
                    onClick={() => {
                      if (!room.critical) {
                        updateRoom(room.id, r => ({ ...r, lightOn: !r.lightOn }));
                      }
                    }}
                    disabled={room.critical}
                    title={room.critical ? 'Clinical safety restriction' : `Toggle light ${room.lightOn ? 'OFF' : 'ON'}`}
                  >
                    <Power size={15} />
                    <span>{room.lightOn ? 'Turn OFF' : 'Turn ON'}</span>
                  </button>
                </div>

                <button 
                  className="btn-link-twin"
                  onClick={() => onInspectInTwin(room)}
                  title="Inspect room in 3D digital twin"
                >
                  <Eye size={14} />
                  <span>3D View</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
