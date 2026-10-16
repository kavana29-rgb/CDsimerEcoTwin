import React from 'react';
import * as THREE from 'three';
import { PosedHuman } from './PosedHumanModels.jsx';

/**
 * Recognizable 3D Furniture and Medical Equipment Geometry
 * Reusable, well-proportioned components for all hospital departments
 */

// 1. Hospital Bed with Rails, Bedside Cabinet, Interactive Lamp, IV Pole & Vital Signs Monitor
export function ProceduralHospitalBed({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  bedData,
  onToggleBedLight,
  occupied = false,
}) {
  const isOccupied = occupied || bedData?.occupied;
  const isLampOn = bedData?.bedsideLight !== false;

  return (
    <group position={position} rotation={rotation}>
      {/* 4 Rolling Casters */}
      {[
        [-0.5, 0.05, -0.95],
        [0.5, 0.05, -0.95],
        [-0.5, 0.05, 0.95],
        [0.5, 0.05, 0.95],
      ].map((pos, idx) => (
        <group key={`caster-${idx}`} position={pos}>
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.08, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 0.03, 10]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Bed Tubular Steel Chassis */}
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.14, 2.1]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Hospital Mattress */}
      <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.16, 2.05]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.8} />
      </mesh>

      {/* Patient Bed Pillow */}
      <mesh position={[0, 0.58, -0.74]} castShadow>
        <boxGeometry args={[0.78, 0.09, 0.38]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      {/* Bed Blanket (covers mattress; if occupied, covers patient legs) */}
      <mesh position={[0, isOccupied ? 0.62 : 0.54, 0.2]} castShadow>
        <boxGeometry args={[1.06, isOccupied ? 0.16 : 0.05, 1.4]} />
        <meshStandardMaterial color="#7dd3fc" roughness={0.75} />
      </mesh>

      {/* Lying Patient on Bed (if occupied) */}
      {isOccupied && (
        <PosedHuman
          pose="lying_patient"
          position={[0, 0.54, 0]}
          clothingColor="#bae6fd"
        />
      )}

      {/* Molded Plastic Headboard & Footboard */}
      <mesh position={[0, 0.72, -1.06]} castShadow>
        <boxGeometry args={[1.14, 0.62, 0.06]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.58, 1.06]} castShadow>
        <boxGeometry args={[1.14, 0.44, 0.06]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Side Safety Rails (Articulated Hospital Rails) */}
      {[-0.55, 0.55].map((rx, idx) => (
        <group key={`rail-${idx}`} position={[rx, 0.62, -0.1]}>
          <mesh castShadow>
            <boxGeometry args={[0.03, 0.26, 1.3]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Rail slats */}
          {[-0.45, -0.15, 0.15, 0.45].map((sz, sIdx) => (
            <mesh key={`slat-${sIdx}`} position={[0, -0.02, sz]}>
              <cylinderGeometry args={[0.012, 0.012, 0.24, 8]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Bedside Cabinet / Locker */}
      <group position={[0.82, 0, -0.55]}>
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.48, 0.76, 0.46]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
        </mesh>
        {/* Drawer handle */}
        <mesh position={[-0.24, 0.58, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.16, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>
        <mesh position={[-0.24, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.16, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>

        {/* Interactive Bedside Table Lamp */}
        <group
          position={[0, 0.78, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleBedLight && bedData) onToggleBedLight(bedData.id);
          }}
        >
          {/* Base */}
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.08, 0.09, 0.04, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Stem */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.24, 10]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
          </mesh>
          {/* Shade */}
          <mesh position={[0, 0.26, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.15, 0.16, 18]} />
            <meshStandardMaterial
              color={isLampOn ? '#fef08a' : '#cbd5e1'}
              emissive={isLampOn ? '#eab308' : '#000000'}
              emissiveIntensity={isLampOn ? 0.7 : 0}
              roughness={0.3}
            />
          </mesh>
          {isLampOn && (
            <pointLight position={[0, 0.28, 0]} intensity={0.5} distance={3.2} color="#fef08a" />
          )}
        </group>
      </group>

      {/* IV Stand on 5-Star Caster Base with Infusion Bottles */}
      <group position={[-0.8, 0, -0.65]}>
        {/* Base spider */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 5]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        {/* Chrome pole */}
        <mesh position={[0, 1.05, 0]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 2.0, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Top cross hooks */}
        <mesh position={[0, 1.95, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.32, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} />
        </mesh>
        {/* Saline bottle 1 */}
        <group position={[-0.12, 1.82, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.045, 0.045, 0.2, 12]} />
            <meshPhysicalMaterial color="#e0f2fe" transmission={0.7} roughness={0.15} />
          </mesh>
          {/* Blue cap */}
          <mesh position={[0, 0.11, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.03, 10]} />
            <meshStandardMaterial color="#0284c7" />
          </mesh>
        </group>
        {/* Infusion bag 2 */}
        <mesh position={[0.12, 1.8, 0]} castShadow>
          <boxGeometry args={[0.08, 0.22, 0.04]} />
          <meshPhysicalMaterial color="#f0f9ff" transmission={0.65} roughness={0.2} />
        </mesh>
      </group>

      {/* Vital Signs Monitor Mobile Cart */}
      <group position={[-0.85, 0, 0.3]}>
        {/* Cart base & upright column */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 1.0, 12]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.7} />
        </mesh>
        {/* Small storage basket */}
        <mesh position={[0, 0.65, 0.08]}>
          <boxGeometry args={[0.26, 0.16, 0.14]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Monitor Unit */}
        <group position={[0, 1.15, 0]} rotation={[-0.15, 0.2, 0]}>
          {/* Chassis */}
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.32, 0.1]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          {/* Glowing telemetry screen */}
          <mesh position={[0, 0, 0.052]}>
            <planeGeometry args={[0.38, 0.26]} />
            <meshStandardMaterial
              color="#090d16"
              emissive={isOccupied ? '#10b981' : '#0284c7'}
              emissiveIntensity={0.55}
              roughness={0.15}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// 2. ICU Complex: High-Acuity Bed + Ventilator + Multi-screen Telemetry + Crash Cart
export function ProceduralICUComplex({
  position = [0, 0, 0],
  bedData,
  onToggleBedLight,
  occupied = false,
  showCrashCart = false,
}) {
  const isOccupied = occupied || bedData?.occupied;

  return (
    <group position={position}>
      {/* Central ICU Electric Bed */}
      <ProceduralHospitalBed
        position={[0, 0, 0]}
        bedData={bedData}
        onToggleBedLight={onToggleBedLight}
        occupied={isOccupied}
      />

      {/* Mechanical Ventilator Cart (Right of bed, compact) */}
      <group position={[0.78, 0, 0.1]}>
        {/* Ventilator trolley */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[0.38, 0.88, 0.38]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.4} roughness={0.4} />
        </mesh>
        {/* Wheels */}
        {[-0.14, 0.14].map((wx, i) => (
          <mesh key={i} position={[wx, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.4, 12]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        ))}
        {/* Touchscreen UI with lung pressure/flow graphs */}
        <group position={[0, 1.05, 0]} rotation={[-0.2, -0.3, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.36, 0.3, 0.08]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.042]}>
            <planeGeometry args={[0.32, 0.24]} />
            <meshStandardMaterial
              color="#042f2e"
              emissive={isOccupied ? '#14b8a6' : '#0f766e'}
              emissiveIntensity={isOccupied ? 0.65 : 0.15}
              roughness={0.2}
            />
          </mesh>
        </group>

        {/* Dual Corrugated Breathing Circuit Hoses to Bed */}
        {isOccupied && (
          <mesh position={[-0.38, 0.82, -0.2]} rotation={[0, 0, 0.5]}>
            <cylinderGeometry args={[0.02, 0.02, 0.75, 10]} />
            <meshStandardMaterial color="#67e8f9" roughness={0.6} />
          </mesh>
        )}
      </group>

      {/* Multi-channel Infusion Pump Station (Left of bed, compact) */}
      <group position={[-0.78, 0, -0.2]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 1.8, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} />
        </mesh>
        {/* 3 Stacked syringe pumps */}
        {[0.8, 1.05, 1.3].map((py, idx) => (
          <mesh key={`pump-${idx}`} position={[0, py, 0.08]} castShadow>
            <boxGeometry args={[0.26, 0.18, 0.14]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Mobile Red Crash Cart / Resuscitation Trolley (optional per room) */}
      {showCrashCart && (
        <group position={[-0.85, 0, 1.0]}>
          <mesh position={[0, 0.48, 0]} castShadow>
            <boxGeometry args={[0.5, 0.92, 0.44]} />
            <meshStandardMaterial color="#dc2626" roughness={0.4} />
          </mesh>
          {/* Drawers */}
          {[0.25, 0.45, 0.65, 0.8].map((dy, idx) => (
            <mesh key={`drawer-${idx}`} position={[0.25, dy, 0]}>
              <boxGeometry args={[0.02, 0.12, 0.38]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.3} />
            </mesh>
          ))}
          {/* Cardiac Defibrillator on Top Shelf */}
          <group position={[0, 1.05, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.32, 0.2, 0.26]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.02, 0.132]}>
              <planeGeometry args={[0.2, 0.14]} />
              <meshStandardMaterial color="#0f172a" emissive="#eab308" emissiveIntensity={0.5} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}

// 3. Computed Tomography (CT) Scanner with Circular Donut Gantry & Motorized Patient Couch
export function ProceduralCTScanner({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Circular Donut Gantry Centered along Main Diagnostic Axis */}
      <group position={[0, 1.15, -0.9]}>
        {/* Main outer gantry casing - sleek, beveled clinical housing */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1.05, 1.05, 0.68, 36]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.25} />
        </mesh>
        {/* Front stylized aperture bevel & contrast ring */}
        <mesh position={[0, 0, 0.345]} rotation={[0, 0, 0]}>
          <ringGeometry args={[0.43, 1.03, 36]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.2} />
        </mesh>
        {/* Central Circular Bore (Aperture Hole - 84cm wide bore) */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.72, 36, 1, true]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} side={THREE.BackSide} />
        </mesh>
        {/* Laser alignment centering crosshair ring inside bore */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <ringGeometry args={[0.41, 0.425, 32]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Gantry top integrated touchscreen status & protocol display */}
        <mesh position={[0, 0.95, 0.34]}>
          <boxGeometry args={[0.38, 0.12, 0.03]} />
          <meshStandardMaterial color="#0f172a" emissive="#0284c7" emissiveIntensity={0.6} />
        </mesh>
        {/* Lateral emergency stop buttons */}
        {[-0.98, 0.98].map((ex, i) => (
          <mesh key={`estop-${i}`} position={[ex, 0, 0.32]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
            <meshStandardMaterial color="#dc2626" roughness={0.3} />
          </mesh>
        ))}
        {/* Floor mounting support plinth */}
        <mesh position={[0, -1.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.3, 0.26, 0.72]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>

      {/* Motorized Scanning Couch / Patient Table (extends smoothly into gantry bore) */}
      <group position={[0, 0, 0]}>
        {/* Base pedestal housing motorized lift */}
        <mesh position={[0, 0.28, 0.1]} castShadow receiveShadow>
          <boxGeometry args={[0.62, 0.54, 1.4]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
        </mesh>
        {/* Motorized telescoping actuator column */}
        <mesh position={[0, 0.58, 0.1]} castShadow>
          <boxGeometry args={[0.48, 0.08, 1.2]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Curved Carbon-Fiber Tabletop extending directly into bore */}
        <mesh position={[0, 0.66, -0.1]} castShadow>
          <boxGeometry args={[0.52, 0.05, 1.9]} />
          <meshStandardMaterial color="#1e293b" roughness={0.25} metalness={0.4} />
        </mesh>
        {/* Patient comfort headrest cradle inside gantry */}
        <mesh position={[0, 0.71, -0.9]} castShadow>
          <boxGeometry args={[0.28, 0.05, 0.24]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
      </group>

      {/* Dual Automated Contrast Injector Stand (Tucked cleanly along East wall) */}
      <group position={[2.6, 0, -0.9]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.8, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.04, 16]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        {/* Dual power syringes */}
        <mesh position={[0, 1.5, 0.08]} castShadow>
          <boxGeometry args={[0.22, 0.35, 0.16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
      </group>

      {/* Radiographer Operator Console cleanly aligned against West Wall */}
      <group position={[-2.85, 0, -0.6]} rotation={[0, Math.PI / 2, 0]}>
        {/* Heavy lead glass radiation shielding partition */}
        <mesh position={[0, 1.25, 0]} castShadow>
          <boxGeometry args={[1.8, 2.1, 0.06]} />
          <meshPhysicalMaterial
            color="#7dd3fc"
            transmission={0.88}
            roughness={0.08}
            reflectivity={0.65}
            metalness={0.1}
          />
        </mesh>
        {/* Lead partition metal frame and base ballast */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[1.84, 0.4, 0.1]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        {/* Workstation Desk on the operator side facing East towards scanner */}
        <mesh position={[0, 0.74, 0.35]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.06, 0.55]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        {/* Desk support legs */}
        {[-0.68, 0.68].map((lx, idx) => (
          <mesh key={`desk-leg-${idx}`} position={[lx, 0.37, 0.45]}>
            <cylinderGeometry args={[0.02, 0.02, 0.74, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
        ))}
        {/* Dual CT Reconstruction Workstation Displays */}
        {[-0.32, 0.32].map((mx, idx) => (
          <group key={`ct-mon-${idx}`} position={[mx, 1.05, 0.3]}>
            <mesh castShadow>
              <boxGeometry args={[0.48, 0.34, 0.03]} />
              <meshStandardMaterial color="#0f172a" roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.018]}>
              <planeGeometry args={[0.44, 0.3]} />
              <meshStandardMaterial
                color="#0f172a"
                emissive="#0284c7"
                emissiveIntensity={0.55}
                roughness={0.2}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// 4. Digital X-Ray & Fluoroscopy Diagnostics Suite
export function ProceduralXRaySuite({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Ceiling Suspended X-Ray Tube Column */}
      <group position={[0, 3.0, 0]}>
        {/* Overhead ceiling rail carriage */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[2.4, 0.12, 1.2]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        {/* Telescopic vertical column */}
        <mesh position={[0, -0.65, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 1.2, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* X-Ray Tube Housing */}
        <group position={[0, -1.35, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.5, 20]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.3} />
          </mesh>
          {/* Collimator Box with crosshair handles */}
          <mesh position={[0, -0.22, 0]} castShadow>
            <boxGeometry args={[0.26, 0.22, 0.26]} />
            <meshStandardMaterial color="#334155" metalness={0.7} />
          </mesh>
          {/* Collimator light field indicator */}
          <pointLight position={[0, -0.36, 0]} intensity={0.6} distance={2.5} color="#fef08a" />
        </group>
      </group>

      {/* Floating-top Radiographic Examination Table */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.65, 2.2]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
        </mesh>
        {/* Floating radiolucent tabletop */}
        <mesh position={[0, 0.74, 0]} castShadow>
          <boxGeometry args={[0.85, 0.06, 2.15]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
      </group>

      {/* Upright Vertical Chest Bucky Stand */}
      <group position={[2.1, 0, -0.8]}>
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[0.16, 2.0, 0.16]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        {/* Vertical chest detector detector plate */}
        <mesh position={[-0.12, 1.35, 0]} castShadow>
          <boxGeometry args={[0.08, 0.65, 0.58]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// 5. Operating Theatre Suite: Surgical Table, Dual Overhead Lights, Anesthesia Machine & Mayo Stand
export function ProceduralOperatingTheatre({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Central Heavy Hydraulic Operating Table */}
      <group position={[0, 0, 0]}>
        {/* Base column */}
        <mesh position={[0, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.35, 0.84, 20]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Articulating Table Top Sections */}
        <mesh position={[0, 0.88, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.78, 0.1, 2.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} />
        </mesh>
        {/* Anti-static conductive surgical pad */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[0.72, 0.05, 2.1]} />
          <meshStandardMaterial color="#0284c7" roughness={0.7} />
        </mesh>
      </group>

      {/* Dual Articulating Overhead LED Surgical Light Domes */}
      <group position={[0, 3.1, 0]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.12, 20]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} />
        </mesh>
        {/* Dome 1 */}
        <group position={[-0.7, -0.65, 0.2]} rotation={[0.3, 0, -0.3]}>
          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.34, 0.38, 0.12, 24]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
          </mesh>
          <pointLight position={[0, -0.3, 0]} intensity={2.2} distance={5.0} color="#ffffff" />
        </group>
        {/* Dome 2 */}
        <group position={[0.7, -0.7, -0.2]} rotation={[-0.3, 0, 0.3]}>
          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.34, 0.38, 0.12, 24]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
          </mesh>
          <pointLight position={[0, -0.3, 0]} intensity={2.2} distance={5.0} color="#ffffff" />
        </group>
      </group>

      {/* Anesthesia Workstation Machine */}
      <group position={[-1.6, 0, -0.5]}>
        <mesh position={[0, 0.75, 0]} castShadow>
          <boxGeometry args={[0.75, 1.5, 0.6]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Dual vaporizer canisters */}
        <mesh position={[-0.14, 1.1, 0.34]}>
          <cylinderGeometry args={[0.07, 0.07, 0.28, 14]} />
          <meshStandardMaterial color="#eab308" metalness={0.8} />
        </mesh>
        <mesh position={[0.14, 1.1, 0.34]}>
          <cylinderGeometry args={[0.07, 0.07, 0.28, 14]} />
          <meshStandardMaterial color="#9333ea" metalness={0.8} />
        </mesh>
      </group>

      {/* Stainless Steel Mayo Instrument Stand */}
      <group position={[1.2, 0, 0.6]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.0, 10]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        <mesh position={[-0.15, 1.0, 0]} castShadow>
          <boxGeometry args={[0.45, 0.03, 0.65]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

// 6. ECG / Echo Heart Station & Exercise Stress Test (TMT) Machine
export function ProceduralECGStation({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Patient Examination Couch */}
      <group position={[-0.8, 0, 0]}>
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.78, 0.52, 1.95]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.68, 0]} castShadow>
          <boxGeometry args={[0.74, 0.08, 1.9]} />
          <meshStandardMaterial color="#0284c7" roughness={0.6} />
        </mesh>
        {/* Pillow */}
        <mesh position={[0, 0.76, -0.72]} castShadow>
          <boxGeometry args={[0.55, 0.08, 0.32]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      </group>

      {/* 12-Lead Digital ECG Recording Cart */}
      <group position={[0.4, 0, -0.4]}>
        <mesh position={[0, 0.52, 0]} castShadow>
          <boxGeometry args={[0.42, 0.95, 0.38]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
        </mesh>
        {/* ECG display screen */}
        <group position={[0, 1.05, 0.08]} rotation={[-0.2, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.38, 0.28, 0.04]} />
            <meshStandardMaterial color="#0f172a" roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.022]}>
            <planeGeometry args={[0.34, 0.24]} />
            <meshStandardMaterial color="#022c22" emissive="#10b981" emissiveIntensity={0.6} />
          </mesh>
        </group>
      </group>

      {/* Treadmill Exercise Stress Test (TMT) Machine */}
      <group position={[1.4, 0, 0.4]}>
        {/* Treadmill base deck */}
        <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.75, 0.2, 1.8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        {/* Running belt */}
        <mesh position={[0, 0.23, 0]}>
          <boxGeometry args={[0.58, 0.02, 1.55]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        {/* Front handrail & monitor console */}
        <group position={[0, 0.8, -0.75]}>
          <mesh castShadow>
            <boxGeometry args={[0.65, 1.1, 0.06]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
          {/* TMT monitor */}
          <mesh position={[0, 0.45, 0.04]} rotation={[-0.15, 0, 0]}>
            <boxGeometry args={[0.42, 0.3, 0.04]} />
            <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// 7. Pathology & Biochemistry Laboratory Suite
export function ProceduralLabSuite({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Central Epoxy Lab Workbench */}
      <group position={[0, 0, 0]}>
        {/* Cabinet base */}
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.84, 1.2]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
        </mesh>
        {/* Chemical-resistant black epoxy countertop */}
        <mesh position={[0, 0.86, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.3, 0.06, 1.3]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.1} />
        </mesh>

        {/* Central reagent reagent rack */}
        <mesh position={[0, 1.18, 0]} castShadow>
          <boxGeometry args={[2.8, 0.58, 0.24]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.4} />
        </mesh>

        {/* Benchtop Centrifuge Unit */}
        <group position={[-1.0, 0.98, 0.3]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.24, 0.22, 20]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
          </mesh>
          {/* Transparent hinged dome lid */}
          <mesh position={[0, 0.12, 0]}>
            <sphereGeometry args={[0.21, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshPhysicalMaterial color="#94a3b8" transmission={0.7} roughness={0.2} />
          </mesh>
        </group>

        {/* Automated Biochemistry Analyzer */}
        <group position={[0.9, 1.05, 0.3]}>
          <mesh castShadow>
            <boxGeometry args={[0.65, 0.35, 0.45]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
          </mesh>
          {/* Sample carousel */}
          <mesh position={[-0.14, 0.18, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} />
            <meshStandardMaterial color="#0284c7" metalness={0.5} />
          </mesh>
        </group>
      </group>

      {/* Class II Bio-Safety Cabinet (Laminar Airflow Hood) */}
      <group position={[-1.8, 0, -1.0]}>
        <mesh position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[1.2, 2.0, 0.7]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Working chamber sash window */}
        <mesh position={[0, 1.0, 0.36]}>
          <boxGeometry args={[1.1, 0.6, 0.02]} />
          <meshPhysicalMaterial color="#38bdf8" transmission={0.8} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

// 8. Hospital Dining & Cafeteria (GF-Z09)
export const CAFETERIA_CHAIR_SLOTS = [
  // Table 1 (West: tx = -1.5, tz = 0.4)
  { id: 'c1-n', position: [-1.5, 0, 0.4 - 0.72], rotation: [0, 0, 0] },
  { id: 'c1-s', position: [-1.5, 0, 0.4 + 0.72], rotation: [0, Math.PI, 0] },
  { id: 'c1-w', position: [-1.5 - 0.72, 0, 0.4], rotation: [0, Math.PI / 2, 0] },
  { id: 'c1-e', position: [-1.5 + 0.72, 0, 0.4], rotation: [0, -Math.PI / 2, 0] },
  // Table 2 (East: tx = 1.5, tz = 0.4)
  { id: 'c2-n', position: [1.5, 0, 0.4 - 0.72], rotation: [0, 0, 0] },
  { id: 'c2-s', position: [1.5, 0, 0.4 + 0.72], rotation: [0, Math.PI, 0] },
  { id: 'c2-w', position: [1.5 - 0.72, 0, 0.4], rotation: [0, Math.PI / 2, 0] },
  { id: 'c2-e', position: [1.5 + 0.72, 0, 0.4], rotation: [0, -Math.PI / 2, 0] },
];

export function ProceduralDiningCafeteria({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* 2 Dining Tables with Wide Central Corridor */}
      {[-1.5, 1.5].map((tx, tIdx) => (
        <group key={`table-${tIdx}`} position={[tx, 0, 0.4]}>
          {/* Table Pedestal & Weighted Base */}
          <mesh position={[0, 0.36, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.72, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.04, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          {/* Table Top (Warm hygienic laminate, 0.65m radius, 0.74m height) */}
          <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.65, 0.65, 0.04, 32]} />
            <meshStandardMaterial color="#fcd34d" roughness={0.45} />
          </mesh>
        </group>
      ))}

      {/* 8 Dining Chairs Rendered from Authoritative Shared Slot Definition */}
      {CAFETERIA_CHAIR_SLOTS.map((chair) => (
        <group key={chair.id} position={chair.position} rotation={chair.rotation}>
          {/* 4 Steel Chair Legs with Non-marking Floor Glides */}
          {[
            [-0.14, 0.22, -0.14],
            [0.14, 0.22, -0.14],
            [-0.14, 0.22, 0.14],
            [0.14, 0.22, 0.14],
          ].map((lpos, lIdx) => (
            <mesh key={`leg-${lIdx}`} position={lpos}>
              <cylinderGeometry args={[0.012, 0.012, 0.44, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>
          ))}
          {/* Contoured Ergonomic Seat (y = 0.44, top at y = 0.46) */}
          <mesh position={[0, 0.44, 0]} castShadow>
            <boxGeometry args={[0.38, 0.04, 0.38]} />
            <meshStandardMaterial color="#0284c7" roughness={0.65} />
          </mesh>
          {/* Supportive Backrest (placed at -Z behind the seated diner) */}
          <mesh position={[0, 0.66, -0.17]} castShadow>
            <boxGeometry args={[0.36, 0.38, 0.04]} />
            <meshStandardMaterial color="#0284c7" roughness={0.65} />
          </mesh>
        </group>
      ))}

      {/* Food Serving Counter with Sneeze Guard, Tray Slide & Warming Inset Trays */}
      <group position={[0, 0, -1.6]}>
        {/* Main Counter Base Cabinet */}
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.9, 0.6]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
        {/* Stainless Steel Sanitary Top */}
        <mesh position={[0, 0.92, 0]} castShadow>
          <boxGeometry args={[3.3, 0.04, 0.65]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Front Tray Slide Rails */}
        <group position={[0, 0.82, 0.38]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.016, 0.016, 3.1, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
          </mesh>
          {[-1.2, 0, 1.2].map((bx, bIdx) => (
            <mesh key={`bracket-${bIdx}`} position={[bx, -0.06, -0.05]}>
              <boxGeometry args={[0.03, 0.12, 0.1]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>
          ))}
        </group>
        {/* Clear Glass Sneeze Guard Barrier */}
        <mesh position={[0, 1.15, 0.15]}>
          <boxGeometry args={[3.0, 0.42, 0.02]} />
          <meshPhysicalMaterial
            color="#bae6fd"
            transmission={0.88}
            roughness={0.08}
            reflectivity={0.6}
          />
        </mesh>
        {/* Food Warmer Bain-Marie Inserts */}
        {[-0.9, -0.3, 0.3, 0.9].map((px, pIdx) => (
          <mesh key={`pan-${pIdx}`} position={[px, 0.945, 0]}>
            <boxGeometry args={[0.42, 0.02, 0.32]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// 9. Central Sterile Supply Department (CSSD) Autoclaves & Pack Decon
export function ProceduralCSSDAutoclave({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* 2 High-Pressure Steam Autoclave Units */}
      {[-0.9, 0.9].map((ax, idx) => (
        <group key={`autoclave-${idx}`} position={[ax, 0, -0.6]}>
          {/* Main stainless autoclave housing */}
          <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.1, 1.9, 1.1]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Heavy circular pressure door with handwheel latch */}
          <mesh position={[0, 0.95, 0.56]} castShadow>
            <cylinderGeometry args={[0.38, 0.38, 0.06, 24]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Wheel latch */}
          <mesh position={[0, 0.95, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.16, 0.02, 8, 20]} />
            <meshStandardMaterial color="#475569" metalness={0.95} />
          </mesh>
          {/* Steam Pressure Gauges */}
          <mesh position={[0.32, 1.62, 0.56]}>
            <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#ffffff" emissive="#0284c7" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}

      {/* Stainless Ultrasonic Decontamination Sinks */}
      <group position={[0, 0, 1.0]}>
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.84, 0.7]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>
        {/* 2 Sink basin cutouts */}
        {[-0.6, 0.6].map((sx, idx) => (
          <mesh key={`sink-${idx}`} position={[sx, 0.85, 0]}>
            <boxGeometry args={[0.65, 0.02, 0.48]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// 10. Doctor Consultation Desk & Patient Exam Couch
export function ProceduralConsultationSuite({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Consultation Desk */}
      <group position={[0.6, 0, -0.6]}>
        <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.06, 0.9]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
        </mesh>
        {/* Metal legs */}
        <mesh position={[-0.8, 0.37, 0]} castShadow>
          <boxGeometry args={[0.08, 0.74, 0.8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        <mesh position={[0.8, 0.37, 0]} castShadow>
          <boxGeometry args={[0.08, 0.74, 0.8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
        {/* Doctor Swivel Chair */}
        <mesh position={[0, 0.52, -0.65]} castShadow>
          <boxGeometry args={[0.55, 0.7, 0.5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        {/* Workstation PC Display */}
        <group position={[0, 1.02, -0.1]} rotation={[-0.1, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.58, 0.38, 0.04]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.022]}>
            <planeGeometry args={[0.54, 0.34]} />
            <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.4} />
          </mesh>
        </group>
        {/* 2 Visitor Armchairs */}
        {[-0.45, 0.45].map((vx, i) => (
          <mesh key={i} position={[vx, 0.44, 0.7]} castShadow>
            <boxGeometry args={[0.45, 0.52, 0.45]} />
            <meshStandardMaterial color="#475569" roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* Patient Examination Couch */}
      <group position={[-1.4, 0, 0.3]}>
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.78, 0.48, 1.95]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.68, 0]} castShadow>
          <boxGeometry args={[0.74, 0.08, 1.9]} />
          <meshStandardMaterial color="#0284c7" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

// 11. Reception Atrium & Concourse (GF-Z01)
export function ProceduralReceptionLounge({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Main Curved Reception Desk */}
      <mesh position={[0, 0.55, -1.0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 1.1, 0.9]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.35} />
      </mesh>
      {/* Transaction ledge */}
      <mesh position={[0, 1.12, -0.95]} castShadow>
        <boxGeometry args={[4.4, 0.08, 1.05]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.2} roughness={0.3} />
      </mesh>
      {/* 2 Staff Terminals */}
      {[-1.1, 1.1].map((cx, i) => (
        <mesh key={i} position={[cx, 1.38, -0.9]} castShadow>
          <boxGeometry args={[0.55, 0.36, 0.04]} />
          <meshStandardMaterial color="#0f172a" emissive="#059669" emissiveIntensity={0.4} />
        </mesh>
      ))}

      {/* Waiting Area Seating Benches */}
      <group position={[0, 0, 1.2]}>
        {[-1.6, 1.6].map((bx, i) => (
          <group key={i} position={[bx, 0, 0]}>
            <mesh position={[0, 0.24, 0]} castShadow>
              <boxGeometry args={[1.6, 0.44, 0.54]} />
              <meshStandardMaterial color="#475569" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.54, -0.23]} castShadow>
              <boxGeometry args={[1.6, 0.48, 0.08]} />
              <meshStandardMaterial color="#334155" roughness={0.7} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
