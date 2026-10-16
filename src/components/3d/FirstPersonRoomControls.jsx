import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Calculates room-specific interior dimensions, spawn points,
 * diagonal view directions, and navigation boundaries based on physical room bounds.
 */
export function getRoomWalkthroughConfig(room) {
  const w = Math.max(7.2, (room?.dimensions?.[0] || 6) * 1.2);
  const d = Math.max(5.8, (room?.dimensions?.[1] || 4) * 1.3);
  const eyeH = 1.6; // Realistic standing human eye height
  const fType = room?.furnitureType || 'consultation';

  // Room bounds in local coordinates (walls at ±w/2, ±d/2, door at [0, 0, d/2] South wall)
  // Safety margin keeps the standing camera inside the room away from walls and furniture
  const marginX = 0.55;
  const marginZ = 0.55;
  const bounds = {
    minX: -w / 2 + marginX,
    maxX: w / 2 - marginX,
    minZ: -d / 2 + marginZ,
    maxZ: d / 2 - marginZ,
  };

  // Determine the optimal interior corner spawn point opposite or diagonal to the South entrance
  let spawnX = -w * 0.36; // Default South-West interior corner
  let spawnZ = d * 0.32;
  let targetX = w * 0.12; // Looking diagonally across towards center-right
  let targetZ = -d * 0.16;

  // Specific adjustments per department to avoid starting behind furniture or facing walls
  if (['ct_scan', 'xray', 'ecg'].includes(fType)) {
    // Diagnostic imaging: South-East corner offers an unobstructed view across the gantry/couch and console
    spawnX = w * 0.36;
    spawnZ = d * 0.32;
    targetX = -w * 0.14;
    targetZ = -d * 0.14;
  } else if (fType === 'reception') {
    // Reception concourse: South-West corner reveals both waiting seats and the main administration desk
    spawnX = -w * 0.36;
    spawnZ = d * 0.32;
    targetX = w * 0.15;
    targetZ = -d * 0.22;
  } else if (['ward', 'semi_private', 'recovery'].includes(fType)) {
    // Inpatient wards: South-West corner looks across both hospital beds, bedside lamps, and nurses
    spawnX = -w * 0.36;
    spawnZ = d * 0.32;
    targetX = w * 0.12;
    targetZ = -d * 0.12;
  } else if (['icu', 'emergency'].includes(fType)) {
    // Critical care: South-West corner looks diagonally across the ICU bed, ventilators, and infusion pumps
    spawnX = -w * 0.36;
    spawnZ = d * 0.32;
    targetX = w * 0.10;
    targetZ = -d * 0.12;
  } else if (fType === 'dining') {
    // Cafeteria: South-West corner looks diagonally across dining tables towards the serving counter
    spawnX = -w * 0.36;
    spawnZ = d * 0.32;
    targetX = w * 0.15;
    targetZ = -d * 0.20;
  } else if (fType === 'ot') {
    // Operating theatre: South-West corner looking directly at central surgical table and boom lights
    spawnX = -w * 0.36;
    spawnZ = d * 0.34;
    targetX = 0;
    targetZ = 0;
  }

  // Ensure initial spawn point is strictly clamped inside room boundaries
  spawnX = Math.max(bounds.minX, Math.min(bounds.maxX, spawnX));
  spawnZ = Math.max(bounds.minZ, Math.min(bounds.maxZ, spawnZ));

  // Compute camera presets
  const presets = {
    entry: {
      position: [spawnX, eyeH, spawnZ],
      target: [targetX, 1.25, targetZ],
      label: 'Corner Entry View',
      description: 'Interior corner position looking diagonally across room furniture',
    },
    opposite: {
      position: [spawnX > 0 ? -w * 0.35 : w * 0.35, eyeH, -d * 0.32],
      target: [0, 1.25, d * 0.34],
      label: 'Opposite Corner View',
      description: 'Rear corner position looking back towards the entrance',
    },
    left: {
      position: [bounds.minX + 0.15, eyeH, 0],
      target: [w * 0.25, 1.25, 0],
      label: 'Left Wing View',
      description: 'West wall viewpoint looking across the room width',
    },
    right: {
      position: [bounds.maxX - 0.15, eyeH, 0],
      target: [-w * 0.25, 1.25, 0],
      label: 'Right Wing View',
      description: 'East wall viewpoint looking across the room width',
    },
    center: {
      position: ['ct_scan', 'ot'].includes(fType) ? [1.4, eyeH, 0.5] : [0, eyeH, 0.2],
      target: ['ct_scan', 'ot'].includes(fType) ? [0, 1.15, -0.6] : [-1.2, 1.25, -1.0],
      label: 'Center 360° View',
      description: 'Central circulation position with 360-degree rotation',
    },
  };

  return {
    w,
    d,
    eyeH,
    bounds,
    presets,
    defaultSpawn: presets.entry,
  };
}

/**
 * True First-Person 360-Degree Room Walkthrough Controller
 * - Rotates in place around eye center (horizontal 360° yaw + vertical pitch)
 * - WASD / Arrow keys for movement inside room boundaries
 * - Keeps stable 1.6m standing eye height
 * - Strict collision boundaries prevent clipping through walls
 */
