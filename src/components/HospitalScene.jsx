import React, { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Building2, Eye, EyeOff, Layers, Lightbulb, RotateCcw, 
  Users, Wind, Zap, Droplets, Wifi, ShieldCheck, X, Maximize2, UserCheck, Stethoscope,
  Footprints, Compass, Camera
} from 'lucide-react';
import { architecturalFloors, architecturalDefaults, calculateRoomPower, syncRoomOccupancy } from '../data/hospitalArchitectureData.js';
import { FirstPersonRoomControls, getRoomWalkthroughConfig } from './3d/FirstPersonRoomControls.jsx';
import {
  ClassicalColumn,
  ClassicalPediment,
  ArchedFacadeWindow,
  UpperFacadeWindow,
  EntrancePodiumAndPlaza,
  RoofParapetBalustrade,
  EmergencyWalkInEntrance,
  RooftopSolarArray,
} from './3d/BuildingExterior.jsx';
import {
  ProceduralHospitalBed,
  ProceduralICUComplex,
  ProceduralCTScanner,
  ProceduralXRaySuite,
  ProceduralOperatingTheatre,
  ProceduralECGStation,
  ProceduralLabSuite,
  ProceduralDiningCafeteria,
  CAFETERIA_CHAIR_SLOTS,
  ProceduralCSSDAutoclave,
  ProceduralConsultationSuite,
  ProceduralReceptionLounge,
} from './3d/HospitalFurniture.jsx';
import { PosedHuman } from './3d/PosedHumanModels.jsx';

// Camera controller to smoothly reset or switch view angles
function CameraController({ cameraAngle, controlsRef, isImmersive, viewMode, selectedFloor }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!controlsRef.current || isImmersive) return;
    const controls = controlsRef.current;

    if (viewMode === 'floor') {
      // Focus directly on the isolated floor level
      if (cameraAngle === 'topDown') {
        camera.position.set(-1.0, 26, 0.01);
        controls.target.set(-1.0, 0.5, 0);
      } else if (cameraAngle === 'front') {
        camera.position.set(-1.0, 3.8, 24);
        controls.target.set(-1.0, 0.5, 0);
      } else {
        // Perspective 3D cutaway isometric angle
        camera.position.set(18, 14, 21);
        controls.target.set(-1.0, 0.5, 0);
      }
    } else {
      // Whole Building Mode (All 4 Floors Stacked) — Framed to balance building & attached labels
      if (cameraAngle === 'topDown') {
        camera.position.set(-1.5, 44, 0.01);
        controls.target.set(-1.5, 4.2, 0);
      } else if (cameraAngle === 'front') {
        camera.position.set(-1.5, 6.0, 32);
        controls.target.set(-1.5, 4.2, 0);
      } else {
        // Perspective default (3D Angle)
        camera.position.set(22, 17, 28);
        controls.target.set(-1.5, 4.2, 0);
      }
    }
    controls.update();
  }, [cameraAngle, isImmersive, viewMode, selectedFloor, camera, controlsRef]);

  return null;
}

// 3D Room Box / Cutaway Zone with Heatmap Coloring
function RoomMesh({
  room,
  floorY,
  isSelected,
  isHovered,
  onHover,
  onSelect,
  onDoubleClick,
  isFloorSelected,
  heatmapMode = 'Normal',
  showLabels = true,
  viewMode = 'building',
}) {
  const [rx, rz] = [room.position[0], room.position[2]];
  const [w, d] = room.dimensions;
  const wallH = 1.1; // Cutaway height for internal visibility
  const wallT = 0.14; // Wall thickness

  // Compute floor color based on active heatmap mode with warm architectural palette
  const floorColor = useMemo(() => {
    if (isSelected) return '#C5A04F'; // Antique Gold
    if (isHovered) return '#E8DDC6';  // Cream highlight

    if (heatmapMode === 'Energy') {
      const kw = (room.lightOn ? room.lightKw : 0) + (room.hvacMode === 'Running' ? room.hvacKw : room.hvacMode === 'Eco' ? room.hvacKw * 0.65 : room.hvacKw * 0.12);
      if (kw > 3.0) return '#B88A3B'; // High Demand: Rich Muted Ochre
      if (kw > 1.5) return '#C5A04F'; // Moderate Demand: Antique Gold
      return '#E8DDC6'; // Low Demand: Cream
    }
    if (heatmapMode === 'Occupancy') {
      if (room.people === 0) return '#F7F3E9'; // Empty / Unoccupied: Warm Ivory
      const cap = Math.max(1, room.capacity);
      const ratio = room.people / cap;
      if (ratio > 0.5) return '#A65D2C'; // High Occupancy: Warm Terracotta
      return '#D8AB56'; // Moderate Occupancy: Honey Gold
    }
    if (heatmapMode === 'Devices' || heatmapMode === 'IoT Health') {
      const allOnline = room.devices && room.devices.every(d => d.online);
      return allOnline ? '#E0E8DE' : '#D4533B'; // Healthy Sage Ivory vs Warning Terracotta
    }
    if (heatmapMode === 'Water') {
      if (room.waterLph > 15) return '#3B7B9E'; // High Clinical Demand (CSSD, Dialysis): Deep Slate Blue
      if (room.waterLph >= 5) return '#7EABC0';  // Moderate Demand: Soft Aqua
      return '#F7F3E9'; // Dry / Non-water zones: Warm Ivory
    }

    // Architecture mode (Normal architectural baseline)
    return room.critical ? '#ECE4D2' : '#F7F3E9';
  }, [isSelected, isHovered, heatmapMode, room]);

  return (
    <group
      position={[rx, floorY, rz]}
      onClick={(e) => { e.stopPropagation(); onSelect(room); }}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(room); }}
    >
      {/* Floor Zone Tile */}
      <mesh
        position={[0, 0.06, 0]}
        receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); onHover(room.id); }}
        onPointerOut={() => onHover(null)}
      >
        <boxGeometry args={[w - 0.08, 0.08, d - 0.08]} />
        <meshStandardMaterial
          color={floorColor}
          roughness={0.65}
          emissive={isSelected ? '#059669' : isHovered ? '#10b981' : '#000000'}
          emissiveIntensity={isSelected ? 0.35 : isHovered ? 0.18 : 0}
        />
      </mesh>

      {/* Internal Partition Walls (with doorway opening) */}
      {/* North Wall (Back) */}
      <mesh position={[0, wallH / 2 + 0.06, -d / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, wallH, wallT]} />
        <meshStandardMaterial color="#e5e0d4" roughness={0.8} />
      </mesh>

      {/* West Wall (Left) */}
      <mesh position={[-w / 2, wallH / 2 + 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallT, wallH, d]} />
        <meshStandardMaterial color="#e5e0d4" roughness={0.8} />
      </mesh>

      {/* East Wall (Right) */}
      <mesh position={[w / 2, wallH / 2 + 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallT, wallH, d]} />
        <meshStandardMaterial color="#e5e0d4" roughness={0.8} />
      </mesh>

      {/* South Wall with Open Doorway */}
      <mesh position={[-w / 3.4, wallH / 2 + 0.06, d / 2]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.4, wallH, wallT]} />
        <meshStandardMaterial color="#e5e0d4" roughness={0.8} />
      </mesh>
      <mesh position={[w / 3.4, wallH / 2 + 0.06, d / 2]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.4, wallH, wallT]} />
        <meshStandardMaterial color="#e5e0d4" roughness={0.8} />
      </mesh>
      <mesh position={[0, wallH - 0.12, d / 2]} castShadow>
        <boxGeometry args={[w * 0.22, 0.24, wallT]} />
        <meshStandardMaterial color="#d4cec2" roughness={0.8} />
      </mesh>

      {/* 3D Room Label with Restrained Visibility to Prevent Clutter */}
      {showLabels && (isSelected || isHovered || (viewMode === 'floor' && isFloorSelected)) && (
        <Html position={[0, wallH + 0.32, 0]} center distanceFactor={18} style={{ pointerEvents: 'none' }}>
          <div className={`room-3d-tag ${isSelected ? 'selected' : isHovered ? 'hovered' : ''}`}>
            <strong>{room.id}</strong>
            <span>{room.name.length > 20 ? `${room.name.slice(0, 18)}...` : room.name}</span>
            {room.critical && <span className="tag-critical-dot" title="Critical Clinical Zone" />}
            {room.provisional && <span className="tag-provisional-badge" title="Provisional floor-plan placement">Prov</span>}
          </div>
        </Html>
      )}
    </group>
  );
}

// Vertical Circulation Core (Elevator Shaft + Stairwells)
function VerticalCirculationBlock({ floorY, height = 1.8, showLabels = false, isFloorCutaway = false }) {
  return (
    <group position={[0, floorY, 0]}>
      {/* Central Elevator Shaft */}
      <group position={[0, height / 2 + 0.06, -4.5]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.6, height, 2.4]} />
          <meshStandardMaterial color="#cfc7b8" roughness={0.85} />
        </mesh>
        {/* Elevator Door Cutouts */}
        <mesh position={[-0.9, -0.15, 1.21]}>
          <boxGeometry args={[1.1, height * 0.82, 0.04]} />
          <meshStandardMaterial color="#58716b" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0.9, -0.15, 1.21]}>
          <boxGeometry args={[1.1, height * 0.82, 0.04]} />
          <meshStandardMaterial color="#58716b" metalness={0.4} roughness={0.4} />
        </mesh>
        {showLabels && isFloorCutaway && (
          <Html position={[0, height / 2 + 0.2, 1.3]} center distanceFactor={22} style={{ pointerEvents: 'none' }}>
            <div className="circulation-3d-tag">LIFTS CORE</div>
          </Html>
        )}
      </group>

      {/* West Stairwell */}
      <group position={[-8.2, height / 2 + 0.06, -4.5]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.8, height, 3.2]} />
          <meshStandardMaterial color="#d8d1c4" roughness={0.85} />
        </mesh>
        {showLabels && isFloorCutaway && (
          <Html position={[0, height / 2 + 0.2, 1.7]} center distanceFactor={24} style={{ pointerEvents: 'none' }}>
            <div className="circulation-3d-tag">FIRE STAIRS W</div>
          </Html>
        )}
      </group>

      {/* East Stairwell */}
      <group position={[8.2, height / 2 + 0.06, -4.5]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.8, height, 3.2]} />
          <meshStandardMaterial color="#d8d1c4" roughness={0.85} />
        </mesh>
        {showLabels && isFloorCutaway && (
          <Html position={[0, height / 2 + 0.2, 1.7]} center distanceFactor={24} style={{ pointerEvents: 'none' }}>
            <div className="circulation-3d-tag">EGRESS STAIRS E</div>
          </Html>
        )}
      </group>
    </group>
  );
}

