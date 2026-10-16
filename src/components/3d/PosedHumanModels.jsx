import React from 'react';
import * as THREE from 'three';

/**
 * Realistic 3D Human Models with Authentic Departmental Poses
 * Roles: 'lying_patient', 'standing_nurse', 'standing_doctor', 
 *        'seated_visitor', 'seated_receptionist', 'lab_technician'
 */

export function PosedHuman({
  pose = 'standing_nurse',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1.0,
  skinTone = '#f5d0b5',
  clothingColor = null,
}) {
  // Poses logic
  if (pose === 'lying_patient') {
    const gownColor = clothingColor || '#7dd3fc';
    return (
      <group position={position} rotation={rotation} scale={scale}>
        {/* Head on pillow */}
        <mesh position={[0, 0.16, -0.72]} rotation={[-0.1, 0, 0]} castShadow>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>
        {/* Hair / Cap */}
        <mesh position={[0, 0.21, -0.76]} rotation={[-0.1, 0, 0]}>
          <sphereGeometry args={[0.115, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color="#33241b" roughness={0.9} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.11, -0.58]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.1, 12]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} />
        </mesh>

        {/* Torso in Patient Gown */}
        <mesh position={[0, 0.1, -0.28]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <boxGeometry args={[0.34, 0.52, 0.16]} />
          <meshStandardMaterial color={gownColor} roughness={0.8} />
        </mesh>

        {/* Arms resting on mattress / folded on abdomen */}
        {/* Left Arm with IV Line attachment */}
        <group position={[-0.22, 0.08, -0.24]} rotation={[0.1, 0, -0.15]}>
          <mesh position={[0, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.44, 10]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
          {/* IV tape patch on wrist */}
          <mesh position={[0, 0.04, 0.38]}>
            <boxGeometry args={[0.04, 0.01, 0.05]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
        </group>
        {/* Right Arm resting across lower chest */}
        <group position={[0.2, 0.14, -0.2]} rotation={[0.4, 0, 0.4]}>
          <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.38, 10]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
        </group>

        {/* Legs under blanket (contour) */}
        <mesh position={[-0.08, 0.08, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.65, 10]} />
          <meshStandardMaterial color={gownColor} roughness={0.8} />
        </mesh>
        <mesh position={[0.08, 0.08, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.65, 10]} />
          <meshStandardMaterial color={gownColor} roughness={0.8} />
        </mesh>

        {/* Feet / Hospital Grip Socks */}
        <mesh position={[-0.08, 0.14, 0.65]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.08, 0.14, 0.08]} />
          <meshStandardMaterial color="#fef08a" roughness={0.9} />
        </mesh>
        <mesh position={[0.08, 0.14, 0.65]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.08, 0.14, 0.08]} />
          <meshStandardMaterial color="#fef08a" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  if (pose === 'seated_visitor' || pose === 'seated_receptionist') {
    const isReceptionist = pose === 'seated_receptionist';
    const topColor = clothingColor || (isReceptionist ? '#1e3a8a' : '#475569');
    const pantsColor = isReceptionist ? '#0f172a' : '#334155';

    return (
      <group position={position} rotation={rotation} scale={scale}>
        {/* Head */}
        <mesh position={[0, 1.15, 0]} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>
        {/* Hair */}
        <mesh position={[0, 1.2, -0.02]}>
          <sphereGeometry args={[0.108, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshStandardMaterial color="#2d1c14" roughness={0.85} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 1.02, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 0.08, 12]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} />
        </mesh>

        {/* Upright Torso */}
        <mesh position={[0, 0.76, 0]} castShadow>
          <boxGeometry args={[0.32, 0.44, 0.2]} />
          <meshStandardMaterial color={topColor} roughness={0.75} />
        </mesh>

        {/* ID Badge for receptionist */}
        {isReceptionist && (
          <mesh position={[0.08, 0.84, 0.105]}>
            <boxGeometry args={[0.05, 0.07, 0.01]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        )}

        {/* Upper Legs / Thighs (Horizontal forward) */}
        <mesh position={[-0.09, 0.46, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <boxGeometry args={[0.11, 0.42, 0.13]} />
          <meshStandardMaterial color={pantsColor} roughness={0.8} />
        </mesh>
        <mesh position={[0.09, 0.46, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <boxGeometry args={[0.11, 0.42, 0.13]} />
          <meshStandardMaterial color={pantsColor} roughness={0.8} />
        </mesh>

        {/* Lower Legs (Vertical down to floor) */}
        <mesh position={[-0.09, 0.22, 0.38]} castShadow>
          <cylinderGeometry args={[0.048, 0.044, 0.42, 10]} />
          <meshStandardMaterial color={pantsColor} roughness={0.8} />
        </mesh>
        <mesh position={[0.09, 0.22, 0.38]} castShadow>
          <cylinderGeometry args={[0.048, 0.044, 0.42, 10]} />
          <meshStandardMaterial color={pantsColor} roughness={0.8} />
        </mesh>

        {/* Shoes */}
        <mesh position={[-0.09, 0.04, 0.42]} castShadow>
          <boxGeometry args={[0.1, 0.07, 0.18]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        <mesh position={[0.09, 0.04, 0.42]} castShadow>
          <boxGeometry args={[0.1, 0.07, 0.18]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>

        {/* Arms */}
        {isReceptionist ? (
          // Receptionist arms forward toward desk/keyboard
          <group position={[0, 0.74, 0.12]}>
            <mesh position={[-0.14, -0.04, 0.15]} rotation={[0.6, 0, 0.1]} castShadow>
              <cylinderGeometry args={[0.035, 0.035, 0.35, 8]} />
              <meshStandardMaterial color={skinTone} roughness={0.7} />
            </mesh>
            <mesh position={[0.14, -0.04, 0.15]} rotation={[0.6, 0, -0.1]} castShadow>
              <cylinderGeometry args={[0.035, 0.035, 0.35, 8]} />
              <meshStandardMaterial color={skinTone} roughness={0.7} />
            </mesh>
          </group>
        ) : (
          // Visitor arms relaxed on lap
          <group position={[0, 0.72, 0.08]}>
            <mesh position={[-0.18, -0.14, 0.08]} rotation={[0.4, 0, 0]} castShadow>
              <cylinderGeometry args={[0.038, 0.035, 0.36, 8]} />
              <meshStandardMaterial color={topColor} roughness={0.75} />
            </mesh>
            <mesh position={[0.18, -0.14, 0.08]} rotation={[0.4, 0, 0]} castShadow>
              <cylinderGeometry args={[0.038, 0.035, 0.36, 8]} />
              <meshStandardMaterial color={topColor} roughness={0.75} />
            </mesh>
          </group>
        )}
      </group>
    );
  }

  if (pose === 'standing_nurse') {
    const scrubColor = clothingColor || '#0d9488'; // Medical teal scrubs
    return (
      <group position={position} rotation={rotation} scale={scale}>
        {/* Head */}
        <mesh position={[0, 1.54, 0]} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>
        {/* Hair tied back / Nurse bun */}
        <mesh position={[0, 1.58, -0.04]}>
          <sphereGeometry args={[0.105, 14, 14]} />
          <meshStandardMaterial color="#4a3728" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.56, -0.12]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#4a3728" roughness={0.8} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 1.41, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 0.08, 12]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} />
        </mesh>

        {/* Nurse Scrub Tunic */}
        <mesh position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[0.32, 0.48, 0.18]} />
          <meshStandardMaterial color={scrubColor} roughness={0.8} />
        </mesh>

        {/* V-neck collar detail */}
        <mesh position={[0, 1.34, 0.092]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.07, 0.07, 0.01]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} />
        </mesh>

        {/* ID Badge */}
        <mesh position={[-0.09, 1.25, 0.095]}>
          <boxGeometry args={[0.045, 0.065, 0.01]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>

        {/* Left Arm holding Clinical Chart Clipboard */}
        <group position={[-0.18, 1.25, 0]} rotation={[0.4, 0, 0.2]}>
          <mesh position={[0, -0.16, 0.08]} rotation={[0.5, 0, 0]} castShadow>
            <cylinderGeometry args={[0.038, 0.035, 0.36, 10]} />
            <meshStandardMaterial color={scrubColor} roughness={0.8} />
          </mesh>
          {/* Clipboard tablet */}
          <group position={[0.05, -0.3, 0.22]} rotation={[-0.4, 0.2, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.18, 0.25, 0.02]} />
              <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.3} />
            </mesh>
            {/* White paper sheet */}
            <mesh position={[0, 0, 0.012]}>
              <boxGeometry args={[0.15, 0.22, 0.005]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.9} />
            </mesh>
          </group>
        </group>

        {/* Right Arm at side */}
        <group position={[0.18, 1.25, 0]} rotation={[-0.1, 0, -0.1]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <cylinderGeometry args={[0.038, 0.035, 0.38, 10]} />
            <meshStandardMaterial color={scrubColor} roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.4, 0]}>
            <sphereGeometry args={[0.038, 10, 10]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
        </group>

        {/* Scrub Pants */}
        <mesh position={[-0.085, 0.48, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.05, 0.84, 12]} />
          <meshStandardMaterial color={scrubColor} roughness={0.8} />
        </mesh>
        <mesh position={[0.085, 0.48, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.05, 0.84, 12]} />
          <meshStandardMaterial color={scrubColor} roughness={0.8} />
        </mesh>

        {/* White Nursing Clogs */}
        <mesh position={[-0.085, 0.035, 0.04]} castShadow>
          <boxGeometry args={[0.1, 0.07, 0.2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        <mesh position={[0.085, 0.035, 0.04]} castShadow>
          <boxGeometry args={[0.1, 0.07, 0.2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
      </group>
    );
  }

  if (pose === 'standing_doctor') {
    return (
      <group position={position} rotation={rotation} scale={scale}>
        {/* Head */}
        <mesh position={[0, 1.62, 0]} castShadow>
          <sphereGeometry args={[0.105, 16, 16]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>
        {/* Hair */}
        <mesh position={[0, 1.67, -0.02]}>
          <sphereGeometry args={[0.11, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial color="#2d2824" roughness={0.85} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 1.48, 0]}>
          <cylinderGeometry args={[0.048, 0.054, 0.09, 12]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} />
        </mesh>

        {/* White Lab Coat over dress shirt */}
        <mesh position={[0, 1.18, 0]} castShadow>
          <boxGeometry args={[0.36, 0.54, 0.2]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} />
        </mesh>

        {/* Tie & Collar */}
        <mesh position={[0, 1.34, 0.102]}>
          <boxGeometry args={[0.04, 0.18, 0.01]} />
          <meshStandardMaterial color="#0369a1" roughness={0.5} />
        </mesh>

        {/* Stethoscope draped around neck */}
        <group position={[0, 1.38, 0.08]}>
          {/* Loop behind neck */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.08, 0.012, 8, 18, Math.PI]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Tubes hanging down chest */}
          <mesh position={[-0.07, -0.12, 0.03]} rotation={[0.1, 0, -0.1]}>
            <cylinderGeometry args={[0.009, 0.009, 0.22, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.5} />
          </mesh>
          <mesh position={[0.07, -0.12, 0.03]} rotation={[0.1, 0, 0.1]}>
            <cylinderGeometry args={[0.009, 0.009, 0.22, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.5} />
          </mesh>
          {/* Chest piece bell */}
          <mesh position={[0, -0.22, 0.04]}>
            <cylinderGeometry args={[0.024, 0.024, 0.012, 16]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Lower Lab Coat Flaps */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[0.37, 0.32, 0.21]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} />
        </mesh>

        {/* Arms */}
        {/* Left Arm slightly bent */}
        <group position={[-0.21, 1.28, 0]} rotation={[0.2, 0, 0.1]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.042, 0.038, 0.42, 10]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.44, 0]}>
            <sphereGeometry args={[0.04, 10, 10]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
        </group>
        {/* Right Arm holding pen or gesturing */}
        <group position={[0.21, 1.28, 0]} rotation={[0.35, 0, -0.15]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.042, 0.038, 0.42, 10]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.44, 0]}>
            <sphereGeometry args={[0.04, 10, 10]} />
            <meshStandardMaterial color={skinTone} roughness={0.7} />
          </mesh>
        </group>

        {/* Formal Dark Slacks */}
        <mesh position={[-0.09, 0.44, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.055, 0.86, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        <mesh position={[0.09, 0.44, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.055, 0.86, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>

        {/* Leather Shoes */}
        <mesh position={[-0.09, 0.04, 0.05]} castShadow>
          <boxGeometry args={[0.11, 0.08, 0.22]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0.09, 0.04, 0.05]} castShadow>
          <boxGeometry args={[0.11, 0.08, 0.22]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.2} />
        </mesh>
      </group>
    );
  }

  // Fallback: Default standing staff / lab technician
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.1, 14, 14]} />
        <meshStandardMaterial color={skinTone} roughness={0.65} />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.34, 0.52, 0.18]} />
        <meshStandardMaterial color={clothingColor || '#e2e8f0'} roughness={0.7} />
      </mesh>
      <mesh position={[-0.09, 0.45, 0]} castShadow>
        <boxGeometry args={[0.11, 0.85, 0.14]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
      <mesh position={[0.09, 0.45, 0]} castShadow>
        <boxGeometry args={[0.11, 0.85, 0.14]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
    </group>
  );
}
