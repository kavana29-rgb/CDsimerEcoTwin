import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Realistic CDSIMER Hospital Building Exterior Re-construction
 * Authentic classical healthcare architecture matching cdsimer-exterior-reference.webp:
 * - Warm limestone cream facade
 * - 4 storeys with horizontal string cornices
 * - Ground floor arched window openings with keystones
 * - Upper floors rectangular windows with molded architraves
 * - Classical 4-column entrance portico with triangular pediment
 * - Multi-tiered grand entrance steps
 * - Plaza paving and flanking garden landscaping with low hedges
 * - Roofline balustrades and central classical roof pediment
 */

// Classical Column with Molded Base and Capital
export function ClassicalColumn({ x, y = 0, z, height = 1.7, radius = 0.22 }) {
  return (
    <group position={[x, y + height / 2, z]}>
      {/* Plinth / Square Base */}
      <mesh position={[0, -height / 2 + 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[radius * 2.6, 0.12, radius * 2.6]} />
        <meshStandardMaterial color="#ded7ca" roughness={0.7} />
      </mesh>
      {/* Torus Base Molding */}
      <mesh position={[0, -height / 2 + 0.15, 0]}>
        <cylinderGeometry args={[radius * 1.25, radius * 1.4, 0.08, 20]} />
        <meshStandardMaterial color="#ded7ca" roughness={0.7} />
      </mesh>

      {/* Main Fluted Shaft */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.95, radius * 1.05, height - 0.32, 24]} />
        <meshStandardMaterial color="#eee9df" roughness={0.65} />
      </mesh>

      {/* Classical Capital (Echinus + Abacus) */}
      <mesh position={[0, height / 2 - 0.1, 0]}>
        <cylinderGeometry args={[radius * 1.35, radius * 1.05, 0.1, 20]} />
        <meshStandardMaterial color="#ded7ca" roughness={0.7} />
      </mesh>
      <mesh position={[0, height / 2 - 0.03, 0]} castShadow>
        <boxGeometry args={[radius * 2.7, 0.08, radius * 2.7]} />
        <meshStandardMaterial color="#ded7ca" roughness={0.7} />
      </mesh>
    </group>
  );
}

// Classical Triangular Pediment
export function ClassicalPediment({ x = 0, y = 0, z = 0, width = 8.4, height = 1.35, depth = 0.28 }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, height);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2,
    });
  }, [width, height, depth]);

  return (
    <mesh geometry={geometry} position={[x, y, z]} castShadow>
      <meshStandardMaterial color="#eee8dc" roughness={0.68} />
    </mesh>
  );
}