// Single Level Architecture Unit
function ArchitecturalFloorLevel({
  floorData,
  displayY,
  isSelected,
  selectedRoomId,
  hoveredRoomId,
  setHoveredRoomId,
  onSelectRoom,
  onDoubleClickRoom,
  onSelectFloor,
  viewMode,
  heatmapMode,
  showLabels,
  rooms = [],
}) {
  const isFloorCutaway = viewMode === 'floor' && isSelected;

  // Window positions along facade
  const windowXs = [-13.6, -11.4, -9.2, -7.0, -4.8, -2.6, 2.6, 4.8, 7.0, 9.2, 11.4, 13.6];

  // Map floor rooms to live telemetry state
  const floorRooms = useMemo(() => {
    return floorData.rooms.map(r => rooms.find(item => item.id === r.id) || r);
  }, [floorData.rooms, rooms]);

  return (
    <group position={[0, displayY, 0]}>
      {/* Main Floor Slab */}
      <mesh
        position={[0, 0, 0]}
        receiveShadow
        onClick={(e) => { e.stopPropagation(); onSelectFloor(floorData.id); }}
      >
        <boxGeometry args={[32.0, 0.2, 14.0]} />
        <meshStandardMaterial
          color={isSelected ? '#d8ede2' : '#e6e2d8'}
          roughness={0.7}
        />
      </mesh>

      {/* Longitudinal Spine Corridor Floor */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[30.0, 0.04, 2.4]} />
        <meshStandardMaterial color="#c5d0ca" roughness={0.8} />
      </mesh>

      {/* Vertical Circulation (Stairs & Elevator Cores) */}
      <VerticalCirculationBlock floorY={0.1} height={1.7} showLabels={showLabels} isFloorCutaway={isFloorCutaway} />

      {/* Rooms on this level */}
      {floorRooms.map((room) => (
        <RoomMesh
          key={room.id}
          room={room}
          floorY={0.1}
          isSelected={selectedRoomId === room.id}
          isHovered={hoveredRoomId === room.id}
          onHover={setHoveredRoomId}
          onSelect={onSelectRoom}
          onDoubleClick={onDoubleClickRoom}
          isFloorSelected={isSelected}
          heatmapMode={heatmapMode}
          showLabels={showLabels}
          viewMode={viewMode}
        />
      ))}

      {/* Facade Windows and Wall Panels */}
      {!isFloorCutaway && (
        <group>
          {/* Front Exterior Wall Spandrels */}
          <mesh position={[0, 0.9, 7.02]} castShadow receiveShadow>
            <boxGeometry args={[32.0, 1.7, 0.14]} />
            <meshStandardMaterial color={isSelected ? '#f3ede1' : '#e4dfd4'} roughness={0.75} />
          </mesh>
          {/* Back Exterior Wall */}
          <mesh position={[0, 0.9, -7.02]} castShadow receiveShadow>
            <boxGeometry args={[32.0, 1.7, 0.14]} />
            <meshStandardMaterial color="#dcd7cc" roughness={0.75} />
          </mesh>
          {/* West Exterior Wall */}
          <mesh position={[-16.02, 0.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.14, 1.7, 14.0]} />
            <meshStandardMaterial color="#ded9ce" roughness={0.75} />
          </mesh>
          {/* East Exterior Wall */}
          <mesh position={[16.02, 0.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.14, 1.7, 14.0]} />
            <meshStandardMaterial color="#ded9ce" roughness={0.75} />
          </mesh>

          {/* Windows along Front Facade (Ground floor has authentic rounded arches; upper floors molded cornices) */}
          {windowXs.map((x) => (
            floorData.id === 'GF' ? (
              <ArchedFacadeWindow
                key={`win-${floorData.id}-${x}`}
                x={x}
                y={0.9}
                z={7.1}
                isSelectedFloor={isSelected}
              />
            ) : (
              <UpperFacadeWindow
                key={`win-${floorData.id}-${x}`}
                x={x}
                y={0.9}
                z={7.1}
                isSelectedFloor={isSelected}
              />
            )
          ))}

          {/* Floor Cornice / String Course */}
          <mesh position={[0, 1.78, 0]} castShadow>
            <boxGeometry args={[32.4, 0.12, 14.4]} />
            <meshStandardMaterial color="#eeeae0" roughness={0.65} />
          </mesh>
        </group>
      )}

      {/* Architectural Cutaway Perimeter Wall & Structural Frame (when inspecting isolated floor) */}
      {isFloorCutaway && (
        <group position={[0, 0, 0]}>
          {/* North Perimeter Cutaway Wall */}
          <mesh position={[0, 0.35, -7.0]} castShadow receiveShadow>
            <boxGeometry args={[32.0, 0.7, 0.22]} />
            <meshStandardMaterial color="#ded9ce" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.71, -7.0]}>
            <boxGeometry args={[32.1, 0.04, 0.26]} />
            <meshStandardMaterial color="#f7f5f0" roughness={0.5} />
          </mesh>

          {/* South Perimeter Cutaway Wall */}
          <mesh position={[0, 0.35, 7.0]} castShadow receiveShadow>
            <boxGeometry args={[32.0, 0.7, 0.22]} />
            <meshStandardMaterial color="#e8e2d5" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.71, 7.0]}>
            <boxGeometry args={[32.1, 0.04, 0.26]} />
            <meshStandardMaterial color="#f7f5f0" roughness={0.5} />
          </mesh>

          {/* West Perimeter Cutaway Wall */}
          <mesh position={[-16.0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.22, 0.7, 14.0]} />
            <meshStandardMaterial color="#ded9ce" roughness={0.75} />
          </mesh>
          <mesh position={[-16.0, 0.71, 0]}>
            <boxGeometry args={[0.26, 0.04, 14.1]} />
            <meshStandardMaterial color="#f7f5f0" roughness={0.5} />
          </mesh>

          {/* East Perimeter Cutaway Wall */}
          <mesh position={[16.0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.22, 0.7, 14.0]} />
            <meshStandardMaterial color="#ded9ce" roughness={0.75} />
          </mesh>
          <mesh position={[16.0, 0.71, 0]}>
            <boxGeometry args={[0.26, 0.04, 14.1]} />
            <meshStandardMaterial color="#f7f5f0" roughness={0.5} />
          </mesh>

          {/* Structural Grid Columns along corridor & room intersections */}
          {[-12.0, -6.0, 0, 6.0, 12.0].map((cx) => (
            <React.Fragment key={`col-grid-${cx}`}>
              <mesh position={[cx, 0.55, -1.25]} castShadow>
                <boxGeometry args={[0.32, 1.1, 0.32]} />
                <meshStandardMaterial color="#ece7dc" roughness={0.65} />
              </mesh>
              <mesh position={[cx, 0.55, 1.25]} castShadow>
                <boxGeometry args={[0.32, 1.1, 0.32]} />
                <meshStandardMaterial color="#ece7dc" roughness={0.65} />
              </mesh>
            </React.Fragment>
          ))}
        </group>
      )}

    </group>
  );
}

// Interactive Ceiling Troffer Light Fixture
function CeilingTroffer({ position, isLit, onToggle }) {
  return (
    <group position={position}>
      {/* Outer aluminum frame */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.04, 0.6]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Emissive diffuser surface */}
      <mesh
        position={[0, -0.02, 0]}
        onClick={(e) => {
          e.stopPropagation();
          if (onToggle) onToggle();
        }}
      >
        <boxGeometry args={[1.12, 0.02, 0.52]} />
        <meshStandardMaterial
          color={isLit ? '#ffffff' : '#94a3b8'}
          emissive={isLit ? '#ffffff' : '#000000'}
          emissiveIntensity={isLit ? 1.0 : 0}
          roughness={0.2}
        />
      </mesh>
      {isLit && (
        <pointLight position={[0, -0.4, 0]} intensity={1.5} distance={6.5} color="#fdfbf7" />
      )}
    </group>
  );
}