export function FirstPersonRoomControls({
  room,
  activePreset,
  onPresetHandled,
  moveSpeed = 2.4, // meters per second
}) {
  const { camera, gl } = useThree();

  const configRef = useRef(getRoomWalkthroughConfig(room));
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const keysRef = useRef({ forward: false, backward: false, left: false, right: false });
  const currentRoomIdRef = useRef(room?.id);

  // Update config when room changes
  useEffect(() => {
    configRef.current = getRoomWalkthroughConfig(room);
  }, [room]);

  // Apply a camera position and target direction
  const applyPreset = (presetKey = 'entry') => {
    const config = configRef.current;
    const preset = config.presets[presetKey] || config.defaultSpawn;
    const [px, py, pz] = preset.position;
    const [tx, ty, tz] = preset.target;

    camera.position.set(px, py, pz);

    const dx = tx - px;
    const dy = ty - py;
    const dz = tz - pz;
    yawRef.current = Math.atan2(dx, -dz);
    pitchRef.current = Math.atan2(dy, Math.hypot(dx, dz));

    // Clamp initial pitch safely
    pitchRef.current = Math.max(-1.38, Math.min(1.38, pitchRef.current));

    const dirX = Math.sin(yawRef.current) * Math.cos(pitchRef.current);
    const dirY = Math.sin(pitchRef.current);
    const dirZ = -Math.cos(yawRef.current) * Math.cos(pitchRef.current);
    camera.lookAt(px + dirX, py + dirY, pz + dirZ);
  };

  // On mount or when room ID changes, spawn at the recommended corner
  useEffect(() => {
    applyPreset('entry');
    currentRoomIdRef.current = room?.id;
  }, [room?.id]);

  // Handle preset changes triggered from HUD buttons
  useEffect(() => {
    if (activePreset) {
      applyPreset(activePreset);
      if (typeof onPresetHandled === 'function') {
        onPresetHandled();
      }
    }
  }, [activePreset]);

  // Pointer / Mouse drag listeners for 360-degree look
  useEffect(() => {
    const dom = gl.domElement;

    const handlePointerDown = (e) => {
      // Only trigger on primary left click
      if (e.button !== 0) return;
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
      dom.style.cursor = 'grabbing';
    };

    const handlePointerMove = (e) => {
      if (!isDraggingRef.current) return;

      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };

      // Horizontal yaw: unrestricted 360-degree rotation
      yawRef.current -= dx * 0.0038;

      // Vertical pitch: clamped to -80° to +80° (-1.38 to +1.38 rad)
      pitchRef.current -= dy * 0.0035;
      pitchRef.current = Math.max(-1.38, Math.min(1.38, pitchRef.current));
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      dom.style.cursor = 'grab';
    };

    dom.style.cursor = 'grab';
    dom.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      dom.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      dom.style.cursor = 'auto';
    };
  }, [gl]);

  // Keyboard listeners for WASD / Arrow key movement
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input or select element
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keysRef.current.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') keysRef.current.backward = true;
      if (code === 'KeyA' || code === 'ArrowLeft') keysRef.current.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') keysRef.current.right = true;
    };

    const handleKeyUp = (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keysRef.current.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') keysRef.current.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft') keysRef.current.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') keysRef.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Frame update: update camera orientation and process movement
  useFrame((_, delta) => {
    // Limit delta to prevent large step jumps on frame lag
    const dt = Math.min(0.05, delta);
    const yaw = yawRef.current;
    const pitch = pitchRef.current;
    const keys = keysRef.current;
    const bounds = configRef.current.bounds;
    const eyeH = configRef.current.eyeH;

    // 1. Calculate direction vector from yaw and pitch
    const dirX = Math.sin(yaw) * Math.cos(pitch);
    const dirY = Math.sin(pitch);
    const dirZ = -Math.cos(yaw) * Math.cos(pitch);

    // 2. Compute keyboard motion relative to current camera yaw on horizontal plane
    let moveX = 0;
    let moveZ = 0;

    if (keys.forward) {
      moveX += Math.sin(yaw);
      moveZ -= Math.cos(yaw);
    }
    if (keys.backward) {
      moveX -= Math.sin(yaw);
      moveZ += Math.cos(yaw);
    }
    if (keys.left) {
      moveX -= Math.cos(yaw);
      moveZ -= Math.sin(yaw);
    }
    if (keys.right) {
      moveX += Math.cos(yaw);
      moveZ += Math.sin(yaw);
    }

    const mag = Math.hypot(moveX, moveZ);
    if (mag > 0.001) {
      const step = moveSpeed * dt;
      camera.position.x += (moveX / mag) * step;
      camera.position.z += (moveZ / mag) * step;
    }

    // 3. Strict room boundary collision clamping (keeps user safely inside room away from walls)
    camera.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, camera.position.x));
    camera.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, camera.position.z));
    camera.position.y = eyeH; // Stable human eye height

    // 4. Point camera at eye position + direction vector
    camera.lookAt(
      camera.position.x + dirX,
      camera.position.y + dirY,
      camera.position.z + dirZ
    );
  });

  return null;
}