// Ground Floor Arched Window (Prominent in CDSIMER photograph)
export function ArchedFacadeWindow({ x, y, z, width = 0.76, height = 1.05, isSelectedFloor }) {
  return (
    <group position={[x, y, z]}>
      {/* Molded Surround Wall Recess */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[width + 0.18, height + 0.18, 0.08]} />
        <meshStandardMaterial color="#ded9cc" roughness={0.7} />
      </mesh>

      {/* Arched Top Header Molding */}
      <mesh position={[0, height / 2 + 0.06, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[width * 0.54, width * 0.54, 0.1, 20, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#ded9cc" roughness={0.7} />
      </mesh>

      {/* Central Keystone Accent */}
      <mesh position={[0, height / 2 + 0.32, 0.04]}>
        <boxGeometry args={[0.14, 0.16, 0.08]} />
        <meshStandardMaterial color="#e8e2d4" roughness={0.65} />
      </mesh>

      {/* Glass Pane */}
      <mesh position={[0, 0, 0.045]}>
        <boxGeometry args={[width, height, 0.03]} />
        <meshPhysicalMaterial
          color={isSelectedFloor ? '#C5A04F' : '#334155'}
          roughness={0.25}
          metalness={0.3}
          transmission={0.15}
          reflectivity={0.4}
        />
      </mesh>

      {/* Classical Symmetrical Window Muntins */}
      <mesh position={[0, 0, 0.065]}>
        <boxGeometry args={[0.035, height, 0.02]} />
        <meshStandardMaterial color="#f1ede5" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.1, 0.065]}>
        <boxGeometry args={[width, 0.035, 0.02]} />
        <meshStandardMaterial color="#f1ede5" roughness={0.5} />
      </mesh>
    </group>
  );
}

// Upper Floors Rectangular Window with Molded Classical Architrave & Sill
export function UpperFacadeWindow({ x, y, z, width = 0.74, height = 0.95, isSelectedFloor }) {
  return (
    <group position={[x, y, z]}>
      {/* Molded Outer Architrave Frame */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[width + 0.18, height + 0.18, 0.08]} />
        <meshStandardMaterial color="#e5dfd2" roughness={0.7} />
      </mesh>

      {/* Projecting Window Sill */}
      <mesh position={[0, -height / 2 - 0.07, 0.04]} castShadow>
        <boxGeometry args={[width + 0.28, 0.09, 0.16]} />
        <meshStandardMaterial color="#eee9de" roughness={0.65} />
      </mesh>

      {/* Decorative Lintel Cornice on top of window */}
      <mesh position={[0, height / 2 + 0.07, 0.04]} castShadow>
        <boxGeometry args={[width + 0.24, 0.08, 0.14]} />
        <meshStandardMaterial color="#eee9de" roughness={0.65} />
      </mesh>

      {/* Glass Pane */}
      <mesh position={[0, 0, 0.045]}>
        <boxGeometry args={[width, height, 0.03]} />
        <meshPhysicalMaterial
          color={isSelectedFloor ? '#C5A04F' : '#334155'}
          roughness={0.25}
          metalness={0.3}
          transmission={0.15}
          reflectivity={0.4}
        />
      </mesh>

      {/* Window Muntin Bars */}
      <mesh position={[0, 0, 0.065]}>
        <boxGeometry args={[0.035, height, 0.02]} />
        <meshStandardMaterial color="#f1ede5" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.04, 0.065]}>
        <boxGeometry args={[width, 0.035, 0.02]} />
        <meshStandardMaterial color="#f1ede5" roughness={0.5} />
      </mesh>
    </group>
  );
}