// Complete 360-Degree Immersive Room Walkthrough & Cutaway View
function ImmersiveRoomView({ room, isCutaway = false, onToggleLight, onToggleBedLight }) {
  const [w, d] = [Math.max(7.2, (room.dimensions?.[0] || 6) * 1.2), Math.max(5.8, (room.dimensions?.[1] || 4) * 1.3)];
  const ceilingH = 3.2;
  const isLit = room.lightOn !== false;
  const furnitureType = room.furnitureType || 'consultation';

  // Authoritative metrics separation from room state record
  const totalPeople = Math.max(0, room.people || 0);
  const occupiedBeds = room.bedsList
    ? room.bedsList.filter(b => b.occupied).length
    : Math.min(room.beds || 0, room.occupiedBeds || 0);
  const patientCount = totalPeople === 0 ? 0 : (room.patients !== undefined ? room.patients : (room.beds > 0 ? occupiedBeds : 0));
  const staffCount = totalPeople === 0 ? 0 : (room.staff !== undefined ? room.staff : 0);
  const visitorCount = totalPeople === 0 ? 0 : (room.visitors !== undefined ? room.visitors : Math.max(0, totalPeople - patientCount - staffCount));

  return (
    <group position={[0, 0, 0]}>
      {/* Floor with hygienic hospital vinyl / linoleum finish */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[w, 0.1, d]} />
        <meshStandardMaterial color={room.critical ? '#e0ece7' : '#e5eae4'} roughness={0.35} />
      </mesh>

      {/* Ceiling with acoustic medical tile texture (Hidden in Cutaway inspection mode) */}
      {!isCutaway && (
        <mesh position={[0, ceilingH + 0.05, 0]}>
          <boxGeometry args={[w, 0.1, d]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} />
        </mesh>
      )}

      {/* North Wall (Back) with Clinical Dado Rail */}
      <mesh position={[0, ceilingH / 2, -d / 2]} receiveShadow castShadow>
        <boxGeometry args={[w, ceilingH, 0.1]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
      </mesh>
      {/* Decorative Clinical Stripe on Back Wall */}
      <mesh position={[0, 1.2, -d / 2 + 0.06]}>
        <boxGeometry args={[w, 0.14, 0.02]} />
        <meshStandardMaterial color={room.critical ? '#e11d48' : '#0284c7'} />
      </mesh>

      {/* South Wall (Front with Door Entry) - Lowered to boundary curb in Cutaway mode */}
      {!isCutaway ? (
        <group>
          <mesh position={[-w / 3.4, ceilingH / 2, d / 2]} receiveShadow castShadow>
            <boxGeometry args={[w * 0.4, ceilingH, 0.1]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
          </mesh>
          <mesh position={[w / 3.4, ceilingH / 2, d / 2]} receiveShadow castShadow>
            <boxGeometry args={[w * 0.4, ceilingH, 0.1]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
          </mesh>
          <mesh position={[0, ceilingH - 0.4, d / 2]}>
            <boxGeometry args={[w * 0.22, 0.8, 0.1]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
          </mesh>
        </group>
      ) : (
        <mesh position={[0, 0.12, d / 2]} receiveShadow>
          <boxGeometry args={[w, 0.24, 0.12]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>
      )}

      {/* West Wall (Left) */}
      <mesh position={[-w / 2, ceilingH / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.1, ceilingH, d]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
      </mesh>

      {/* East Wall (Right with Window Bay looking outward) */}
      <mesh position={[w / 2, ceilingH / 2, -d / 2 + 0.8]} receiveShadow castShadow>
        <boxGeometry args={[0.1, ceilingH, 1.6]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
      </mesh>
      <mesh position={[w / 2, ceilingH / 2, d / 2 - 0.8]} receiveShadow castShadow>
        <boxGeometry args={[0.1, ceilingH, 1.6]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
      </mesh>
      {/* Window Glass in East Wall */}
      <mesh position={[w / 2, 1.6, 0]}>
        <boxGeometry args={[0.04, 1.4, d - 3.2]} />
        <meshPhysicalMaterial
          color="#93c5fd"
          transmission={0.85}
          roughness={0.1}
          reflectivity={0.7}
        />
      </mesh>

      {/* 4 Interactive Ceiling Troffer Lights */}
      {[-w / 4, w / 4].map((lx, i) => (
        <React.Fragment key={i}>
          <CeilingTroffer
            position={[lx, ceilingH - 0.02, -d / 4]}
            isLit={isLit}
            onToggle={() => onToggleLight(room.id)}
          />
          <CeilingTroffer
            position={[lx, ceilingH - 0.02, d / 4]}
            isLit={isLit}
            onToggle={() => onToggleLight(room.id)}
          />
        </React.Fragment>
      ))}

      {/* HVAC Air Supply Diffusers */}
      <mesh position={[0, ceilingH - 0.02, 0]}>
        <boxGeometry args={[0.6, 0.03, 0.6]} />
        <meshStandardMaterial
          color={room.hvacMode === 'Running' ? '#38bdf8' : room.hvacMode === 'Eco' ? '#34d399' : '#94a3b8'}
          roughness={0.5}
        />
      </mesh>

      {/* Clinical Furniture & Equipment based on Department */}
      {furnitureType === 'ot' && (
        <>
          <ProceduralOperatingTheatre />
          {patientCount >= 1 && (
            <PosedHuman pose="lying_patient" position={[0, 0.95, 0]} clothingColor="#0284c7" />
          )}
          {staffCount >= 1 && (
            <PosedHuman pose="standing_doctor" position={[-0.85, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
          )}
          {staffCount >= 2 && (
            <PosedHuman pose="standing_nurse" position={[0.85, 0, 0.4]} rotation={[0, -Math.PI / 2, 0]} />
          )}
          {staffCount >= 3 && (
            <PosedHuman pose="standing_nurse" position={[-0.85, 0, 0.8]} rotation={[0, Math.PI / 3, 0]} />
          )}
          {staffCount >= 4 && (
            <PosedHuman pose="standing_doctor" position={[0, 0, -1.25]} rotation={[0, 0, 0]} />
          )}
          {staffCount >= 5 && (
            <PosedHuman pose="standing_nurse" position={[1.8, 0, 1.0]} rotation={[0, -Math.PI / 4, 0]} />
          )}
          {staffCount >= 6 && (
            <PosedHuman pose="standing_doctor" position={[-1.8, 0, 1.0]} rotation={[0, Math.PI / 4, 0]} />
          )}
        </>
      )}

      {furnitureType === 'reception' && (
        <>
          <ProceduralReceptionLounge />
          {/* Seated / Standing Reception Staff */}
          {staffCount >= 1 && (
            <PosedHuman pose="seated_receptionist" position={[-0.6, 0, -1.6]} rotation={[0, 0, 0]} />
          )}
          {staffCount >= 2 && (
            <PosedHuman pose="seated_receptionist" position={[0.6, 0, -1.6]} rotation={[0, 0, 0]} />
          )}
          {staffCount >= 3 && (
            <PosedHuman pose="standing_nurse" position={[1.6, 0, -1.6]} rotation={[0, 0, 0]} />
          )}
          {staffCount >= 4 && (
            <PosedHuman pose="seated_receptionist" position={[-1.6, 0, -1.6]} rotation={[0, 0, 0]} />
          )}
          {staffCount >= 5 && (
            <PosedHuman pose="standing_doctor" position={[2.4, 0, -1.0]} rotation={[0, -Math.PI / 2, 0]} />
          )}
          {/* Seated Visitors in Waiting Rows */}
          {Array.from({ length: visitorCount }).map((_, idx) => {
            const row1X = [-1.8, -0.9, 0, 0.9, 1.8];
            const row2X = [-1.8, -0.9, 0, 0.9, 1.8];
            let pos = [0, 0, 1.2];
            let rot = [0, Math.PI, 0];
            if (idx < 5) {
              pos = [row1X[idx], 0, 1.2];
            } else if (idx < 10) {
              pos = [row2X[idx - 5], 0, 2.0];
            } else {
              pos = [idx % 2 === 0 ? -0.6 : 0.6, 0, -0.2 + (idx - 10) * 0.4];
              rot = [0, 0, 0];
            }
            return (
              <PosedHuman
                key={`vis-${idx}`}
                pose="seated_visitor"
                position={pos}
                rotation={rot}
              />
            );
          })}
        </>
      )}

      {furnitureType === 'consultation' && (
        <>
          <ProceduralConsultationSuite />
          {/* Clinical Staff */}
          {staffCount >= 1 && (
            <PosedHuman pose="standing_doctor" position={[0.6, 0, -1.25]} rotation={[0, 0, 0]} />
          )}
          {staffCount >= 2 && (
            <PosedHuman pose="standing_nurse" position={[1.6, 0, -0.8]} rotation={[0, -Math.PI / 2, 0]} />
          )}
          {staffCount >= 3 && (
            <PosedHuman pose="standing_nurse" position={[1.6, 0, 0.4]} rotation={[0, -Math.PI / 2, 0]} />
          )}
          {/* Examination Couch Patient */}
          {patientCount >= 1 && (
            <PosedHuman pose="lying_patient" position={[-1.4, 0.68, 0.3]} />
          )}
          {/* Visitors */}
          {Array.from({ length: visitorCount }).map((_, idx) => {
            const visitorSlots = [
              { pos: [0.3, 0, 0.2], rot: [0, Math.PI, 0] },
              { pos: [0.9, 0, 0.2], rot: [0, Math.PI, 0] },
              { pos: [-0.8, 0, 0.9], rot: [0, -Math.PI / 2, 0] },
              { pos: [-0.8, 0, 1.5], rot: [0, -Math.PI / 2, 0] },
            ];
            const slot = visitorSlots[idx] || { pos: [0.6, 0, 1.2 + idx * 0.4], rot: [0, Math.PI, 0] };
            return (
              <PosedHuman
                key={`vis-cons-${idx}`}
                pose="seated_visitor"
                position={slot.pos}
                rotation={slot.rot}
              />
            );
          })}
        </>
      )}

      {furnitureType === 'ct_scan' && (
        <>
          <ProceduralCTScanner />
          {/* Patient on motorized couch inside / extending from gantry bore */}
          {patientCount >= 1 && (
            <PosedHuman
              pose="lying_patient"
              position={[0, 0.68, -0.1]}
              clothingColor="#7dd3fc"
            />
          )}
          {/* Radiographer / Doctor at operator console behind lead glass partition */}
          {staffCount >= 1 && (
            <PosedHuman
              pose="standing_doctor"
              position={[-3.15, 0, -0.6]}
              rotation={[0, Math.PI / 2, 0]}
            />
          )}
          {staffCount >= 2 && (
            <PosedHuman
              pose="standing_nurse"
              position={[-1.2, 0, 0.1]}
              rotation={[0, Math.PI / 2, 0]}
            />
          )}
          {staffCount >= 3 && (
            <PosedHuman
              pose="standing_nurse"
              position={[-1.2, 0, -1.0]}
              rotation={[0, Math.PI / 2, 0]}
            />
          )}
          {/* Visitors / Companion seated against East wall */}
          {Array.from({ length: visitorCount }).map((_, idx) => {
            const visSlots = [
              { pos: [2.8, 0, 1.0], rot: [0, -Math.PI / 2, 0] },
              { pos: [2.8, 0, 1.7], rot: [0, -Math.PI / 2, 0] },
              { pos: [2.8, 0, 0.3], rot: [0, -Math.PI / 2, 0] },
            ];
            const slot = visSlots[idx] || { pos: [2.8, 0, 2.2], rot: [0, -Math.PI / 2, 0] };
            return (
              <PosedHuman
                key={`vis-ct-${idx}`}
                pose="seated_visitor"
                position={slot.pos}
                rotation={slot.rot}
              />
            );
          })}
        </>
      )}

      {furnitureType === 'xray' && (
        <>
          <ProceduralXRaySuite />
          {patientCount >= 1 && (
            <PosedHuman pose="lying_patient" position={[0, 0.74, 0]} />
          )}
          {staffCount >= 1 && (
            <PosedHuman pose="standing_doctor" position={[-2.2, 0, 0.8]} rotation={[0, Math.PI / 4, 0]} />
          )}
          {staffCount >= 2 && (
            <PosedHuman pose="standing_nurse" position={[-1.2, 0, 0.8]} rotation={[0, Math.PI / 4, 0]} />
          )}
          {Array.from({ length: visitorCount }).map((_, idx) => (
            <PosedHuman
              key={`vis-xray-${idx}`}
              pose="seated_visitor"
              position={[2.6, 0, 1.2 + idx * 0.6]}
              rotation={[0, -Math.PI / 2, 0]}
            />
          ))}
        </>
      )}

      {furnitureType === 'ecg' && (
        <>
          <ProceduralECGStation />
          {patientCount >= 1 && (
            <PosedHuman pose="lying_patient" position={[-0.8, 0.68, 0]} />
          )}
          {staffCount >= 1 && (
            <PosedHuman pose="standing_nurse" position={[0.4, 0, 0.2]} rotation={[0, -0.4, 0]} />
          )}
          {staffCount >= 2 && (
            <PosedHuman pose="standing_doctor" position={[1.4, 0, 0.2]} rotation={[0, -0.4, 0]} />
          )}
          {Array.from({ length: visitorCount }).map((_, idx) => (
            <PosedHuman
              key={`vis-ecg-${idx}`}
              pose="seated_visitor"
              position={[-2.4, 0, 1.2 + idx * 0.6]}
              rotation={[0, Math.PI / 2, 0]}
            />
          ))}
        </>
      )}

      {furnitureType === 'pathology' && (
        <>
          <ProceduralLabSuite />
          {staffCount >= 1 && (
            <PosedHuman pose="standing_doctor" position={[0, 0, 0.9]} rotation={[0, Math.PI, 0]} />
          )}
          {staffCount >= 2 && (
            <PosedHuman pose="standing_nurse" position={[-1.2, 0, 0.9]} rotation={[0, Math.PI, 0]} />
          )}
          {staffCount >= 3 && (
            <PosedHuman pose="standing_nurse" position={[1.2, 0, 0.9]} rotation={[0, Math.PI, 0]} />
          )}
          {staffCount >= 4 && (
            <PosedHuman pose="standing_doctor" position={[-2.4, 0, -0.2]} rotation={[0, Math.PI / 2, 0]} />
          )}
          {patientCount >= 1 && (
            <PosedHuman pose="seated_visitor" position={[2.2, 0, 0.5]} rotation={[0, -Math.PI / 2, 0]} />
          )}
          {Array.from({ length: visitorCount }).map((_, idx) => (
            <PosedHuman
              key={`vis-path-${idx}`}
              pose="seated_visitor"
              position={[2.2, 0, 1.4 + idx * 0.6]}
              rotation={[0, -Math.PI / 2, 0]}
            />
          ))}
        </>
      )}

      {furnitureType === 'dining' && (
        <>
          <ProceduralDiningCafeteria />
          {/* Food Service & Counter Staff (behind counter at z = -2.15, feet on floor) */}
          {staffCount >= 1 && (
            <PosedHuman
              pose="standing_nurse"
              position={[-0.7, 0, -2.15]}
              rotation={[0, 0, 0]}
              clothingColor="#0d9488"
            />
          )}
          {staffCount >= 2 && (
            <PosedHuman
              pose="standing_nurse"
              position={[0.7, 0, -2.15]}
              rotation={[0, 0, 0]}
              clothingColor="#0d9488"
            />
          )}
          {staffCount >= 3 && (
            <PosedHuman
              pose="standing_nurse"
              position={[1.8, 0, -2.15]}
              rotation={[0, 0, 0]}
              clothingColor="#0d9488"
            />
          )}
          {/* Seated Diners on Chairs (Thighs on seat, legs under table, torso & head above table) */}
          {Array.from({ length: visitorCount }).map((_, idx) => {
            if (idx < CAFETERIA_CHAIR_SLOTS.length) {
              const chair = CAFETERIA_CHAIR_SLOTS[idx];
              return (
                <PosedHuman
                  key={`diner-${idx}`}
                  pose="seated_visitor"
                  position={chair.position}
                  rotation={chair.rotation}
                />
              );
            }
            // Standing visitors in line at service counter (feet on floor)
            const queueIdx = idx - CAFETERIA_CHAIR_SLOTS.length;
            return (
              <PosedHuman
                key={`diner-${idx}`}
                pose="seated_visitor"
                position={[0, 0, -0.5 + queueIdx * 0.5]}
                rotation={[0, 0, 0]}
              />
            );
          })}
        </>
      )}

      {furnitureType === 'cssd' && (
        <>
          <ProceduralCSSDAutoclave />
          {staffCount >= 1 && (
            <PosedHuman pose="standing_nurse" position={[-0.9, 0, 0.2]} rotation={[0, 0, 0]} />
          )}
          {staffCount >= 2 && (
            <PosedHuman pose="standing_nurse" position={[0.9, 0, 0.2]} rotation={[0, 0, 0]} />
          )}
          {staffCount >= 3 && (
            <PosedHuman pose="standing_nurse" position={[0, 0, 1.0]} rotation={[0, Math.PI, 0]} />
          )}
          {Array.from({ length: visitorCount }).map((_, idx) => (
            <PosedHuman
              key={`vis-cssd-${idx}`}
              pose="seated_visitor"
              position={[2.4, 0, 1.0 + idx * 0.6]}
              rotation={[0, -Math.PI / 2, 0]}
            />
          ))}
        </>
      )}

      {(furnitureType === 'icu' || furnitureType === 'emergency') && (
        <>
          {(room.bedsList && room.bedsList.length > 0
            ? room.bedsList
            : Array.from({ length: room.beds || 1 }, (_, i) => ({
                id: `${room.id}-B0${i + 1}`,
                label: `ICU Bed ${i + 1}`,
                occupied: i < occupiedBeds,
                bedsideLight: i < occupiedBeds,
              }))
          ).map((bed, idx, arr) => {
            const count = arr.length;
            const spacing = count > 1 ? Math.min(1.9, (w - 2.2) / (count - 1)) : 0;
            const startX = -((count - 1) * spacing) / 2;
            const bedX = count === 1 ? 0 : startX + idx * spacing;

            return (
              <ProceduralICUComplex
                key={bed.id}
                position={[bedX, 0, -0.5]}
                bedData={bed}
                onToggleBedLight={onToggleBedLight}
                occupied={bed.occupied}
                showCrashCart={idx === 0}
              />
            );
          })}
          {/* ICU Clinical Staff */}
          {staffCount >= 1 && (
            <PosedHuman pose="standing_nurse" position={[-2.0, 0, 1.1]} rotation={[0, -0.5, 0]} />
          )}
          {staffCount >= 2 && (
            <PosedHuman pose="standing_doctor" position={[0.6, 0, 1.1]} rotation={[0, 0.5, 0]} />
          )}
          {staffCount >= 3 && (
            <PosedHuman pose="standing_nurse" position={[2.2, 0, 1.1]} rotation={[0, 0, 0]} />
          )}
          {staffCount >= 4 && (
            <PosedHuman pose="standing_doctor" position={[-0.8, 0, 1.1]} rotation={[0, 0, 0]} />
          )}
          {/* ICU Bedside Visitors */}
          {Array.from({ length: visitorCount }).map((_, idx) => {
            const vSlots = [
              { pos: [3.2, 0, 1.0], rot: [0, -Math.PI / 2, 0] },
              { pos: [3.2, 0, 1.6], rot: [0, -Math.PI / 2, 0] },
              { pos: [-1.2, 0, 1.8], rot: [0, 0, 0] },
              { pos: [1.2, 0, 1.8], rot: [0, 0, 0] },
            ];
            const slot = vSlots[idx] || { pos: [2.5, 0, 2.0], rot: [0, 0, 0] };
            return (
              <PosedHuman
                key={`vis-icu-${idx}`}
                pose="seated_visitor"
                position={slot.pos}
                rotation={slot.rot}
              />
            );
          })}
        </>
      )}

      {(furnitureType === 'ward' || furnitureType === 'semi_private' || furnitureType === 'recovery') && (
        <group position={[0, 0, 0]}>
          {(room.bedsList && room.bedsList.length > 0
            ? room.bedsList
            : Array.from({ length: room.beds || 2 }, (_, i) => ({
                id: `${room.id}-B0${i + 1}`,
                label: `Bed ${i + 1}`,
                occupied: i < occupiedBeds,
                bedsideLight: i < occupiedBeds,
              }))
          ).map((bed, idx, arr) => {
            const count = arr.length;
            const spacing = count > 1 ? Math.min(2.0, (w - 2.2) / (count - 1)) : 0;
            const startX = -((count - 1) * spacing) / 2;
            const bedX = count === 1 ? 0 : startX + idx * spacing;

            return (
              <ProceduralHospitalBed
                key={bed.id}
                position={[bedX, 0, -0.4]}
                bedData={bed}
                onToggleBedLight={onToggleBedLight}
                occupied={bed.occupied}
              />
            );
          })}
          {/* Ward Clinical Staff */}
          {staffCount >= 1 && (
            <PosedHuman pose="standing_nurse" position={[-1.6, 0, 1.1]} rotation={[0, -Math.PI / 2, 0]} />
          )}
          {staffCount >= 2 && (
            <PosedHuman pose="standing_doctor" position={[0.8, 0, 1.1]} rotation={[0, Math.PI / 2, 0]} />
          )}
          {staffCount >= 3 && (
            <PosedHuman pose="standing_nurse" position={[2.2, 0, 1.1]} rotation={[0, 0, 0]} />
          )}
          {staffCount >= 4 && (
            <PosedHuman pose="standing_nurse" position={[-2.6, 0, 1.1]} rotation={[0, 0, 0]} />
          )}
          {/* Ward Visitors */}
          {Array.from({ length: visitorCount }).map((_, idx) => {
            const wardSlots = [
              { pos: [3.2, 0, 1.0], rot: [0, -Math.PI / 2, 0] },
              { pos: [3.2, 0, 1.6], rot: [0, -Math.PI / 2, 0] },
              { pos: [-2.8, 0, 1.0], rot: [0, Math.PI / 2, 0] },
              { pos: [-2.8, 0, 1.6], rot: [0, Math.PI / 2, 0] },
            ];
            const slot = wardSlots[idx] || { pos: [idx % 2 === 0 ? -1.0 : 1.0, 0, 2.0], rot: [0, 0, 0] };
            return (
              <PosedHuman
                key={`vis-ward-${idx}`}
                pose="seated_visitor"
                position={slot.pos}
                rotation={slot.rot}
              />
            );
          })}
        </group>
      )}

      {/* Fallback for other rooms: consultation layout */}
      {!['ot', 'reception', 'consultation', 'ct_scan', 'xray', 'ecg', 'pathology', 'dining', 'cssd', 'icu', 'emergency', 'ward', 'semi_private', 'recovery'].includes(furnitureType) && (
        <>
          <ProceduralConsultationSuite />
          {staffCount >= 1 && (
            <PosedHuman pose="standing_doctor" position={[0.6, 0, -1.25]} rotation={[0, 0, 0]} />
          )}
          {staffCount >= 2 && (
            <PosedHuman pose="standing_nurse" position={[1.6, 0, -0.8]} rotation={[0, -Math.PI / 2, 0]} />
          )}
          {staffCount >= 3 && (
            <PosedHuman pose="standing_nurse" position={[-1.4, 0, 0.8]} rotation={[0, 0, 0]} />
          )}
          {Array.from({ length: visitorCount }).map((_, idx) => (
            <PosedHuman
              key={`vis-fb-${idx}`}
              pose="seated_visitor"
              position={[0.3 + idx * 0.6, 0, 0.2]}
              rotation={[0, Math.PI, 0]}
            />
          ))}
        </>
      )}

      {/* Lighting setup inside the room */}
      <ambientLight intensity={isLit ? 1.05 : 0.16} />
      {isLit && (
        <directionalLight position={[0, 2.9, 0]} intensity={1.3} castShadow />
      )}
    </group>
  );
}

// Complete Coherent CDSIMER 3D Shell
function CoherentHospitalShell({
  selectedFloor,
  setSelectedFloor,
  selectedRoomId,
  setSelectedRoomId,
  viewMode,
  heatmapMode,
  showLabels,
  modelLayer,
  onDoubleClickRoom,
  rooms = [],
}) {
  const [hoveredRoomId, setHoveredRoomId] = useState(null);

  const getYForLevel = (index) => {
    if (viewMode === 'floor') {
      const selectedIndex = architecturalFloors.findIndex((f) => f.id === selectedFloor);
      return index === selectedIndex ? 0.45 : -999;
    }
    return index * 1.9 + 0.8;
  };

  const handleRoomSelect = (room) => {
    setSelectedRoomId(room.id);
    setSelectedFloor(room.floorId);
  };

  return (
    <group position={[0, 0, 0]}>
      {/* Ground Foundation Slab (Whole Building Mode) */}
      {viewMode === 'building' && (
        <mesh position={[0, -0.15, 0]} receiveShadow>
          <boxGeometry args={[38.0, 0.3, 20.0]} />
          <meshStandardMaterial color="#cbd3cb" roughness={0.92} />
        </mesh>
      )}

      {/* Selected Floor Presentation Plinth (Isolated Cutaway Mode) */}
      {viewMode === 'floor' && (
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.16, 0]} receiveShadow>
            <boxGeometry args={[33.2, 0.32, 15.2]} />
            <meshStandardMaterial color="#ded8cb" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.02, 0]} receiveShadow>
            <boxGeometry args={[34.6, 0.08, 16.6]} />
            <meshStandardMaterial color="#c5baa7" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* Render architectural floors */}
      {architecturalFloors.map((floor, index) => {
        const displayY = getYForLevel(index);
        if (displayY < -500) return null;

        return (
          <ArchitecturalFloorLevel
            key={floor.id}
            floorData={floor}
            displayY={displayY}
            isSelected={selectedFloor === floor.id}
            selectedRoomId={selectedRoomId}
            hoveredRoomId={hoveredRoomId}
            setHoveredRoomId={setHoveredRoomId}
            onSelectRoom={handleRoomSelect}
            onDoubleClickRoom={onDoubleClickRoom}
            onSelectFloor={setSelectedFloor}
            viewMode={viewMode}
            heatmapMode={heatmapMode}
            showLabels={showLabels}
            rooms={rooms}
          />
        );
      })}

      {/* Ground Level Entrance Portico & Colonnade (Front Center - Whole Building Mode) */}
      {viewMode === 'building' && (
        <group position={[0, 0, 7.0]}>
          {/* Grand Entrance Podium Steps & Plaza Landscaping */}
          <EntrancePodiumAndPlaza />

          {/* Dedicated Emergency Walk-In Entrance (Left Side of Facade) */}
          <EmergencyWalkInEntrance position={[-12.8, 0, 0]} />

          {/* Portico Base Slab */}
          <mesh position={[0, 0.45, 1.8]} receiveShadow castShadow>
            <boxGeometry args={[8.8, 0.9, 3.8]} />
            <meshStandardMaterial color="#dfd8cb" roughness={0.7} />
          </mesh>

          {/* 4 Classical Columns at Entrance */}
          {[-3.0, -1.0, 1.0, 3.0].map((x) => (
            <ClassicalColumn key={`portico-col-${x}`} x={x} y={0.9} z={3.4} height={1.75} radius={0.22} />
          ))}

          {/* Portico Architrave & Entablature */}
          <mesh position={[0, 2.72, 1.8]} castShadow>
            <boxGeometry args={[9.0, 0.24, 3.8]} />
            <meshStandardMaterial color="#f0ece2" roughness={0.65} />
          </mesh>

          {/* Triangular Pediment above Entrance Colonnade */}
          <ClassicalPediment x={0} y={2.84} z={3.7} width={8.8} height={1.35} depth={0.26} />

          {/* Main Glass Doors */}
          <mesh position={[0, 1.35, 0.1]}>
            <boxGeometry args={[3.2, 1.8, 0.08]} />
            <meshPhysicalMaterial color="#4b443c" roughness={0.2} transmission={0.2} metalness={0.3} />
          </mesh>

          {/* Institutional Building Sign Plaque (Physical 3D Architecture) */}
          <group position={[0, 2.55, 3.82]}>
            <mesh castShadow>
              <boxGeometry args={[4.2, 0.44, 0.06]} />
              <meshStandardMaterial color="#8C733E" metalness={0.8} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0, 0.035]}>
              <boxGeometry args={[4.05, 0.34, 0.02]} />
              <meshStandardMaterial color="#2c221a" roughness={0.4} />
            </mesh>
            {/* Front gold architectural lettering plaque */}
            <mesh position={[0, 0, 0.048]}>
              <boxGeometry args={[3.2, 0.16, 0.015]} />
              <meshStandardMaterial color="#C5A04F" metalness={0.9} roughness={0.2} emissive="#C5A04F" emissiveIntensity={0.25} />
            </mesh>
          </group>
        </group>
      )}

      {/* Top Roofline Pediment, Classical Centerpiece & Solar PV Array (Whole Building Mode) */}
      {viewMode === 'building' && (
        <group position={[0, 8.4, 0]}>
          {/* Main Roof Slab */}
          <mesh position={[0, 0.08, 0]} castShadow>
            <boxGeometry args={[32.4, 0.18, 14.4]} />
            <meshStandardMaterial color="#eee9df" roughness={0.6} />
          </mesh>

          {/* Central Classical Roof Pediment Block */}
          <mesh position={[0, 0.8, 0]} castShadow>
            <boxGeometry args={[8.0, 1.4, 7.2]} />
            <meshStandardMaterial color="#dfd8cb" roughness={0.7} />
          </mesh>

          {/* Upper 4 Columns */}
          {[-2.7, -0.9, 0.9, 2.7].map((x) => (
            <ClassicalColumn key={`roof-col-${x}`} x={x} y={0.18} z={3.65} height={1.25} radius={0.16} />
          ))}

          {/* Top Classical Pediment */}
          <ClassicalPediment x={0} y={1.5} z={3.68} width={8.2} height={1.4} depth={0.24} />

          {/* Parapet Balustrades along East and West roof decks */}
          <RoofParapetBalustrade x={-10.6} z={0} width={10.6} depth={13.8} />
          <RoofParapetBalustrade x={10.6} z={0} width={10.6} depth={13.8} />

          {/* Proposed Rooftop Photovoltaic Solar Array (25 kWp Digital Twin Installation) */}
          <RooftopSolarArray />
        </group>
      )}
    </group>
  );
}

// Scene Error Boundary: Diagnoses WebGL failures explicitly without masquerading photos as 3D twin
class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showReferencePhoto: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(err, errorInfo) {
    console.error('Three.js 3D Canvas rendering error:', err, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      const isWebGLAvailable = (() => {
        try {
          const c = document.createElement('canvas');
          return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
        } catch {
          return false;
        }
      })();

      return (
        <div className="scene-diagnostic-fallback" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '480px', background: '#1c1917', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f8fafc', padding: '24px', boxSizing: 'border-box' }}>
          {this.state.showReferencePhoto ? (
            <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '440px' }}>
              <img
                src="/references/appearance/cdsimer-exterior-reference.webp"
                alt="CDsimer architectural reference"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
              />
              <button
                onClick={() => this.setState({ showReferencePhoto: false })}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(15,23,42,0.9)', color: '#fff', border: '1px solid #475569', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}
              >
                ✕ Back to Diagnostics
              </button>
            </div>
          ) : (
            <div style={{ maxWidth: '640px', width: '100%', background: '#0f172a', border: '1px solid #ef4444', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f87171' }}>
                  Three.js 3D Viewport Diagnostics
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 14px 0' }}>
                The 3D Canvas encountered a rendering error. Browser WebGL driver status is{' '}
                <strong style={{ color: isWebGLAvailable ? '#34d399' : '#f87171' }}>
                  {isWebGLAvailable ? 'Active & Hardware Accelerated' : 'Unavailable in this environment'}
                </strong>.
              </p>
              <div style={{ background: '#020617', padding: '12px', borderRadius: '6px', border: '1px solid #334155', fontFamily: 'monospace', fontSize: '12px', color: '#fca5a5', marginBottom: '16px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                {this.state.error?.name}: {this.state.error?.message || 'Three.js / WebGL exception'}
                {this.state.error?.stack && (
                  <div style={{ marginTop: '8px', color: '#94a3b8', fontSize: '11px', maxHeight: '120px', overflowY: 'auto' }}>
                    {this.state.error.stack}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => this.setState({ hasError: false, error: null })}
                  style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}
                >
                  ↺ Retry 3D Engine
                </button>
                <button
                  onClick={() => this.setState({ showReferencePhoto: true })}
                  style={{ background: '#334155', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '6px', padding: '8px 16px', fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}
                >
                  View Architectural Photo Reference
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// 4 Architectural Floors Navigation & Reference Data
const floorCardsData = [
  {
    id: 'F3',
    level: 'L3',
    name: 'THIRD FLOOR (L3)',
    index: 3,
    zones: 10,
    departments: 'ICU, Operating Theatres (OT 1 & 2), CSSD, Recovery',
    tag: 'Critical Care & Surgical',
    anchorY: 7.35, // 6.5 + 0.85
  },
  {
    id: 'F2',
    level: 'L2',
    name: 'SECOND FLOOR (L2)',
    index: 2,
    zones: 10,
    departments: 'Inpatient Wards, Semi-Private, Pediatric Care, Recovery',
    tag: 'Inpatient Care',
    anchorY: 5.45, // 4.6 + 0.85
  },
  {
    id: 'F1',
    level: 'L1',
    name: 'FIRST FLOOR (L1)',
    index: 1,
    zones: 10,
    departments: 'Pathology Lab, Blood Bank, Cardiology & Pulmonology OPD',
    tag: 'Diagnostics & Specialist OPD',
    anchorY: 3.55, // 2.7 + 0.85
  },
  {
    id: 'GF',
    level: 'L0',
    name: 'GROUND FLOOR (L0)',
    index: 0,
    zones: 10,
    departments: 'Emergency & Trauma, Radiology (CT & X-Ray), Reception, Pharmacy',
    tag: 'Emergency & Ambulatory',
    anchorY: 1.65, // 0.8 + 0.85
  },
];

// 3D Physical Brass Anchor Pins on floor slab edges in Three.js
function FloorWorldPinsGroup({ selectedFloor, viewMode, showLabels = true }) {
  if (!showLabels) return null;

  if (viewMode === 'floor') {
    const anchorY = 1.30;
    const anchorX = -16.02;
    const anchorZ = 1.5;
    return (
      <group position={[anchorX, anchorY, anchorZ]}>
        <mesh>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial
            color="#C5A04F"
            emissive="#C5A04F"
            emissiveIntensity={0.7}
            roughness={0.25}
            metalness={0.85}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <ringGeometry args={[0.18, 0.26, 16]} />
          <meshBasicMaterial color="#C5A04F" side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[0, 0, 0]}>
      {floorCardsData.map((floor) => {
        const anchorX = -16.02;
        const anchorY = floor.anchorY;
        const anchorZ = 1.5;
        const isSelected = selectedFloor === floor.id;

        return (
          <group key={floor.id} position={[anchorX, anchorY, anchorZ]}>
            <mesh>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial
                color={isSelected ? '#C5A04F' : '#8C733E'}
                emissive={isSelected ? '#C5A04F' : '#000000'}
                emissiveIntensity={isSelected ? 0.6 : 0}
                roughness={0.3}
                metalness={0.8}
              />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <ringGeometry args={[0.16, 0.24, 16]} />
              <meshBasicMaterial color={isSelected ? '#C5A04F' : '#8C733E'} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// 3D Anchor Projector: dynamically projects 3D slab anchor coordinates to screen pixels
function FloorAnchorsProjector({ viewMode, selectedFloor, sceneFrameRef, showLabels }) {
  const { camera, gl } = useThree();

  useFrame(() => {
    if (!showLabels || !gl.domElement || !sceneFrameRef?.current) return;
    const frameRect = sceneFrameRef.current.getBoundingClientRect();
    const canvasRect = gl.domElement.getBoundingClientRect();
    if (frameRect.width === 0 || frameRect.height === 0) return;

    const offsetX = canvasRect.left - frameRect.left;
    const offsetY = canvasRect.top - frameRect.top;
    const width = canvasRect.width;
    const height = canvasRect.height;

    const list = viewMode === 'floor'
      ? [{ id: selectedFloor || 'GF', y: 1.30 }]
      : [
          { id: 'F3', y: 7.35 },
          { id: 'F2', y: 5.45 },
          { id: 'F1', y: 3.55 },
          { id: 'GF', y: 1.65 },
        ];

    // Clear connector lines for floors not currently active/drawn
    ['F3', 'F2', 'F1', 'GF'].forEach(fid => {
      if (!list.some(item => item.id === fid)) {
        const pathEl = document.getElementById(`connector-path-${fid}`);
        const circleEl = document.getElementById(`connector-dot-${fid}`);
        const startDotEl = document.getElementById(`connector-start-${fid}`);
        if (pathEl) pathEl.setAttribute('d', '');
        if (circleEl) circleEl.setAttribute('opacity', '0');
        if (startDotEl) startDotEl.setAttribute('opacity', '0');
      }
    });

    list.forEach(({ id, y }) => {
      const v = new THREE.Vector3(-16.02, y, 1.5);
      v.project(camera);
      const targetX = offsetX + (v.x * 0.5 + 0.5) * width;
      const targetY = offsetY + (-(v.y * 0.5) + 0.5) * height;

      const cardEl = document.getElementById(`floor-rail-card-${id}`);
      const pathEl = document.getElementById(`connector-path-${id}`);
      const circleEl = document.getElementById(`connector-dot-${id}`);
      const startDotEl = document.getElementById(`connector-start-${id}`);

      if (cardEl && pathEl && circleEl) {
        const cRect = cardEl.getBoundingClientRect();
        const cardRightX = cRect.right - frameRect.left;
        const cardCenterY = cRect.top - frameRect.top + cRect.height / 2;

        const jogX = Math.min(cardRightX + 22, targetX - 4);
        const d = `M ${cardRightX} ${cardCenterY} L ${jogX} ${cardCenterY} L ${targetX} ${targetY}`;
        pathEl.setAttribute('d', d);
        circleEl.setAttribute('cx', String(targetX));
        circleEl.setAttribute('cy', String(targetY));
        if (startDotEl) {
          startDotEl.setAttribute('cx', String(cardRightX));
          startDotEl.setAttribute('cy', String(cardCenterY));
          startDotEl.setAttribute('opacity', '1');
        }

        const isVisible = v.z < 1.0;
        pathEl.setAttribute('opacity', isVisible ? '0.85' : '0.2');
        circleEl.setAttribute('opacity', isVisible ? '1' : '0.2');
      }
    });
  });

  return null;
}

// Dedicated Side Rail for Floor Labels (placed inside scene frame on the left)
function DedicatedFloorRail({
  selectedFloor,
  onSelectFloor,
  viewMode,
  onReturnToBuilding,
}) {
  return (
    <div className="floor-label-rail" style={{ top: '12px' }}>
      {/* Return to Whole Building Action */}
      <button
        className={`btn-rail-building ${viewMode === 'building' ? 'active' : ''}`}
        onClick={onReturnToBuilding}
        id="rail-btn-whole-building"
        title="Whole Hospital Building Shell (All 4 Floors Stacked)"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building2 size={13} />
          <span>Whole Building</span>
        </div>
        {viewMode === 'floor' ? (
          <RotateCcw size={11} color="#B88A3B" />
        ) : (
          <span style={{ fontSize: '9px', color: '#059669', fontWeight: 800 }}>● Active</span>
        )}
      </button>

      {/* 4 Architectural Floor Cards (L3 down to L0) */}
      {floorCardsData.map((floor) => {
        const isCutawayActive = viewMode === 'floor' && selectedFloor === floor.id;
        return (
          <div
            key={floor.id}
            id={`floor-rail-card-${floor.id}`}
            className={`floor-rail-card ${isCutawayActive ? 'active-level' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectFloor(floor.id);
            }}
            title={`Click to inspect ${floor.name} (${floor.zones} configured zones)`}
          >
            <div className="frc-row-top">
              <span className="frc-badge">{floor.level}</span>
              <strong className="frc-name">{floor.name}</strong>
              <span className={`frc-zones ${isCutawayActive ? 'active' : ''}`}>
                {isCutawayActive ? '● Active' : `${floor.zones} Zones`}
              </span>
            </div>
            <div className="frc-summary" title={floor.departments}>
              {floor.departments}
            </div>
            <div className="frc-row-action">
              <span className="frc-action">
                {isCutawayActive ? '● Isolated Cutaway' : 'Inspect floor →'}
              </span>
            </div>
            <div className="frc-connector-dot" />
          </div>
        );
      })}
    </div>
  );
}

// SVG Connectors Layer: draws thin connectors linking rail cards to 3D floor anchors
function FloorConnectorsOverlay({ viewMode, selectedFloor }) {
  const floorIds = ['F3', 'F2', 'F1', 'GF'];

  return (
    <svg className="floor-connectors-layer" aria-hidden="true">
      <defs>
        <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {floorIds.map((id) => {
        const isSelected = selectedFloor === id;
        const strokeColor = isSelected ? '#C5A04F' : '#8C733E';
        return (
          <g key={id} id={`connector-group-${id}`}>
            <path
              id={`connector-path-${id}`}
              d=""
              fill="none"
              stroke={strokeColor}
              strokeWidth={isSelected ? 1.8 : 1.1}
              strokeDasharray={isSelected ? 'none' : '3 2'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              id={`connector-start-${id}`}
              cx="0"
              cy="0"
              r={isSelected ? 3 : 2}
              fill={strokeColor}
            />
            <circle
              id={`connector-dot-${id}`}
              cx="0"
              cy="0"
              r={isSelected ? 4 : 2.5}
              fill={strokeColor}
              filter={isSelected ? 'url(#glow-gold)' : undefined}
            />
          </g>
        );
      })}
    </svg>
  );
}

export default function HospitalScene({
  selectedFloor: propSelectedFloor,
  setSelectedFloor: propSetSelectedFloor,
  selectedRoomId: propSelectedRoomId,
  setSelectedRoomId: propSetSelectedRoomId,
  viewMode: propViewMode,
  setViewMode: propSetViewMode,
  heatmapMode: propHeatmapMode,
  setHeatmapMode: propSetHeatmapMode,
  modelLayer: propModelLayer,
  setModelLayer: propSetModelLayer,
  show3dLabels: propShow3dLabels,
  setShow3dLabels: propSetShow3dLabels,
  isImmersive: propIsImmersive,
  setIsImmersive: propSetIsImmersive,
  rooms = [],
  updateRoom = () => {},
  showControls = true,
}) {
  const [internalFloor, setInternalFloor] = useState(propSelectedFloor || 'GF');
  const [internalRoomId, setInternalRoomId] = useState(propSelectedRoomId || null);
  const [internalViewMode, setInternalViewMode] = useState(propViewMode || 'building');
  const [internalHeatmapMode, setInternalHeatmapMode] = useState(propHeatmapMode || 'Normal');
  const [internalModelLayer, setInternalModelLayer] = useState(propModelLayer || 'LayerB');
  const [internalShowLabels, setInternalShowLabels] = useState(propShow3dLabels !== undefined ? propShow3dLabels : true);
  const [internalIsImmersive, setInternalIsImmersive] = useState(propIsImmersive || false);

  const selectedFloor = propSelectedFloor !== undefined ? propSelectedFloor : internalFloor;
  const setSelectedFloor = (val) => {
    setInternalFloor(val);
    if (typeof propSetSelectedFloor === 'function') propSetSelectedFloor(val);
  };

  const selectedRoomId = propSelectedRoomId !== undefined ? propSelectedRoomId : internalRoomId;
  const setSelectedRoomId = (val) => {
    setInternalRoomId(val);
    if (typeof propSetSelectedRoomId === 'function') propSetSelectedRoomId(val);
  };

  const viewMode = propViewMode !== undefined ? propViewMode : internalViewMode;
  const setViewMode = (val) => {
    setInternalViewMode(val);
    if (typeof propSetViewMode === 'function') propSetViewMode(val);
  };

  const heatmapMode = propHeatmapMode !== undefined ? propHeatmapMode : internalHeatmapMode;
  const setHeatmapMode = (val) => {
    setInternalHeatmapMode(val);
    if (typeof propSetHeatmapMode === 'function') propSetHeatmapMode(val);
  };

  const modelLayer = propModelLayer !== undefined ? propModelLayer : internalModelLayer;
  const setModelLayer = (val) => {
    setInternalModelLayer(val);
    if (typeof propSetModelLayer === 'function') propSetModelLayer(val);
  };

  const show3dLabels = propShow3dLabels !== undefined ? propShow3dLabels : internalShowLabels;
  const setShow3dLabels = (val) => {
    setInternalShowLabels(val);
    if (typeof propSetShow3dLabels === 'function') propSetShow3dLabels(val);
  };

  const isImmersive = propIsImmersive !== undefined ? propIsImmersive : internalIsImmersive;
  const setIsImmersive = (val) => {
    setInternalIsImmersive(val);
    if (typeof propSetIsImmersive === 'function') propSetIsImmersive(val);
  };

  const [walkthroughMode, setWalkthroughMode] = useState('first_person'); // 'first_person' | 'cutaway'
  const [activePreset, setActivePreset] = useState('entry'); // 'entry' | 'opposite' | 'left' | 'right' | 'center'

  useEffect(() => {
    if (isImmersive) {
      setWalkthroughMode('first_person');
      setActivePreset('entry');
    }
  }, [isImmersive, selectedRoomId]);

  const [cameraAngle, setCameraAngle] = useState('perspective');
  const controlsRef = useRef(null);

  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId) || rooms[0] || null;
  }, [rooms, selectedRoomId]);

  const walkthroughSpawnPos = useMemo(() => {
    if (!selectedRoom) return [0, 1.6, 2.2];
    const cfg = getRoomWalkthroughConfig(selectedRoom);
    return cfg.presets.entry.position;
  }, [selectedRoom]);

  const resetCamera = () => {
    setCameraAngle('perspective');
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleToggleLight = (roomId) => {
    updateRoom(roomId, r => ({ ...r, lightOn: !r.lightOn }));
  };

  const handleToggleBedLight = (bedId) => {
    if (!selectedRoomId) return;
    updateRoom(selectedRoomId, r => ({
      ...r,
      bedsList: r.bedsList?.map(b => b.id === bedId ? { ...b, bedsideLight: !b.bedsideLight } : b)
    }));
  };

  const handleAddPerson = () => {
    if (!selectedRoomId) return;
    updateRoom(selectedRoomId, r => {
      if (r.people >= r.capacity) return r;
      return syncRoomOccupancy(r, { visitors: (r.visitors || 0) + 1 });
    });
  };

  const handleRemovePerson = () => {
    if (!selectedRoomId) return;
    updateRoom(selectedRoomId, r => {
      if (r.people <= 0) return r;
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

  const sceneFrameRef = useRef(null);

  const handleSelectFloor = (floorId) => {
    setSelectedFloor(floorId);
    setViewMode('floor');
    setCameraAngle('perspective');
  };

  const handleReturnToBuilding = () => {
    setViewMode('building');
    setCameraAngle('perspective');
  };

  return (
    <div className="hospital-scene-root">
      {/* 3D Scene Action Toolbar: In dedicated reserved container outside the canvas */}
      {showControls && !isImmersive && (
        <div className="scene-action-toolbar">
          {/* 1. Floor Navigation Group */}
          <div className="scene-toolbar-group">
            <span className="toolbar-label">FLOORS:</span>
            <button
              className={`toolbar-btn ${viewMode === 'building' ? 'active' : ''}`}
              onClick={handleReturnToBuilding}
              id="tb-btn-building"
              title="Full 3D Hospital Shell (All Floors Stacked)"
            >
              Whole Building
            </button>
            <button
              className={`toolbar-btn ${viewMode === 'floor' && selectedFloor === 'GF' ? 'active' : ''}`}
              onClick={() => handleSelectFloor('GF')}
              id="tb-btn-gf"
              title="Ground Floor (L0) OPD & Emergency Cutaway"
            >
              Ground Floor
            </button>
            <button
              className={`toolbar-btn ${viewMode === 'floor' && selectedFloor === 'F1' ? 'active' : ''}`}
              onClick={() => handleSelectFloor('F1')}
              id="tb-btn-f1"
              title="First Floor (L1) Diagnostics & Consultation Cutaway"
            >
              First Floor
            </button>
            <button
              className={`toolbar-btn ${viewMode === 'floor' && selectedFloor === 'F2' ? 'active' : ''}`}
              onClick={() => handleSelectFloor('F2')}
              id="tb-btn-f2"
              title="Second Floor (L2) Inpatient Wards Cutaway"
            >
              Second Floor
            </button>
            <button
              className={`toolbar-btn ${viewMode === 'floor' && selectedFloor === 'F3' ? 'active' : ''}`}
              onClick={() => handleSelectFloor('F3')}
              id="tb-btn-f3"
              title="Third Floor (L3) ICU & Surgical Cutaway"
            >
              Third Floor
            </button>
          </div>

          {/* 2. Display Layer Group */}
          <div className="scene-toolbar-group">
            <span className="toolbar-label">LAYER:</span>
            <button
              className={`toolbar-btn ${modelLayer === 'LayerA' ? 'active' : ''}`}
              onClick={() => setModelLayer('LayerA')}
              id="tb-btn-layer-a"
              title="Documented Architectural Reference Baseline"
            >
              🏛️ Reference Baseline
            </button>
            <button
              className={`toolbar-btn ${modelLayer === 'LayerB' ? 'active' : ''}`}
              onClick={() => setModelLayer('LayerB')}
              id="tb-btn-layer-b"
              title="Proposed Digital Twin Simulation Layer"
            >
              🌱 Proposed Digital Twin
            </button>
          </div>

          {/* 3. Heatmap Modes Group */}
          <div className="scene-toolbar-group">
            <span className="toolbar-label">HEATMAP:</span>
            {[
              { id: 'Normal', label: 'Architecture' },
              { id: 'Energy', label: '⚡ Energy' },
              { id: 'Occupancy', label: '👥 Occupancy' },
              { id: 'Devices', label: '📶 IoT Health' },
              { id: 'Water', label: '💧 Water' }
            ].map((hm) => (
              <button
                key={hm.id}
                className={`toolbar-btn ${(heatmapMode === hm.id || (hm.id === 'Normal' && heatmapMode === 'Architecture')) ? 'active' : ''}`}
                onClick={() => setHeatmapMode(hm.id)}
                id={`tb-hm-${hm.id.toLowerCase()}`}
              >
                {hm.label}
              </button>
            ))}
          </div>

          {/* 4. Camera Controls Group */}
          <div className="scene-toolbar-group">
            <span className="toolbar-label">CAMERA:</span>
            <button
              className={`toolbar-btn ${cameraAngle === 'perspective' ? 'active' : ''}`}
              onClick={() => setCameraAngle('perspective')}
              id="tb-cam-3d"
              title="Default Perspective Isometric 3D Angle"
            >
              3D Angle
            </button>
            <button
              className={`toolbar-btn ${cameraAngle === 'topDown' ? 'active' : ''}`}
              onClick={() => setCameraAngle('topDown')}
              id="tb-cam-topdown"
              title="Top-Down Orthogonal Floor Plan View"
            >
              Top-Down
            </button>
            <button
              className={`toolbar-btn ${cameraAngle === 'front' ? 'active' : ''}`}
              onClick={() => setCameraAngle('front')}
              id="tb-cam-front"
              title="Front Classical Entrance Elevation"
            >
              Front Facade
            </button>
            <button
              className="toolbar-btn reset"
              onClick={resetCamera}
              id="tb-cam-reset"
              title="Reset 3D Camera View to Default"
            >
              <RotateCcw size={12} /> Reset View
            </button>
            <button
              className={`toolbar-btn ${show3dLabels ? 'active' : ''}`}
              onClick={() => setShow3dLabels(!show3dLabels)}
              id="tb-labels-toggle"
              title="Toggle 3D Floating Room Badges and Floor Rail"
            >
              {show3dLabels ? <Eye size={12} /> : <EyeOff size={12} />} {show3dLabels ? 'Labels ON' : 'Labels OFF'}
            </button>
          </div>
        </div>
      )}

      {/* 3D WebGL Scene Viewport */}
      <div
        ref={sceneFrameRef}
        className={`scene-frame ${isImmersive ? 'immersive-active' : ''}`}
      >


      {/* Floating Heatmap Legend (when a heatmap is active) */}
      {showControls && !isImmersive && (heatmapMode !== 'Normal' && heatmapMode !== 'Architecture') && (
        <div className="heatmap-floating-legend">
          <div className="legend-title">
            <strong>{heatmapMode === 'Energy' ? '⚡ Energy Heatmap' : heatmapMode === 'Occupancy' ? '👥 Occupancy Heatmap' : (heatmapMode === 'Devices' || heatmapMode === 'IoT Health') ? '📶 IoT Device Health' : '💧 Water Flow Intensity'}</strong>
          </div>
          <div className="legend-items">
            {heatmapMode === 'Energy' && (
              <>
                <span className="legend-chip"><span className="legend-box" style={{ background: '#E8DDC6' }} /> Low (&lt;1.5 kW)</span>
                <span className="legend-chip"><span className="legend-box" style={{ background: '#C5A04F' }} /> Moderate (1.5–3.0 kW)</span>
                <span className="legend-chip"><span className="legend-box" style={{ background: '#B88A3B' }} /> High (&gt;3.0 kW)</span>
              </>
            )}
            {heatmapMode === 'Occupancy' && (
              <>
                <span className="legend-chip"><span className="legend-box" style={{ background: '#F7F3E9' }} /> Empty (0)</span>
                <span className="legend-chip"><span className="legend-box" style={{ background: '#D8AB56' }} /> Moderate (1–50%)</span>
                <span className="legend-chip"><span className="legend-box" style={{ background: '#A65D2C' }} /> High (&gt;50%)</span>
              </>
            )}
            {(heatmapMode === 'Devices' || heatmapMode === 'IoT Health') && (
              <>
                <span className="legend-chip"><span className="legend-box" style={{ background: '#E0E8DE' }} /> All Online</span>
                <span className="legend-chip"><span className="legend-box" style={{ background: '#D4533B' }} /> Offline Warning</span>
              </>
            )}
            {heatmapMode === 'Water' && (
              <>
                <span className="legend-chip"><span className="legend-box" style={{ background: '#F7F3E9' }} /> Minimal / Dry (&lt;5 L/h)</span>
                <span className="legend-chip"><span className="legend-box" style={{ background: '#7EABC0' }} /> Moderate (5–15 L/h)</span>
                <span className="legend-chip"><span className="legend-box" style={{ background: '#3B7B9E' }} /> High (&gt;15 L/h CSSD/Dialysis)</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 3D WebGL Canvas */}
      <SceneErrorBoundary>
        <Canvas
          shadows
          camera={
            isImmersive
              ? { position: walkthroughSpawnPos, fov: 74, near: 0.1, far: 120 }
              : { position: [24, 18, 28], fov: 36, near: 0.1, far: 200 }
          }
          dpr={[1, 1.8]}
        >
          <color attach="background" args={[isImmersive ? '#1f1610' : '#F7F3E9']} />
          {!isImmersive && <fog attach="fog" args={['#F7F3E9', 32, 65]} />}
          
          {!isImmersive && (
            <>
              <ambientLight intensity={1.25} />
              <directionalLight
                position={[12, 22, 16]}
                intensity={2.6}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-far={60}
                shadow-camera-left={-22}
                shadow-camera-right={22}
                shadow-camera-top={22}
                shadow-camera-bottom={-22}
              />
              <directionalLight position={[-14, 12, -10]} intensity={0.65} />

              {/* Ground Plane */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow>
                <planeGeometry args={[90, 90]} />
                <meshStandardMaterial color="#EDE5D8" roughness={0.96} />
              </mesh>
              <gridHelper args={[60, 60, '#C5A04F', '#DFD3BF']} position={[0, -0.23, 0]} />

              {/* Coherent Hospital Shell */}
              <CoherentHospitalShell
                selectedFloor={selectedFloor}
                setSelectedFloor={setSelectedFloor}
                selectedRoomId={selectedRoomId}
                setSelectedRoomId={setSelectedRoomId}
                viewMode={viewMode}
                heatmapMode={heatmapMode}
                showLabels={show3dLabels}
                modelLayer={modelLayer}
                rooms={rooms}
                onDoubleClickRoom={(room) => {
                  setSelectedRoomId(room.id);
                  setSelectedFloor(room.floorId);
                  setIsImmersive(true);
                }}
              />

              {/* 3D Physical Brass Anchor Pins on floor slab edges */}
              <FloorWorldPinsGroup
                selectedFloor={selectedFloor}
                viewMode={viewMode}
                showLabels={show3dLabels}
              />

              {/* Dynamic 3D Anchor Coordinate Projector to screen pixels */}
              <FloorAnchorsProjector
                viewMode={viewMode}
                selectedFloor={selectedFloor}
                sceneFrameRef={sceneFrameRef}
                showLabels={show3dLabels}
              />

              <ContactShadows position={[0, -0.22, 0]} opacity={0.35} scale={42} blur={2.6} far={14} />

              <OrbitControls
                ref={controlsRef}
                makeDefault
                target={[-1.5, 4.2, 0]}
                minDistance={10}
                maxDistance={55}
                maxPolarAngle={Math.PI * 0.49}
                enableDamping
                dampingFactor={0.08}
              />

              <CameraController
                cameraAngle={cameraAngle}
                controlsRef={controlsRef}
                isImmersive={false}
                viewMode={viewMode}
                selectedFloor={selectedFloor}
              />
            </>
          )}

          {/* Immersive Walkthrough 3D Room Interior */}
          {isImmersive && selectedRoom && (
            <>
              <ImmersiveRoomView
                room={selectedRoom}
                isCutaway={walkthroughMode === 'cutaway'}
                onToggleLight={handleToggleLight}
                onToggleBedLight={handleToggleBedLight}
              />

              {walkthroughMode === 'cutaway' ? (
                <OrbitControls
                  makeDefault
                  target={[0, 0.8, -0.2]}
                  minDistance={2.5}
                  maxDistance={14}
                  maxPolarAngle={Math.PI * 0.48}
                  enableDamping
                  dampingFactor={0.08}
                />
              ) : (
                <FirstPersonRoomControls
                  room={selectedRoom}
                  activePreset={activePreset}
                  onPresetHandled={() => setActivePreset(null)}
                />
              )}
            </>
          )}
        </Canvas>

        {/* World-space interactive floor labels are anchored directly to the 3D model inside Canvas */}

        {/* 2. Isolated Floor Cutaway Active Banner with Return to Building Action */}
        {!isImmersive && viewMode === 'floor' && (
          <div className="floor-return-banner">
            <button
              className="btn-return-building"
              onClick={() => { setViewMode('building'); setCameraAngle('perspective'); }}
              title="Return to Whole Hospital Shell overview"
            >
              <RotateCcw size={14} />
              <span>Return to Whole Building</span>
            </button>
            <div className="floor-active-title">
              <strong>{architecturalFloors.find(f => f.id === selectedFloor)?.name || selectedFloor} Cutaway</strong>
              <span>10 Configured Zones · Click any room zone to inspect · Double-click to walk inside</span>
            </div>
          </div>
        )}

        {/* 3. Immersive HUD Overlays when inside 360° Room Walkthrough */}
        {isImmersive && selectedRoom && (
          <div className="immersive-hud-overlay">
            {/* Header: Anchored Upper-Left Corner inside 3D viewport */}
            <div className="hud-header-corner">
              <div className="hud-header-top-row">
                <button
                  className="btn-hud-exit"
                  onClick={() => setIsImmersive(false)}
                  id="hud-exit-walkthrough-btn"
                  title="Return to Building Overview"
                >
                  <RotateCcw size={14} />
                  <span>Exit Room / Return to Building</span>
                </button>

                <div className="hud-room-nav-controls">
                  <button
                    className="btn-hud-room-nav"
                    onClick={() => {
                      const idx = rooms.findIndex(r => r.id === selectedRoom.id);
                      const prev = rooms[(idx - 1 + rooms.length) % rooms.length];
                      setSelectedRoomId(prev.id);
                      setSelectedFloor(prev.floorId);
                    }}
                    title="Previous Room Zone"
                  >
                    ◀ Prev
                  </button>
                  <button
                    className="btn-hud-room-nav"
                    onClick={() => {
                      const idx = rooms.findIndex(r => r.id === selectedRoom.id);
                      const next = rooms[(idx + 1) % rooms.length];
                      setSelectedRoomId(next.id);
                      setSelectedFloor(next.floorId);
                    }}
                    title="Next Room Zone"
                  >
                    Next ▶
                  </button>
                </div>
              </div>

              <div className="hud-room-info-block">
                <div className="hud-badges-line">
                  <span className="hud-floor-tag">{selectedRoom.floorName}</span>
                  <span className="hud-dept-tag">{selectedRoom.department || selectedRoom.type}</span>
                  {selectedRoom.critical && (
                    <span className="hud-critical-tag" title="Critical clinical environment with restricted overrides">
                      <ShieldCheck size={12} /> Critical Zone
                    </span>
                  )}
                  {selectedRoom.provisional ? (
                    <span className="hud-provenance-tag provisional" title="Provisional placement based on department clustering">
                      Provisional
                    </span>
                  ) : (
                    <span className="hud-provenance-tag verified" title="Reference-confirmed placement from campus drawings">
                      Verified
                    </span>
                  )}
                </div>

                <div className="hud-title-line">
                  <h3 title={`${selectedRoom.name} (${selectedRoom.id})`}>
                    {selectedRoom.name} <span className="hud-id-pill">({selectedRoom.id})</span>
                  </h3>
                </div>

                <select
                  className="hud-room-select"
                  value={selectedRoom.id}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedRoomId(nextId);
                    const found = rooms.find(r => r.id === nextId);
                    if (found) setSelectedFloor(found.floorId);
                  }}
                  aria-label="Switch room inside walkthrough"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      [{r.floorId}] {r.id}: {r.name.length > 32 ? `${r.name.slice(0, 30)}...` : r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Camera Controls: Anchored Upper-Right Corner inside 3D viewport */}
            <div className="hud-camera-corner">
              <div className="hud-camera-toolbar-header">
                <div className="camera-header-label">
                  <Camera size={13} />
                  <span>CAMERA PRESETS</span>
                </div>
                <div className="hud-mode-pill-group">
                  <button
                    className={`btn-mode-pill ${walkthroughMode === 'first_person' ? 'active' : ''}`}
                    onClick={() => { setWalkthroughMode('first_person'); setActivePreset('entry'); }}
                    id="hud-mode-first-person"
                    title="First-Person 360° standing walkthrough"
                  >
                    <Footprints size={12} />
                    <span>360° Walk</span>
                  </button>
                  <button
                    className={`btn-mode-pill ${walkthroughMode === 'cutaway' ? 'active' : ''}`}
                    onClick={() => setWalkthroughMode('cutaway')}
                    id="hud-mode-cutaway"
                    title="Room cutaway exterior orbit inspection"
                  >
                    <Layers size={12} />
                    <span>Cutaway</span>
                  </button>
                </div>
              </div>

              {/* Camera Presets: Corner Entry, Opposite Corner, Left View, Right View, Centre View, Reset View */}
              <div className="hud-camera-presets-grid">
                <button
                  className={`btn-camera-preset ${activePreset === 'entry' && walkthroughMode === 'first_person' ? 'active' : ''}`}
                  onClick={() => { setWalkthroughMode('first_person'); setActivePreset('entry'); }}
                  id="preset-corner-entry"
                  title="Corner Entry View — Inside corner looking diagonally across room"
                >
                  📍 Corner Entry
                </button>
                <button
                  className={`btn-camera-preset ${activePreset === 'opposite' && walkthroughMode === 'first_person' ? 'active' : ''}`}
                  onClick={() => { setWalkthroughMode('first_person'); setActivePreset('opposite'); }}
                  id="preset-opposite-corner"
                  title="Opposite Corner View — Rear corner looking towards entrance"
                >
                  🔄 Opposite Corner
                </button>
                <button
                  className={`btn-camera-preset ${activePreset === 'left' && walkthroughMode === 'first_person' ? 'active' : ''}`}
                  onClick={() => { setWalkthroughMode('first_person'); setActivePreset('left'); }}
                  id="preset-left-view"
                  title="Left View — West wall looking across room width"
                >
                  ◀ Left View
                </button>
                <button
                  className={`btn-camera-preset ${activePreset === 'right' && walkthroughMode === 'first_person' ? 'active' : ''}`}
                  onClick={() => { setWalkthroughMode('first_person'); setActivePreset('right'); }}
                  id="preset-right-view"
                  title="Right View — East wall looking across room width"
                >
                  ▶ Right View
                </button>
                <button
                  className={`btn-camera-preset ${activePreset === 'center' && walkthroughMode === 'first_person' ? 'active' : ''}`}
                  onClick={() => { setWalkthroughMode('first_person'); setActivePreset('center'); }}
                  id="preset-centre-view"
                  title="Centre View — Standing center with 360° rotation"
                >
                  🧭 Centre View
                </button>
                <button
                  className="btn-camera-preset btn-preset-reset"
                  onClick={() => { setWalkthroughMode('first_person'); setActivePreset('entry'); }}
                  id="preset-reset-view"
                  title="Reset View — Restore standard corner entry viewing angle"
                >
                  <RotateCcw size={11} /> Reset View
                </button>
              </div>

              <div className="hud-camera-instruction-hint">
                {walkthroughMode === 'first_person' ? (
                  <span>🚶 <strong>WASD / Arrows</strong> to walk • <strong>Drag mouse</strong> to look 360°</span>
                ) : (
                  <span>🔍 <strong>Drag mouse</strong> to orbit cutaway • <strong>Scroll</strong> to zoom</span>
                )}
              </div>
            </div>

            {/* Room Status Bar: Anchored Lower-Left Corner of viewport */}
            <div className="hud-status-corner">
              <div className="hud-status-header">
                <span>ROOM OPERATIONAL STATUS</span>
                <div className="hud-person-sim-tools">
                  <button
                    className="btn-hud-tool-compact"
                    onClick={handleAddPerson}
                    disabled={selectedRoom.people >= selectedRoom.capacity}
                    title="Simulate +1 person entering room"
                  >
                    <Users size={12} /> +1
                  </button>
                  <button
                    className="btn-hud-tool-compact"
                    onClick={handleRemovePerson}
                    disabled={selectedRoom.people <= 0}
                    title="Simulate -1 person leaving room"
                  >
                    -1
                  </button>
                </div>
              </div>

              <div className="hud-status-metrics-grid">
                <div className="hud-status-chip">
                  <span className="chip-label">Occupancy:</span>
                  <strong className="chip-val">{selectedRoom.people} / {selectedRoom.capacity}</strong>
                </div>

                {selectedRoom.beds > 0 && (
                  <div className="hud-status-chip">
                    <span className="chip-label">Occupied Beds:</span>
                    <strong className="chip-val">
                      {(selectedRoom.bedsList ? selectedRoom.bedsList.filter(b => b.occupied).length : Math.min(selectedRoom.beds, selectedRoom.occupiedBeds || 0))} / {selectedRoom.beds}
                    </strong>
                  </div>
                )}

                <div className="hud-status-chip">
                  <span className="chip-label">Power Demand:</span>
                  <strong className="chip-val">
                    {calculateRoomPower(selectedRoom).totalKw.toFixed(1)} kW
                  </strong>
                </div>

                <div className={`hud-status-chip hud-lighting-chip ${selectedRoom.lightOn ? 'lit' : 'dark'}`}>
                  <span className="chip-label">Lighting:</span>
                  <button
                    className={`btn-hud-light-toggle ${selectedRoom.lightOn ? 'on' : 'off'}`}
                    onClick={() => handleToggleLight(selectedRoom.id)}
                    title={selectedRoom.lightOn ? 'Turn Off Main Room Lighting' : 'Turn On Main Room Lighting'}
                  >
                    <Lightbulb size={12} color={selectedRoom.lightOn ? '#e6b325' : '#889895'} />
                    <strong>{selectedRoom.lightOn ? 'ON' : 'OFF'}</strong>
                  </button>
                </div>

                {selectedRoom.bedsList && selectedRoom.bedsList.length > 0 && (
                  <div className="hud-status-chip">
                    <span className="chip-label">Bedside Lamps:</span>
                    <strong className="chip-val">
                      {selectedRoom.bedsList.filter(b => b.bedsideLight !== false).length} / {selectedRoom.bedsList.length} On
                    </strong>
                  </div>
                )}

                <div className="hud-status-chip">
                  <span className="chip-label">HVAC:</span>
                  <strong className={`chip-val hvac-val ${selectedRoom.hvacMode.toLowerCase()}`}>
                    {selectedRoom.hvacMode}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informational Hint Bar when in Building View */}
        {!isImmersive && (
          <div className="scene-hint">
            <span className="hint-dot" />
            <span>
              {viewMode === 'building' && 'Whole Hospital Shell · Click any floor card or window to isolate level cutaway'}
              {viewMode === 'floor' && `${architecturalFloors.find(f => f.id === selectedFloor)?.name || selectedFloor} Cutaway · Click any room zone to inspect`}
            </span>
            <span className="hint-sub">· Double-Click any room to Enter 360° Walkthrough</span>
          </div>
        )}
      </SceneErrorBoundary>

      {/* Dedicated Floor Navigation Rail */}
      {showControls && !isImmersive && show3dLabels && (
        <DedicatedFloorRail
          selectedFloor={selectedFloor}
          onSelectFloor={handleSelectFloor}
          viewMode={viewMode}
          onReturnToBuilding={handleReturnToBuilding}
        />
      )}

      {/* Dynamic SVG Connectors Layer linking side rail to 3D anchors */}
      {showControls && !isImmersive && show3dLabels && (
        <FloorConnectorsOverlay
          viewMode={viewMode}
          selectedFloor={selectedFloor}
        />
      )}
    </div>
  </div>
  );
}
