import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap, Sun, Wind, Cloud, ShieldCheck, AlertTriangle,
  RotateCcw, ArrowRight, Gauge, CheckCircle2, Info, Building2,
  Eye, ChevronRight, Activity, Thermometer, IndianRupee, Clock,
  RefreshCw, BatteryCharging, ArrowDownRight, Layers, Sliders
} from 'lucide-react';
import {
  calculateEnergyMetrics,
  getVentilationClassification,
  SUSTAINABILITY_CONSTANTS
} from '../../data/sustainabilityEngine.js';

const fmt = (n, digits = 1) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export default function EnergyCarbonDashboard({
  rooms = [],
  updateRoom = () => {},
  sustainabilityParams = {},
  updateSustainabilityParam = () => {},
  onNavigateToRoom = () => {},
}) {
  const [selectedFloorTab, setSelectedFloorTab] = useState('ALL');
  const [hvacFilter, setHvacFilter] = useState('ALL');
  const [pvCapacityKw, setPvCapacityKw] = useState(180.0); // Proposed 180 kWp rooftop solar PV array
  const [inverterEfficiency, setInverterEfficiency] = useState(0.96); // 96% string inverter efficiency
  const [profileMetric, setProfileMetric] = useState('kw'); // 'kw' (Power) | 'kwh' (Accumulated Energy)

  // Live weather & solar irradiance state from Open-Meteo
  const [liveWeather, setLiveWeather] = useState({
    loading: true,
    error: null,
    temperature: 27.5,
    directNormalIrradiance: 330, // W/m²
    diffuseRadiation: 370, // W/m²
    shortwaveRadiation: 660, // W/m²
    isDay: 1,
    cloudCover: 35,
    observationTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    observationDate: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
  });

  const fetchLiveSolar = async () => {
    setLiveWeather(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=12.6394&longitude=77.4475&current=temperature_2m,direct_normal_irradiance,diffuse_radiation,shortwave_radiation,is_day,cloud_cover&timezone=Asia%2FKolkata'
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data && data.current) {
        setLiveWeather({
          loading: false,
          error: null,
          temperature: data.current.temperature_2m ?? 27.5,
          directNormalIrradiance: data.current.direct_normal_irradiance ?? 330,
          diffuseRadiation: data.current.diffuse_radiation ?? 370,
          shortwaveRadiation: data.current.shortwave_radiation ?? 660,
          isDay: data.current.is_day ?? 1,
          cloudCover: data.current.cloud_cover ?? 35,
          observationTime: new Date(data.current.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          observationDate: new Date(data.current.time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
        });
      }
    } catch (err) {
      console.warn('Could not fetch live Open-Meteo solar data, falling back to diurnal baseline:', err);
      setLiveWeather(prev => ({
        ...prev,
        loading: false,
        error: 'Offline fallback (local diurnal model active)',
        observationTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        observationDate: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      }));
    }
  };

  useEffect(() => {
    fetchLiveSolar();
    const interval = setInterval(fetchLiveSolar, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  // Tariffs & Macro parameters
  const electricityTariff = sustainabilityParams.electricityTariff ?? SUSTAINABILITY_CONSTANTS.DEFAULT_ELECTRICITY_TARIFF; // ₹8.50/kWh
  const gridEmissionFactor = sustainabilityParams.gridEmissionFactor ?? SUSTAINABILITY_CONSTANTS.DEFAULT_GRID_EMISSION_FACTOR; // 0.70 kg CO2e/kWh

  // 1. Calculate live energy metrics across all 40 rooms
  const energyMetrics = useMemo(() => {
    return calculateEnergyMetrics(rooms, { electricityTariff, gridEmissionFactor });
  }, [rooms, electricityTariff, gridEmissionFactor]);

  // Current Instantaneous Electrical Demand
  const buildingDemandKw = energyMetrics.totalInstantKw;

  // Instantaneous Solar Generation based on live solar irradiance
  // Standard Test Condition (STC) = 1000 W/m²
  const currentSolarKw = useMemo(() => {
    if (!liveWeather.isDay) return 0;
    const globalRadiation = liveWeather.shortwaveRadiation > 0
      ? liveWeather.shortwaveRadiation
      : (liveWeather.directNormalIrradiance + liveWeather.diffuseRadiation);
    // Solar kW = Capacity * (Radiation / 1000) * Inverter Efficiency
    const estimated = pvCapacityKw * (globalRadiation / 1000) * inverterEfficiency;
    return Math.max(0, Math.min(pvCapacityKw * 0.98, estimated));
  }, [liveWeather, pvCapacityKw, inverterEfficiency]);

  // Solar self-consumption vs grid import
  const solarConsumedKw = Math.min(currentSolarKw, buildingDemandKw);
  const gridImportKw = Math.max(0, buildingDemandKw - solarConsumedKw);
  const solarContributionPct = buildingDemandKw > 0
    ? ((solarConsumedKw / buildingDemandKw) * 100).toFixed(1)
    : '0.0';

  // Diurnal solar curve calculation for single 24-hour demand vs generation chart
  const getSolarPowerAtHour = (hour) => {
    if (hour < 6 || hour > 18) return 0;
    const solarFactor = Math.sin(((hour - 6) / 12) * Math.PI);
    const cloudFactor = 1 - (liveWeather.cloudCover / 100) * 0.45;
    return pvCapacityKw * Math.pow(solarFactor, 1.35) * cloudFactor * inverterEfficiency;
  };

  // 24-hour hourly profile data for single chart
  const hourlyProfile = useMemo(() => {
    const list = [];
    for (let h = 0; h < 24; h++) {
      const solar = getSolarPowerAtHour(h);
      const opdFactor = (h >= 8 && h <= 17) ? 1.15 : (h >= 22 || h <= 5) ? 0.85 : 1.0;
      const demand = buildingDemandKw * opdFactor;
      const grid = Math.max(0, demand - solar);
      list.push({
        hour: `${String(h).padStart(2, '0')}:00`,
        hourNum: h,
        solarKw: Number(solar.toFixed(1)),
        demandKw: Number(demand.toFixed(1)),
        gridKw: Number(grid.toFixed(1)),
      });
    }
    return list;
  }, [pvCapacityKw, buildingDemandKw, inverterEfficiency, liveWeather.cloudCover]);

  // Daily energy sums
  const dailySolarKwh = useMemo(() => {
    return hourlyProfile.reduce((acc, p) => acc + p.solarKw, 0);
  }, [hourlyProfile]);

  const dailyDemandKwh = energyMetrics.grossDailyKwh;
  const dailyGridImportKwh = Math.max(0, dailyDemandKwh - dailySolarKwh);

  const dailyAvoidedCo2Kg = dailySolarKwh * gridEmissionFactor;
  const dailyNetCo2Kg = dailyGridImportKwh * gridEmissionFactor;
  const dailyCost = dailyDemandKwh * electricityTariff;
  const dailySolarSavingsInr = dailySolarKwh * electricityTariff;

  // Filtered rooms for zone telemetry table
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const matchFloor = selectedFloorTab === 'ALL' || r.floorId === selectedFloorTab;
      const matchHvac = hvacFilter === 'ALL' || r.hvacMode === hvacFilter;
      return matchFloor && matchHvac;
    });
  }, [rooms, selectedFloorTab, hvacFilter]);

  const maxProfileKw = Math.max(...hourlyProfile.map(p => p.demandKw), pvCapacityKw, 10);

  return (
    <div className="page-stack">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="eyebrow">SUSTAINABILITY INTELLIGENCE · ENERGY, SOLAR & CARBON</div>
          <h1>Energy, Solar & Carbon Telemetry</h1>
          <p>
            Real-time hospital electrical demand, live rooftop solar generation based on CDSIMER geographic conditions, and clean grid decarbonization.
          </p>
        </div>

        {/* Live Weather & Solar Irradiance Badge */}
        <div className="calculation-badge" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sun size={15} color="#C5A04F" />
            <span>
              <strong>CDSIMER Campus (12.639° N, 77.447° E)</strong> · 
              {liveWeather.error ? (
                <span style={{ color: '#b45309' }}> Live irradiance service offline (diurnal model active)</span>
              ) : (
                <>
                  {' '}Live Irradiance: <strong>{liveWeather.directNormalIrradiance.toFixed(0)} W/m²</strong> (Observed at {liveWeather.observationTime} IST via Open-Meteo) · {liveWeather.isDay ? '☀️ Daylight' : '🌙 Night'} ({liveWeather.temperature.toFixed(1)}°C)
                </>
              )}
            </span>
          </div>
          <button
            onClick={fetchLiveSolar}
            title="Refresh live Open-Meteo solar data"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#166e51',
              display: 'flex',
              alignItems: 'center',
              padding: '2px'
            }}
            aria-label="Refresh solar data"
          >
            <RefreshCw size={13} className={liveWeather.loading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon amber"><Zap size={18} /></div>
          <div className="stat-copy">
            <div className="stat-label">Current Hospital Demand</div>
            <div className="stat-number">{fmt(buildingDemandKw)} <span>kW</span></div>
            <div className="stat-detail">Instantaneous sum of all 40 monitored zones</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon gold"><Sun size={18} /></div>
          <div className="stat-copy">
            <div className="stat-label">Rooftop Solar Output</div>
            <div className="stat-number">{fmt(currentSolarKw)} <span>kW</span></div>
            <div className="stat-detail">
              Modelled 180 kWp proposed array ({solarContributionPct}% offset)
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon mint"><Activity size={18} /></div>
          <div className="stat-copy">
            <div className="stat-label">Daily Solar Generation</div>
            <div className="stat-number">{fmt(dailySolarKwh, 0)} <span>kWh/day</span></div>
            <div className="stat-detail">Avoids {fmt(dailyAvoidedCo2Kg, 0)} kg CO₂e clean carbon offset</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><IndianRupee size={18} /></div>
          <div className="stat-copy">
            <div className="stat-label">Solar Financial Offset</div>
            <div className="stat-number">₹{fmt(dailySolarSavingsInr, 0)} <span>/day</span></div>
            <div className="stat-detail">~₹{fmt(dailySolarSavingsInr * 30, 0)}/mo @ ₹{electricityTariff.toFixed(2)}/kWh</div>
          </div>
        </div>
      </div>

      {/* Visual Power Flow Diagram */}
      <div className="content-card" style={{ padding: '20px', borderRadius: '12px' }}>
        <div className="section-heading" style={{ marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#133526' }}>
              ⚡ Facility Power Flow Balance
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#526b5d' }}>
              Dynamic distribution between live solar generation, string inverters, hospital loads, and utility grid import.
            </p>
          </div>
          <div style={{ fontSize: '11px', background: '#eff7f2', color: '#166e51', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
            CDSIMER Proposed 180 kWp Installation
          </div>
        </div>

        {/* Visual Flow Track */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          alignItems: 'center',
          background: '#f8faf9',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid #e2ece5'
        }}>
          {/* Node 1: Sunlight */}
          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e0eae3', textAlign: 'center' }}>
            <Sun size={20} color="#C5A04F" style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: 700 }}>SUNLIGHT IRRADIANCE</div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#133526' }}>{liveWeather.directNormalIrradiance.toFixed(0)} <small style={{ fontSize: '10px' }}>W/m²</small></div>
            <div style={{ fontSize: '10.5px', color: '#526b5d', marginTop: '2px' }}>{liveWeather.cloudCover}% cloud cover</div>
          </div>

          <div style={{ textAlign: 'center', color: '#88a896', display: 'flex', justifyContent: 'center' }}>
            <ArrowRight size={20} />
          </div>

          {/* Node 2: PV Array */}
          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e0eae3', textAlign: 'center' }}>
            <BatteryCharging size={20} color="#166e51" style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: 700 }}>ROOFTOP PV ARRAY</div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#166e51' }}>180 <small style={{ fontSize: '10px' }}>kWp</small></div>
            <div style={{ fontSize: '10.5px', color: '#526b5d', marginTop: '2px' }}>Proposed monocrystalline</div>
          </div>

          <div style={{ textAlign: 'center', color: '#88a896', display: 'flex', justifyContent: 'center' }}>
            <ArrowRight size={20} />
          </div>

          {/* Node 3: Inverter */}
          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e0eae3', textAlign: 'center' }}>
            <Gauge size={20} color="#0284c7" style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: 700 }}>SOLAR INVERTER</div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#0284c7' }}>{fmt(currentSolarKw)} <small style={{ fontSize: '10px' }}>kW AC</small></div>
            <div style={{ fontSize: '10.5px', color: '#526b5d', marginTop: '2px' }}>96% string efficiency</div>
          </div>

          <div style={{ textAlign: 'center', color: '#88a896', display: 'flex', justifyContent: 'center' }}>
            <ArrowRight size={20} />
          </div>

          {/* Node 4: Hospital Demand */}
          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e0eae3', textAlign: 'center' }}>
            <Building2 size={20} color="#b45309" style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: 700 }}>HOSPITAL LOADS</div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#b45309' }}>{fmt(buildingDemandKw)} <small style={{ fontSize: '10px' }}>kW</small></div>
            <div style={{ fontSize: '10.5px', color: '#526b5d', marginTop: '2px' }}>40 monitored zones</div>
          </div>

          <div style={{ textAlign: 'center', color: '#88a896', display: 'flex', justifyContent: 'center' }}>
            <ArrowRight size={20} />
          </div>

          {/* Node 5: Grid Import */}
          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e0eae3', textAlign: 'center' }}>
            <Zap size={20} color={gridImportKw > 0 ? '#dc2626' : '#166e51'} style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: 700 }}>GRID IMPORT</div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: gridImportKw > 0 ? '#dc2626' : '#166e51' }}>
              {fmt(gridImportKw)} <small style={{ fontSize: '10px' }}>kW</small>
            </div>
            <div style={{ fontSize: '10.5px', color: '#526b5d', marginTop: '2px' }}>BESCOM commercial utility</div>
          </div>
        </div>

        <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#718096', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={14} color="#166e51" />
          <span>
            <strong>Data Disclosure:</strong> Solar output is a modelled estimate based on CDSIMER geographic irradiance and a proposed 180 kWp rooftop array, not measured physical CDSIMER generation meters.
          </span>
        </div>
      </div>

      {/* SINGLE 24-HOUR DEMAND VS GENERATION PROFILE CHART */}
      <div className="content-card" style={{ padding: '20px', borderRadius: '12px' }}>
        <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#B88A3B', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
              CHART E · SOLAR GENERATION VERSUS BUILDING DEMAND
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0', color: '#133526' }}>
              📈 24-Hour Solar Generation vs Power Demand Profile
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#526b5d' }}>
              Comparison of modelled rooftop PV generation, building electrical load, and net utility grid import for CDSIMER campus.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Metric Toggle: kW vs kWh */}
            <div className="segmented-toggle">
              <button
                className={profileMetric === 'kw' ? 'active' : ''}
                onClick={() => setProfileMetric('kw')}
                title="Instantaneous Power (kW)"
              >
                Power (kW)
              </button>
              <button
                className={profileMetric === 'kwh' ? 'active' : ''}
                onClick={() => setProfileMetric('kwh')}
                title="Hourly Accumulated Energy (kWh)"
              >
                Energy (kWh)
              </button>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', fontSize: '12px', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#b45309', display: 'inline-block' }} />
                <span>Demand ({profileMetric.toUpperCase()})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#c5a04f', display: 'inline-block' }} />
                <span>Modelled PV ({profileMetric.toUpperCase()})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#684832', display: 'inline-block' }} />
                <span>Grid Import ({profileMetric.toUpperCase()})</span>
              </div>
            </div>
          </div>
        </div>

        {/* 24-hour visual bar/curve chart */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(24, 1fr)',
          gap: '4px',
          alignItems: 'flex-end',
          height: '220px',
          padding: '16px 8px 8px',
          background: '#faf6ee',
          borderRadius: '8px',
          border: '1px solid #e8ddc6'
        }}>
          {hourlyProfile.map(item => {
            const demandVal = profileMetric === 'kw' ? item.demandKw : item.demandKw * 1; // 1 hr step = 1 kWh/kW
            const solarVal = profileMetric === 'kw' ? item.solarKw : item.solarKw * 1;
            const gridVal = profileMetric === 'kw' ? item.gridKw : item.gridKw * 1;

            const demandHeightPct = Math.min(100, (demandVal / maxProfileKw) * 100);
            const solarHeightPct = Math.min(100, (solarVal / maxProfileKw) * 100);
            const isDaytime = item.hourNum >= 6 && item.hourNum <= 18;

            return (
              <div
                key={item.hour}
                title={`Time: ${item.hour}\nDemand: ${demandVal.toFixed(1)} ${profileMetric.toUpperCase()}\nModelled Solar: ${solarVal.toFixed(1)} ${profileMetric.toUpperCase()}\nGrid Import: ${gridVal.toFixed(1)} ${profileMetric.toUpperCase()}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  position: 'relative'
                }}
              >
                {/* Visual bar composite */}
                <div style={{ width: '100%', display: 'flex', gap: '2px', alignItems: 'flex-end', height: '100%' }}>
                  {/* Demand Bar */}
                  <div style={{
                    flex: 1,
                    height: `${demandHeightPct}%`,
                    background: '#b45309',
                    borderRadius: '2px 2px 0 0',
                    opacity: 0.85
                  }} />

                  {/* Solar Bar */}
                  <div style={{
                    flex: 1,
                    height: `${solarHeightPct}%`,
                    background: '#c5a04f',
                    borderRadius: '2px 2px 0 0',
                    opacity: 0.95
                  }} />
                </div>

                {/* X Axis Label */}
                <div style={{
                  fontSize: '9px',
                  color: isDaytime ? '#684832' : '#8c7565',
                  marginTop: '6px',
                  fontWeight: isDaytime ? 700 : 500,
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'top left',
                  whiteSpace: 'nowrap'
                }}>
                  {item.hourNum % 2 === 0 ? item.hour : ''}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '11px', color: '#684832', flexWrap: 'wrap', gap: '8px' }}>
          <span>00:00 (Midnight)</span>
          <span style={{ color: '#b45309', fontWeight: 700 }}>
            ☀️ Peak Solar Window: 10:00 – 14:00 (Max {fmt(Math.max(...hourlyProfile.map(p => p.solarKw)))} {profileMetric.toUpperCase()})
          </span>
          <span>23:00 (Night)</span>
        </div>

        <div style={{ marginTop: '12px', fontSize: '11px', color: '#8c7565', background: '#faf6ee', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e8ddc6', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={14} color="#b45309" />
          <span>
            <strong>Disclosure:</strong> Solar PV generation is labelled as <em>modelled estimate</em> for the proposed 180 kWp rooftop installation under Open-Meteo live solar irradiance, distinct from measured utility telemetry.
          </span>
        </div>
      </div>

      {/* ZONE-BY-ZONE LOAD & VENTILATION TELEMETRY TABLE */}
      <div className="content-card" style={{ padding: '20px', borderRadius: '12px' }}>
        <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#133526' }}>
              🏢 Zone-Level Electrical Load & Ventilation Matrix (40 Monitored Zones)
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#526b5d' }}>
              Inspect individual room electrical components, ventilation classification, and safety locks.
            </p>
          </div>

          {/* Floor & HVAC Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div className="alerts-filter-bar" style={{ margin: 0 }}>
              {['ALL', 'GF', 'F1', 'F2', 'F3'].map(floorId => (
                <button
                  key={floorId}
                  className={`alert-tab ${selectedFloorTab === floorId ? 'active' : ''}`}
                  onClick={() => setSelectedFloorTab(floorId)}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  {floorId === 'ALL' ? 'All Floors' : floorId}
                </button>
              ))}
            </div>

            <div className="alerts-filter-bar" style={{ margin: 0 }}>
              {['ALL', 'Running', 'Eco', 'Idle'].map(mode => (
                <button
                  key={mode}
                  className={`alert-tab ${hvacFilter === mode ? 'active' : ''}`}
                  onClick={() => setHvacFilter(mode)}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Telemetry Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="reference-comparison-table" style={{ width: '100%', fontSize: '12px' }}>
            <thead>
              <tr>
                <th>Zone ID</th>
                <th>Room Name & Department</th>
                <th>Floor</th>
                <th>Lighting (kW)</th>
                <th>HVAC Mode & Draw</th>
                <th>Ventilation Standard</th>
                <th>Critical Safety</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map(room => {
                const lightActive = room.lightOn ? (room.lightKw || 0.6) : 0;
                const hvacDraw = room.hvacMode === 'Running' ? (room.hvacKw || 1.8) : room.hvacMode === 'Eco' ? (room.hvacKw || 1.8) * 0.65 : (room.hvacKw || 1.8) * 0.12;
                const vent = getVentilationClassification(room);

                return (
                  <tr key={room.id}>
                    <td><strong>{room.id}</strong></td>
                    <td>
                      <strong>{room.name}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{room.department || room.type}</div>
                    </td>
                    <td><span className="badge-pill">{room.floorId}</span></td>
                    <td>
                      <span style={{ color: room.lightOn ? '#C5A04F' : '#94a3b8', fontWeight: 700 }}>
                        {lightActive.toFixed(2)} kW {room.lightOn ? '(ON)' : '(OFF)'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-pill ${room.hvacMode === 'Running' ? 'amber' : room.hvacMode === 'Eco' ? 'mint' : 'gray'}`}>
                        {room.hvacMode} ({hvacDraw.toFixed(2)} kW)
                      </span>
                    </td>
                    <td>
                      <small style={{ color: vent.isCritical ? '#b91c1c' : '#047857', fontWeight: 600 }}>
                        {vent.label}
                      </small>
                    </td>
                    <td>
                      {room.critical ? (
                        <span style={{ color: '#b91c1c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={13} /> Protected
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>Standard</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn-zone-inspect-jump"
                        onClick={() => onNavigateToRoom(room.id, room.floorId)}
                        title={`Inspect ${room.name} in 3D Hospital Twin`}
                        style={{
                          background: '#eff7f2',
                          color: '#166e51',
                          border: '1px solid #c2e2cf',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Eye size={12} />
                        <span>Inspect in 3D</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