// Grand Entrance Podium Steps & Plaza Landscaping
export function EntrancePodiumAndPlaza() {
  return (
    <group position={[0, 0, 7.0]}>
      {/* 3-Tier Symmetrical Entrance Steps */}
      {[
        { y: 0.1, depth: 4.8, width: 10.2 },
        { y: 0.22, depth: 4.4, width: 9.6 },
        { y: 0.34, depth: 4.0, width: 9.0 },
      ].map((step, idx) => (
        <mesh key={`step-${idx}`} position={[0, step.y / 2, 1.8 + idx * 0.2]} receiveShadow castShadow>
          <boxGeometry args={[step.width, 0.12, step.depth]} />
          <meshStandardMaterial color="#ded7ca" roughness={0.7} />
        </mesh>
      ))}

      {/* Front Stone Plaza Paving Apron */}
      <mesh position={[0, -0.01, 5.8]} receiveShadow>
        <boxGeometry args={[22.0, 0.04, 5.2]} />
        <meshStandardMaterial color="#dcd5c7" roughness={0.85} />
      </mesh>

      {/* Flanking Landscaped Garden Beds with Green Hedges */}
      {[-13.0, 13.0].map((lx, idx) => (
        <group key={`landscaping-${idx}`} position={[lx, 0, 5.6]}>
          {/* Concrete Planter Curb */}
          <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.8, 0.24, 4.2]} />
            <meshStandardMaterial color="#d4cec2" roughness={0.8} />
          </mesh>
          {/* Soil Bed */}
          <mesh position={[0, 0.24, 0]}>
            <boxGeometry args={[5.5, 0.04, 3.9]} />
            <meshStandardMaterial color="#423429" roughness={0.95} />
          </mesh>
          {/* Manicured Evergreen Hedges */}
          {[-1.8, -0.6, 0.6, 1.8].map((hx, hIdx) => (
            <mesh key={`hedge-${hIdx}`} position={[hx, 0.45, 0]} castShadow>
              <boxGeometry args={[1.05, 0.4, 3.2]} />
              <meshStandardMaterial color="#2d5a3f" roughness={0.85} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Twin Classical Exterior Lamp Posts */}
      {[-6.2, 6.2].map((lx, idx) => (
        <group key={`lamp-${idx}`} position={[lx, 0, 5.2]}>
          {/* Base */}
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.22, 0.3, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          {/* Post column */}
          <mesh position={[0, 1.3, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 2.0, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          {/* Lantern Head */}
          <mesh position={[0, 2.35, 0]} castShadow>
            <boxGeometry args={[0.26, 0.32, 0.26]} />
            <meshStandardMaterial color="#fef08a" emissive="#eab308" emissiveIntensity={0.6} />
          </mesh>
          <pointLight position={[0, 2.4, 0]} intensity={0.4} distance={6.0} color="#fef08a" />
        </group>
      ))}
    </group>
  );
}

// Authentic Perimeter Parapet Balustrade along East and West Roof Terraces (open interior deck)
export function RoofParapetBalustrade({ x, z, width = 11.2, depth = 13.8 }) {
  const isWest = x < 0;
  const outerX = isWest ? -width / 2 + 0.09 : width / 2 - 0.09;
  const railThick = 0.18;
  const railH = 0.46;

  return (
    <group position={[x, 0.08, z]}>
      {/* Front Perimeter Railing (South Facade edge) */}
      <mesh position={[0, railH / 2, depth / 2 - railThick / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, railH, railThick]} />
        <meshStandardMaterial color="#ded7ca" roughness={0.7} />
      </mesh>
      {/* Rear Perimeter Railing (North Facade edge) */}
      <mesh position={[0, railH / 2, -depth / 2 + railThick / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, railH, railThick]} />
        <meshStandardMaterial color="#ded7ca" roughness={0.7} />
      </mesh>
      {/* Outer Lateral Rim Railing */}
      <mesh position={[outerX, railH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[railThick, railH, depth]} />
        <meshStandardMaterial color="#ded7ca" roughness={0.7} />
      </mesh>

      {/* Decorative Classical Coping Caps */}
      <mesh position={[0, railH + 0.03, depth / 2 - railThick / 2]} castShadow>
        <boxGeometry args={[width + 0.04, 0.06, railThick + 0.06]} />
        <meshStandardMaterial color="#eee9de" roughness={0.65} />
      </mesh>
      <mesh position={[0, railH + 0.03, -depth / 2 + railThick / 2]} castShadow>
        <boxGeometry args={[width + 0.04, 0.06, railThick + 0.06]} />
        <meshStandardMaterial color="#eee9de" roughness={0.65} />
      </mesh>
      <mesh position={[outerX, railH + 0.03, 0]} castShadow>
        <boxGeometry args={[railThick + 0.06, 0.06, depth + 0.04]} />
        <meshStandardMaterial color="#eee9de" roughness={0.65} />
      </mesh>
    </group>
  );
}

/**
 * 2. Dedicated Emergency Walk-In Entrance (Left side of Front Facade)
 * Directly connects to Ground Floor Casualty & Emergency Triage (GF-Z01 / GF-Z02).
 * Distinct from central classical portico with dedicated canopy, ramp, and signage.
 */
export function EmergencyWalkInEntrance({ position = [-12.8, 0, 7.0] }) {
  return (
    <group position={position}>
      {/* Concrete Entrance Apron & Accessible Ramp */}
      <mesh position={[0, 0.06, 1.4]} receiveShadow>
        <boxGeometry args={[5.2, 0.12, 3.2]} />
        <meshStandardMaterial color="#ded7ca" roughness={0.8} />
      </mesh>
      {/* Gentle Ramp Incline */}
      <mesh position={[0, 0.03, 3.3]} rotation={[0.04, 0, 0]} receiveShadow>
        <boxGeometry args={[5.2, 0.06, 1.2]} />
        <meshStandardMaterial color="#c5beaf" roughness={0.85} />
      </mesh>

      {/* Red & White Drop-off Curb Warning Strip */}
      {[-2.5, 2.5].map((cx, i) => (
        <mesh key={`curb-${i}`} position={[cx, 0.12, 1.4]} castShadow>
          <boxGeometry args={[0.2, 0.14, 3.2]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.6} />
        </mesh>
      ))}

      {/* Protective Stainless Steel Traffic Bollards */}
      {[-2.2, -0.8, 0.8, 2.2].map((bx, i) => (
        <group key={`bollard-${i}`} position={[bx, 0, 3.4]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.9, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Reflective Red Ring */}
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.12, 16]} />
            <meshStandardMaterial color="#dc2626" roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Portal Wall Opening / Structural Surround */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 2.4, 0.25]} />
        <meshStandardMaterial color="#eee8dc" roughness={0.7} />
      </mesh>

      {/* Automatic Double Glass Emergency Doors */}
      <mesh position={[0, 1.05, 0.08]}>
        <boxGeometry args={[2.4, 1.9, 0.06]} />
        <meshPhysicalMaterial
          color="#334155"
          roughness={0.2}
          transmission={0.3}
          metalness={0.2}
        />
      </mesh>
      {/* Red Door Trim / Handle Accents */}
      <mesh position={[-0.1, 1.05, 0.12]}>
        <boxGeometry args={[0.05, 1.6, 0.04]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} />
      </mesh>
      <mesh position={[0.1, 1.05, 0.12]}>
        <boxGeometry args={[0.05, 1.6, 0.04]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} />
      </mesh>

      {/* Modern Covered Cantilever Drop-off Canopy */}
      <group position={[0, 2.38, 1.3]}>
        {/* Canopy Roof Slab */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4.8, 0.18, 2.8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        {/* Canopy Edge Fascia (Hospital Red Stripe) */}
        <mesh position={[0, 0, 1.42]} castShadow>
          <boxGeometry args={[4.84, 0.22, 0.06]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.5} />
        </mesh>
        {/* Side Fascias */}
        <mesh position={[-2.42, 0, 0]} castShadow>
          <boxGeometry args={[0.06, 0.22, 2.8]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.5} />
        </mesh>
        <mesh position={[2.42, 0, 0]} castShadow>
          <boxGeometry args={[0.06, 0.22, 2.8]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.5} />
        </mesh>

        {/* Structural Steel Support Columns */}
        {[-2.2, 2.2].map((colX, i) => (
          <mesh key={`canopy-col-${i}`} position={[colX, -1.15, 1.2]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 2.3, 16]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}

        {/* Canopy Underside Downlights */}
        {[-1.2, 1.2].map((lx, i) => (
          <group key={`downlight-${i}`} position={[lx, -0.1, 0.2]}>
            <mesh>
              <cylinderGeometry args={[0.14, 0.14, 0.04, 16]} />
              <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={0.8} />
            </mesh>
            <pointLight intensity={0.4} distance={4.5} color="#fef08a" />
          </group>
        ))}
      </group>

      {/* Prominent High-Contrast 3D EMERGENCY Header Sign */}
      <group position={[0, 2.68, 0.2]}>
        <mesh castShadow>
          <boxGeometry args={[3.6, 0.46, 0.14]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.4} />
        </mesh>
        {/* White Emergency Cross Emblem */}
        <mesh position={[-1.4, 0, 0.09]}>
          <boxGeometry args={[0.24, 0.08, 0.02]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[-1.4, 0, 0.09]}>
          <boxGeometry args={[0.08, 0.24, 0.02]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Physical 3D Emergency Sign Plaque */}
        <mesh position={[0.2, 0, 0.08]} castShadow>
          <boxGeometry args={[2.4, 0.28, 0.02]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// Realistic PV Module with Aluminum Frame, Dark Silicon Monocrystalline Surface, and Grid Lines
function SolarModuleMesh({ panelW, panelH, panelD, tiltAngle }) {
  return (
    <group position={[0, 0.28, 0]} rotation={[tiltAngle, 0, 0]}>
      {/* Aluminum Module Frame */}
      <mesh castShadow>
        <boxGeometry args={[panelW, panelH, panelD]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* Dark Monocrystalline Solar Cell Face */}
      <mesh position={[0, 0.022, 0]}>
        <boxGeometry args={[panelW - 0.06, 0.01, panelD - 0.06]} />
        <meshPhysicalMaterial
          color="#0b172a"
          roughness={0.12}
          metalness={0.7}
          reflectivity={0.95}
          clearcoat={0.9}
        />
      </mesh>
      {/* Longitudinal Silver Busbars */}
      {[-panelW * 0.26, 0, panelW * 0.26].map((bx, bIdx) => (
        <mesh key={`bb-${bIdx}`} position={[bx, 0.028, 0]}>
          <boxGeometry args={[0.012, 0.003, panelD - 0.08]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.2} />
        </mesh>
      ))}
      {/* Transverse Subtle Cell Grid Lines */}
      {[-panelD * 0.35, -panelD * 0.12, panelD * 0.12, panelD * 0.35].map((gz, gIdx) => (
        <mesh key={`grid-${gIdx}`} position={[0, 0.027, gz]}>
          <boxGeometry args={[panelW - 0.08, 0.002, 0.008]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 3. Rooftop Photovoltaic Solar Array (Proposed 25 kWp Digital Twin Installation)
 * Sits on the flat roof level (Y = 8.6m) across East and West terraces.
 * Features realistic aluminum mounting racks angled at 15° facing South (+Z),
 * dark monocrystalline solar cells, aluminum frames, and central inverter conduit.
 */
export function RooftopSolarArray({ position = [0, 0.18, 0] } = {}) {
  // Panel dimensions (standard 2m x 1m commercial module)
  const panelW = 1.95;
  const panelH = 0.04;
  const panelD = 1.1;
  const tiltAngle = 0.26; // ~15 degrees tilt toward South (+Z)

  return (
    <group position={position}>
      {/* West Roof Terrace Solar Field (12 modules) */}
      <group position={[-9.8, 0, 0]}>
        {[-3.0, -1.0, 1.0, 3.0].map((rowZ, rIdx) => (
          <group key={`w-row-${rIdx}`} position={[0, 0, rowZ]}>
            {[-2.2, 0, 2.2].map((colX, cIdx) => (
              <group key={`w-col-${cIdx}`} position={[colX, 0, 0]}>
                {/* Structural Aluminum Racking Legs */}
                <mesh position={[-panelW * 0.4, 0.12, -panelD * 0.4]} castShadow>
                  <boxGeometry args={[0.04, 0.24, 0.04]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                </mesh>
                <mesh position={[panelW * 0.4, 0.12, -panelD * 0.4]} castShadow>
                  <boxGeometry args={[0.04, 0.24, 0.04]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                </mesh>
                <mesh position={[-panelW * 0.4, 0.26, panelD * 0.4]} castShadow>
                  <boxGeometry args={[0.04, 0.52, 0.04]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                </mesh>
                <mesh position={[panelW * 0.4, 0.26, panelD * 0.4]} castShadow>
                  <boxGeometry args={[0.04, 0.52, 0.04]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                </mesh>

                {/* Tilted PV Module Assembly */}
                <SolarModuleMesh panelW={panelW} panelH={panelH} panelD={panelD} tiltAngle={tiltAngle} />
              </group>
            ))}
          </group>
        ))}
      </group>

      {/* East Roof Terrace Solar Field (12 modules) */}
      <group position={[9.8, 0, 0]}>
        {[-3.0, -1.0, 1.0, 3.0].map((rowZ, rIdx) => (
          <group key={`e-row-${rIdx}`} position={[0, 0, rowZ]}>
            {[-2.2, 0, 2.2].map((colX, cIdx) => (
              <group key={`e-col-${cIdx}`} position={[colX, 0, 0]}>
                {/* Structural Aluminum Racking Legs */}
                <mesh position={[-panelW * 0.4, 0.12, -panelD * 0.4]} castShadow>
                  <boxGeometry args={[0.04, 0.24, 0.04]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                </mesh>
                <mesh position={[panelW * 0.4, 0.12, -panelD * 0.4]} castShadow>
                  <boxGeometry args={[0.04, 0.24, 0.04]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                </mesh>
                <mesh position={[-panelW * 0.4, 0.26, panelD * 0.4]} castShadow>
                  <boxGeometry args={[0.04, 0.52, 0.04]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                </mesh>
                <mesh position={[panelW * 0.4, 0.26, panelD * 0.4]} castShadow>
                  <boxGeometry args={[0.04, 0.52, 0.04]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                </mesh>

                {/* Tilted PV Module Assembly */}
                <SolarModuleMesh panelW={panelW} panelH={panelH} panelD={panelD} tiltAngle={tiltAngle} />
              </group>
            ))}
          </group>
        ))}
      </group>

      {/* Central Rooftop Inverter Housing & Weather Station */}
      <group position={[0, 0.35, 4.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.7, 0.8]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Inverter Display Screen (Gold active indicator) */}
        <mesh position={[0, 0.08, 0.41]}>
          <boxGeometry args={[0.5, 0.26, 0.02]} />
          <meshStandardMaterial color="#C5A04F" emissive="#B88A3B" emissiveIntensity={0.6} />
        </mesh>
        {/* Solar Pyranometer / Solar Irradiance Sensor Mast */}
        <mesh position={[0.5, 0.65, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.6, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <mesh position={[0.5, 0.96, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

