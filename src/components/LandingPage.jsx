import React, { useState } from 'react';
import {
  Building2, PanelsTopLeft, Zap, Droplets, Sprout, ShieldCheck,
  AlertTriangle, ChevronRight, ArrowRight, ExternalLink, Activity,
  Users, Sun, Wind, CheckCircle2, Maximize2, RotateCcw,
  Leaf, Radio, FileText, Recycle, SlidersHorizontal, ArrowUpRight,
  BarChart3, Layers, Info, Lightbulb
} from 'lucide-react';
import { floors, sustainabilityDefaults } from '../data/hospitalData.js';

const fmt = (n, digits = 1) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export default function LandingPage({ onExploreTwin, rooms = [], totals = {} }) {
  // Derived calculations for preview cards
  const lightingDemand = rooms.reduce((s, r) => s + (r.lightOn ? (r.lightKw || 0.6) : 0), 0);
  const hvacDemand = rooms.reduce((s, r) => s + (r.hvacMode === 'Running' ? (r.hvacKw || 1.8) : r.hvacMode === 'Eco' ? (r.hvacKw || 1.8) * 0.65 : (r.hvacKw || 1.8) * 0.12), 0);
  const totalDemand = totals.power || (lightingDemand + hvacDemand + 25);
  const estimatedDailyKwh = totalDemand * 14.5;
  const estimatedDailyCarbon = estimatedDailyKwh * (sustainabilityDefaults.gridEmissionFactor || 0.70);
  const offlineDevices = (rooms || []).flatMap(r => (r.devices || []).filter(d => !d.online));

  const keyCapabilities = [
    {
      num: '01',
      icon: PanelsTopLeft,
      title: '3D Hospital Digital Twin',
      desc: 'Explore the 4-level architectural shell of CDSIMER with realistic floor cutaways, classical colonnade facade, rooftop solar array, and 360° interactive room walkthroughs.',
      action: () => onExploreTwin('GF', 'twin'),
      actionLabel: 'Launch 3D Model',
      tag: 'Interactive WebGL'
    },
    {
      num: '02',
      icon: Layers,
      title: '40 Monitored Clinical & Operational Zones',
      desc: 'Inspect real-time headcounts, bed occupancy, manual lighting toggles, and thermal comfort eco-modes across all 40 verified and provisional clinical zones with safety locks.',
      action: () => onExploreTwin('GF', 'zones'),
      actionLabel: 'View Monitored Zones',
      tag: 'Real-Time Control'
    },
    {
      num: '03',
      icon: Sun,
      title: 'Live Solar & Decarbonization Intelligence',
      desc: 'Live solar irradiance fetched directly from Open-Meteo API for CDSIMER coordinates (12.6394° N, 77.4475° E), proposed 180 kWp rooftop solar array output, and power flow diagram.',
      action: () => onExploreTwin('GF', 'energy'),
      actionLabel: 'Inspect Energy & Solar',
      tag: 'Live Telemetry'
    },
    {
      num: '04',
      icon: Sprout,
      title: 'Decarbonization & Resource Efficiency',
      desc: 'Structured 5-step what-if simulation sandbox: evaluate automated setback in unoccupied rooms, low-flow plumbing, paperless EMR digitization, and biomedical waste audits.',
      action: () => onExploreTwin('GF', 'insights'),
      actionLabel: 'Open Scenarios',
      tag: 'Scenario Sandbox'
    }
  ];

  return (
    <div className="landing-root">
      {/* Top Banner: Facility Digital Twin Distinction */}
      <div className="facility-top-banner">
        <div className="banner-inner">
          <span className="badge-pill pulse"><span className="pulse-dot-inner" /> FACILITY DIGITAL TWIN</span>
          <span className="banner-text">
            Interactive facility operations & decarbonization platform for Dr. Chandramma Dayananda Sagar Institute of Medical Education and Research.
          </span>
          <a
            href="https://www.cdsimer.edu.in/hospital"
            target="_blank"
            rel="noopener noreferrer"
            className="banner-link"
          >
            Official CDSIMER Portal <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="landing-header">
        <div className="landing-nav-container">
          <div className="landing-brand">
            <div className="brand-logo-badge">
              <Leaf size={22} />
            </div>
            <div className="brand-titles">
              <span className="brand-name">CDsimerEcoTwin</span>
              <span className="brand-sub">GREEN HOSPITAL DIGITAL TWIN</span>
            </div>
          </div>

          <nav className="landing-nav-links">
            <a href="#about" className="nav-link">About CDSIMER</a>
            <a href="#capabilities" className="nav-link">Key Capabilities</a>
            <a href="#dashboard-preview" className="nav-link">Facility Telemetry</a>
            <a href="#architecture" className="nav-link">Architecture</a>
          </nav>

          <div className="landing-nav-actions">
            <button
              onClick={() => onExploreTwin('GF', 'twin')}
              className="btn-launch-primary"
              id="header-explore-btn"
            >
              <PanelsTopLeft size={16} />
              <span>Open Digital Twin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" id="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="eyebrow-chip"><Building2 size={13} /> HEALTHCARE FACILITY DIGITAL TWIN</span>
              <span className="eyebrow-location">Bengaluru South District, Karnataka</span>
            </div>

            <h1 className="hero-headline">
              A Hospital You Can Explore.<br />
              <span className="highlight-text">A Future You Can Optimize.</span>
            </h1>

            <p className="hero-subtext">
              An interactive 3D digital twin of CDSIMER hospital. Monitor simulated room telemetries, evaluate rooftop solar contribution, and explore decarbonization pathways across 40 clinical and operational zones.
            </p>

            <div className="hero-cta-group">
              <button
                onClick={() => onExploreTwin('GF', 'twin')}
                className="btn-hero-primary"
                id="hero-explore-btn"
              >
                <PanelsTopLeft size={18} />
                <span>Open Digital Twin</span>
                <ArrowRight size={17} />
              </button>
              <button
                onClick={() => onExploreTwin('GF', 'zones')}
                className="btn-hero-secondary"
              >
                <Layers size={17} />
                <span>Room & Zone Operations</span>
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="hero-metrics-strip">
              <div className="hero-stat-item">
                <span className="hero-stat-num">4</span>
                <span className="hero-stat-label">Modelled Levels (GF–F3)</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat-item">
                <span className="hero-stat-num">40</span>
                <span className="hero-stat-label">Monitored Zones</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat-item">
                <span className="hero-stat-num">180 kWp</span>
                <span className="hero-stat-label">Proposed Solar PV</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat-item">
                <span className="hero-stat-num">Live Solar</span>
                <span className="hero-stat-label">Open-Meteo Feed</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Preview Showcase: High-Res Static 3D Model Render */}
          <div className="hero-preview-showcase">
            <div className="preview-card-wrapper">
              <div className="preview-card-header">
                <div className="preview-model-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px', color: '#133526' }}>
                  <Building2 size={16} color="#C5A04F" />
                  <span>CDSIMER 3D Architectural Model</span>
                  <span className="live-tag" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>40 Zones</span>
                </div>

                <button
                  onClick={() => onExploreTwin('GF', 'twin')}
                  className="preview-expand-btn"
                  title="Open interactive 3D digital twin"
                >
                  <span>Open Full Twin</span>
                  <Maximize2 size={13} />
                </button>
              </div>

              <div className="preview-viewport static-render-frame" style={{ position: 'relative', overflow: 'hidden', borderRadius: '0 0 12px 12px' }}>
                <img
                  src="/images/cdsimer-model-preview.jpg"
                  alt="CDSIMER Hospital 3D Digital Twin Architectural Model Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                />

                <div className="render-overlay-badge" style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(255, 255, 255, 0.94)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d8e5dc',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#166e51',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <span>Procedural 3D Model · Classical Colonnade · Rooftop Solar Panels · 4 Floors</span>
                </div>

                <div className="render-action-overlay" style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  zIndex: 5
                }}>
                  <button
                    onClick={() => onExploreTwin('GF', 'twin')}
                    className="btn-launch-primary"
                    style={{
                      background: '#166e51',
                      color: '#ffffff',
                      boxShadow: '0 4px 14px rgba(22, 110, 81, 0.4)',
                      padding: '10px 18px',
                      fontSize: '13px',
                      fontWeight: 700,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                  >
                    <PanelsTopLeft size={16} />
                    <span>Launch 3D Twin</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About CDSIMER Section (Fact-Checked Grounding) */}
      <section className="landing-section section-about" id="about">
        <div className="section-container">
          <div className="section-header-block">
            <div className="section-eyebrow">INSTITUTIONAL FOUNDATION</div>
            <h2 className="section-title">About CDSIMER</h2>
            <p className="section-subtitle">
              Grounding our digital twin in the real architectural and medical mission of Dr. Chandramma Dayananda Sagar Institute of Medical Education and Research.
            </p>
          </div>

          <div className="about-grid">
            <div className="about-main-card">
              <div className="institution-badge">
                <Building2 size={24} />
                <div>
                  <h3>Dr. Chandramma Dayananda Sagar Institute of Medical Education and Research (CDSIMER)</h3>
                  <span className="institution-tag">Premier Medical Institution & Teaching Hospital</span>
                </div>
              </div>

              <div className="institution-details">
                <div className="detail-item">
                  <span className="detail-label">Campus Location</span>
                  <strong className="detail-value">Deverakaggalahalli, Kanakapura Road, Bengaluru South District, Karnataka, India</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Institutional Context</span>
                  <p className="detail-text">
                    Established under the aegis of Dayananda Sagar University, CDSIMER provides integrated medical education, community outreach, and tertiary clinical care across a state-of-the-art multi-acre healthcare campus.
                  </p>
                </div>
              </div>

              <div className="hospital-services-block">
                <div className="services-heading">Core Hospital Clinical Services:</div>
                <div className="services-chips-grid">
                  <div className="service-chip"><CheckCircle2 size={14} /> Outpatient Care (OPD)</div>
                  <div className="service-chip"><CheckCircle2 size={14} /> Inpatient Wards & Nursing</div>
                  <div className="service-chip"><CheckCircle2 size={14} /> 24/7 Emergency & Trauma</div>
                  <div className="service-chip"><CheckCircle2 size={14} /> Intensive Care (ICU / NICU)</div>
                  <div className="service-chip"><CheckCircle2 size={14} /> Diagnostic Pathology & Labs</div>
                  <div className="service-chip"><CheckCircle2 size={14} /> Advanced Radiology & Imaging</div>
                </div>
              </div>

              <div className="about-source-bar">
                <div className="source-info">
                  <Info size={16} />
                  <span>Institutional facts referenced from the official CDSIMER portal</span>
                </div>
                <a
                  href="https://www.cdsimer.edu.in/hospital"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-external-source"
                >
                  Visit Official Website <ArrowUpRight size={15} />
                </a>
              </div>
            </div>

            <div className="about-context-card">
              <div className="context-card-header">
                <ShieldCheck size={22} className="shield-icon" />
                <h3>Facility Modeling & Telemetry Transparency</h3>
              </div>
              <p className="context-card-body">
                CDsimerEcoTwin visualizes the campus building shell, central atrium, and four operational floors based on campus display-board floor plans and exterior elevation documentation.
              </p>
              <div className="facility-commitments">
                <div className="commitment-item">
                  <div className="commit-dot" />
                  <div>
                    <strong>Simulated Telemetry Baseline:</strong> Electrical kilowatt loads, water flow rates, and occupancy numbers are calibrated simulation values configured for facility decarbonization modeling.
                  </div>
                </div>
                <div className="commitment-item">
                  <div className="commit-dot" />
                  <div>
                    <strong>Decarbonization Sandbox:</strong> An independent operational tool to model energy conservation, rooftop solar integration, low-flow fixtures, and paperless clinical workflows.
                  </div>
                </div>
                <div className="commitment-item">
                  <div className="commit-dot" />
                  <div>
                    <strong>Proposed Equipment Disclosure:</strong> Rooftop solar PV (180 kWp) is modeled as a proposed green installation to estimate clean generation potential under Bengaluru solar conditions.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Key Platform Capabilities */}
      <section className="landing-section section-features" id="capabilities">
        <div className="section-container">
          <div className="section-header-block">
            <div className="section-eyebrow">CORE CAPABILITIES</div>
            <h2 className="section-title">Healthcare Facility Intelligence</h2>
            <p className="section-subtitle">
              Four unified modules engineered to support hospital operations, decarbonization, and clinical safety.
            </p>
          </div>

          <div className="capabilities-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {keyCapabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div className="cap-card" key={cap.num} style={{ background: '#ffffff', border: '1px solid #e2ece5', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="cap-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div className="cap-icon-box" style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eff7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166e51' }}>
                        <Icon size={22} />
                      </div>
                      <span className="cap-status-pill" style={{ fontSize: '11px', fontWeight: 700, color: '#166e51', background: '#e0f2fe', padding: '4px 10px', borderRadius: '20px' }}>
                        {cap.tag}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#C5A04F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Capability {cap.num}</span>
                    <h3 className="cap-title" style={{ fontSize: '18px', fontWeight: 700, color: '#133526', margin: '6px 0 10px' }}>{cap.title}</h3>
                    <p className="cap-desc" style={{ fontSize: '13px', lineHeight: 1.6, color: '#526b5d' }}>{cap.desc}</p>
                  </div>

                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #edf4ef' }}>
                    <button
                      onClick={cap.action}
                      style={{
                        background: '#eff7f2',
                        color: '#166e51',
                        border: '1px solid #c2e2cf',
                        borderRadius: '6px',
                        padding: '8px 14px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        width: '100%',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#166e51'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#eff7f2'; e.currentTarget.style.color = '#166e51'; }}
                    >
                      <span>{cap.actionLabel}</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Facility Telemetry Preview (6 Streamlined Cards) */}
      <section className="landing-section section-dashboard" id="dashboard-preview">
        <div className="section-container">
          <div className="section-header-block">
            <div className="section-eyebrow">FACILITY TELEMETRY</div>
            <h2 className="section-title">Sustainability Telemetry Preview</h2>
            <p className="section-subtitle">
              Simulated real-time indicators across electrical demand, water stewardship, digital EMR, and carbon intensity.
            </p>
          </div>

          <div className="dashboard-cards-grid">
            {/* 1. Electricity Usage */}
            <div className="dash-card">
              <div className="dash-card-top">
                <div className="dash-icon-wrap amber"><Zap size={20} /></div>
                <span className="dash-tag">SIMULATED DEMO</span>
              </div>
              <div className="dash-label">Instantaneous Electrical Demand</div>
              <div className="dash-value-row">
                <span className="dash-value">{fmt(totalDemand, 1)}</span>
                <span className="dash-unit">kW</span>
              </div>
              <div className="dash-breakdown">
                <div className="breakdown-item">
                  <span>Lighting load:</span> <strong>{fmt(lightingDemand, 2)} kW</strong>
                </div>
                <div className="breakdown-item">
                  <span>HVAC load:</span> <strong>{fmt(hvacDemand, 2)} kW</strong>
                </div>
              </div>
              <div className="dash-foot">
                Projected ~{fmt(estimatedDailyKwh, 0)} kWh/day across 40 monitored zones
              </div>
            </div>

            {/* 2. Water Consumption */}
            <div className="dash-card">
              <div className="dash-card-top">
                <div className="dash-icon-wrap blue"><Droplets size={20} /></div>
                <span className="dash-tag">WATER STEWARDSHIP</span>
              </div>
              <div className="dash-label">Potable Water Flow Rate</div>
              <div className="dash-value-row">
                <span className="dash-value">{fmt(rooms.reduce((s, r) => s + (r.waterLph || 0), 0), 0)}</span>
                <span className="dash-unit">L/h</span>
              </div>
              <div className="dash-breakdown">
                <div className="breakdown-item">
                  <span>Daily total:</span> <strong>{fmt(sustainabilityDefaults.waterLitresPerDay || 28000, 0)} L/day</strong>
                </div>
                <div className="breakdown-item">
                  <span>Conservation goal:</span> <strong>-25% low-flow fixtures</strong>
                </div>
              </div>
              <div className="dash-foot">
                Baseline water draw across clinical and outpatient wings
              </div>
            </div>

            {/* 3. Room Occupancy */}
            <div className="dash-card">
              <div className="dash-card-top">
                <div className="dash-icon-wrap green"><Users size={20} /></div>
                <span className="dash-tag">OCCUPANCY SENSING</span>
              </div>
              <div className="dash-label">Monitored Zone Occupancy</div>
              <div className="dash-value-row">
                <span className="dash-value">{totals.people || 42}</span>
                <span className="dash-unit">occupants</span>
              </div>
              <div className="dash-breakdown">
                <div className="breakdown-item">
                  <span>Occupied beds:</span> <strong>{rooms.reduce((s, r) => s + (r.occupiedBeds || 0), 0)} / {rooms.reduce((s, r) => s + (r.beds || 0), 0)}</strong>
                </div>
                <div className="breakdown-item">
                  <span>Inpatient wards:</span> <strong>{rooms.filter(r => r.floorId === 'F2').length} active zones</strong>
                </div>
              </div>
              <div className="dash-foot">
                Simulated staff, patients, and clinical visitors
              </div>
            </div>

            {/* 4. Virtual Device Connectivity */}
            <div className="dash-card">
              <div className="dash-card-top">
                <div className="dash-icon-wrap mint"><Radio size={20} /></div>
                <span className="dash-tag">IoT TELEMETRY</span>
              </div>
              <div className="dash-label">Sensors & Connected Nodes</div>
              <div className="dash-value-row">
                <span className="dash-value">{totals.online || 116} / {totals.devices || 120}</span>
                <span className="dash-unit">online</span>
              </div>
              <div className="dash-breakdown">
                <div className="breakdown-item">
                  <span>Status:</span>
                  <strong className={offlineDevices.length ? 'text-amber' : 'text-green'}>
                    {offlineDevices.length ? `${offlineDevices.length} node offline` : 'All nodes healthy'}
                  </strong>
                </div>
                <div className="breakdown-item">
                  <span>Mesh protocol:</span> <strong>Simulated MQTT</strong>
                </div>
              </div>
              <div className="dash-foot">
                Monitors temperature, lighting state, and air exchange sensors
              </div>
            </div>

            {/* 5. Paperless EMR & Digital Records */}
            <div className="dash-card">
              <div className="dash-card-top">
                <div className="dash-icon-wrap mint"><FileText size={20} /></div>
                <span className="dash-tag">CIRCULARITY</span>
              </div>
              <div className="dash-label">Digital Health Records</div>
              <div className="dash-value-row">
                <span className="dash-value">70%</span>
                <span className="dash-unit">paperless</span>
              </div>
              <div className="dash-breakdown">
                <div className="breakdown-item">
                  <span>Sheets avoided:</span> <strong>840 /day</strong>
                </div>
                <div className="breakdown-item">
                  <span>Trees conserved:</span> <strong>~37 trees/yr</strong>
                </div>
              </div>
              <div className="dash-foot">
                Electronic Medical Record (EMR) digitization avoids physical chart handling
              </div>
            </div>

            {/* 6. Estimated Carbon Emissions */}
            <div className="dash-card">
              <div className="dash-card-top">
                <div className="dash-icon-wrap teal"><Sprout size={20} /></div>
                <span className="dash-tag">CARBON TRACKING</span>
              </div>
              <div className="dash-label">Grid Carbon Emissions</div>
              <div className="dash-value-row">
                <span className="dash-value">{fmt(estimatedDailyCarbon, 0)}</span>
                <span className="dash-unit">kg CO₂e/day</span>
              </div>
              <div className="dash-breakdown">
                <div className="breakdown-item">
                  <span>Grid factor:</span> <strong>0.70 kg CO₂e/kWh</strong>
                </div>
                <div className="breakdown-item">
                  <span>Solar offset potential:</span> <strong>~180 kWp array</strong>
                </div>
              </div>
              <div className="dash-foot">
                Based on Karnataka CEA grid emission intensity benchmarks
              </div>
            </div>
          </div>

          <div className="dashboard-cta-bar">
            <div className="cta-bar-copy">
              <strong>Inspect and control simulated room systems directly</strong>
              <span>Switch lighting, toggle HVAC eco-modes, and observe immediate kW and carbon responses in the 3D twin.</span>
            </div>
            <button
              onClick={() => onExploreTwin('GF', 'zones')}
              className="btn-launch-primary"
            >
              Open Room & Zone Operations <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Platform Architecture */}
      <section className="landing-section section-architecture" id="architecture">
        <div className="section-container">
          <div className="section-header-block">
            <div className="section-eyebrow">SYSTEM PIPELINE</div>
            <h2 className="section-title">Platform Architecture & Data Pipeline</h2>
            <p className="section-subtitle">
              A transparent view of how architectural spatial models combine with operational simulations and live meteorological data.
            </p>
          </div>

          <div className="pipeline-flow-wrapper">
            <div className="pipeline-steps">
              <div className="pipeline-step">
                <div className="step-circle">1</div>
                <div className="step-icon"><Building2 size={20} /></div>
                <h4>3D Campus Geometry</h4>
                <p>Procedural Three.js model aligned with architectural floor plans & elevations</p>
              </div>

              <div className="pipeline-arrow"><ArrowRight size={18} /></div>

              <div className="pipeline-step">
                <div className="step-circle">2</div>
                <div className="step-icon"><Activity size={20} /></div>
                <h4>Simulated Zone States</h4>
                <p>Occupancy, lighting kW, HVAC status, and IoT sensor telemetry</p>
              </div>

              <div className="pipeline-arrow"><ArrowRight size={18} /></div>

              <div className="pipeline-step">
                <div className="step-circle">3</div>
                <div className="step-icon"><Sun size={20} /></div>
                <h4>Open-Meteo Solar API</h4>
                <p>Live solar irradiance & weather for CDSIMER coordinates (12.6394° N, 77.4475° E)</p>
              </div>

              <div className="pipeline-arrow"><ArrowRight size={18} /></div>

              <div className="pipeline-step">
                <div className="step-circle">4</div>
                <div className="step-icon"><Zap size={20} /></div>
                <h4>Decarbonization Analytics</h4>
                <p>Real-time power summing, solar offset, avoided carbon, and cost projections</p>
              </div>

              <div className="pipeline-arrow"><ArrowRight size={18} /></div>

              <div className="pipeline-step">
                <div className="step-circle">5</div>
                <div className="step-icon"><Sprout size={20} /></div>
                <h4>What-If Sandbox</h4>
                <p>Automated setbacks, water aerators, EMR paperless charts, and waste audits</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final Hero */}
      <section className="landing-cta-banner">
        <div className="section-container">
          <div className="cta-banner-content">
            <span className="banner-eyebrow">INTERACTIVE TWIN WORKSPACE</span>
            <h2>Ready to inspect CDSIMER’s virtual spaces?</h2>
            <p>
              Launch the 3D digital twin to explore floor cutaways, inspect individual clinical rooms, toggle environmental controls, and evaluate decarbonization scenarios.
            </p>
            <div className="cta-button-row">
              <button
                onClick={() => onExploreTwin('GF', 'twin')}
                className="btn-hero-primary large"
              >
                <PanelsTopLeft size={20} />
                <span>Launch 3D Digital Twin</span>
                <ArrowRight size={19} />
              </button>
              <button
                onClick={() => onExploreTwin('GF', 'zones')}
                className="btn-hero-secondary large"
              >
                <Layers size={18} />
                <span>Explore 40 Monitored Zones</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="section-container">
          <div className="footer-top-grid">
            <div className="footer-brand-col">
              <div className="footer-brand">
                <div className="brand-logo-badge small">
                  <Leaf size={18} />
                </div>
                <div>
                  <strong>CDsimerEcoTwin</strong>
                  <span className="tagline">Healthcare Facility Digital Twin & Decarbonization Platform</span>
                </div>
              </div>
              <p className="footer-summary">
                A facility digital twin platform developed to evaluate architectural 3D modeling, room-level resource simulation, and hospital decarbonization pathways.
              </p>
            </div>

            <div className="footer-links-col">
              <h4>Platform Navigation</h4>
              <ul>
                <li><a href="#about">About CDSIMER</a></li>
                <li><a href="#capabilities">Core Capabilities</a></li>
                <li><a href="#dashboard-preview">Facility Telemetry</a></li>
                <li><a href="#architecture">Data Pipeline</a></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Digital Twin Views</h4>
              <ul>
                <li><button onClick={() => onExploreTwin('GF', 'facility-overview')} className="footer-action-link">Facility Overview</button></li>
                <li><button onClick={() => onExploreTwin('GF', 'twin')} className="footer-action-link">3D Hospital Twin</button></li>
                <li><button onClick={() => onExploreTwin('GF', 'zones')} className="footer-action-link">Room & Zone Operations</button></li>
                <li><button onClick={() => onExploreTwin('GF', 'energy')} className="footer-action-link">Energy, Solar & Carbon</button></li>
                <li><button onClick={() => onExploreTwin('GF', 'resources')} className="footer-action-link">Water & Materials</button></li>
                <li><button onClick={() => onExploreTwin('GF', 'insights')} className="footer-action-link">Sustainability Insights</button></li>
                <li><button onClick={() => onExploreTwin('GF', 'alerts')} className="footer-action-link">Alerts & Events</button></li>
                <li><button onClick={() => onExploreTwin('GF', 'reports')} className="footer-action-link">Audit Reports</button></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Official Institution</h4>
              <p className="footer-address">
                <strong>CDSIMER</strong><br />
                Deverakaggalahalli, Kanakapura Road,<br />
                Bengaluru South District, Karnataka, India
              </p>
              <a
                href="https://www.cdsimer.edu.in/hospital"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-external-link"
              >
                cdsimer.edu.in/hospital <ExternalLink size={13} />
              </a>
            </div>
          </div>

          <div className="footer-disclaimer-box">
            <div className="disclaimer-header">
              <AlertTriangle size={16} />
              <span>FACILITY SIMULATION & DATA DISCLOSURE</span>
            </div>
            <p className="disclaimer-content">
              CDsimerEcoTwin is an interactive facility operations digital twin. Room telemetries and resource calculations are simulated for decarbonization modeling and planning. It is an independent platform and not an official physical BMS connection.
            </p>
          </div>

          <div className="footer-bottom-bar">
            <span>© {new Date().getFullYear()} CDsimerEcoTwin. All rights reserved.</span>
            <span>Dr. Chandramma Dayananda Sagar Institute of Medical Education and Research (CDSIMER)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
