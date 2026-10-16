# Antigravity implementation brief — CDSIMER Digital Twin

Open this brand-new folder in Antigravity and read this file before modifying code.

## Non-negotiable project constraints

- Work only in `C:\Users\kavana.s\cdsimer-digital-twin`.
- Do not open or edit `C:\Users\kavana.s\greentwin-ai` as a work target.
- Reference photographs are in `public/references/floor-plans/` and `public/references/appearance/`.
- Keep all current source images intact.
- Values in `src/data/hospitalData.js` are provisional demo values, not real CDSIMER telemetry.
- The current 3D exterior is a fresh procedural visual concept, not an accurate measured reconstruction yet.

## Next milestone: trace floor plans, do not invent a generic layout

1. Inspect all four reference photographs in full. Use the images themselves, not just filenames.
2. Assess readability and perspective distortion. Do not infer exact measurements from unclear photographs.
3. Build a normalized 2D room-layout representation for each floor. Keep geometry coordinates in a documented consistent convention.
4. Provide editable room polygons/rectangles, IDs, labels, and confidence/source notes. Use provisional IDs where labels are not readable.
5. Create a top-down floor-plan viewer from these normalized room definitions. Make room click targets correspond to the correct source-plan zone.
6. Build the cutaway 3D building using those same floor/room definitions so the floor plan and the 3D model cannot drift independently.
7. Add wall segments and actual door openings; never place full walls across doorways.
8. Map room-local coordinates, ceiling height, wall height, camera spawn point, camera direction, and furniture anchors for each room.
9. Furnish and validate just two rooms first: one public area and one ward. Confirm geometry and camera movement before replicating templates to all rooms.
10. Keep the existing dashboard/state controls intact while replacing the schematic exterior with a floor-plan-aligned model.

## Visual quality goals

- Use the supplied exterior image as the appearance reference for the facade, central entrance, repeated windows, light stone/concrete finishes, columns and roofline. Do not claim exact replication without better references.
- Use high-quality, locally bundled, appropriately licensed GLB/GLTF objects where useful, plus procedural geometry where appropriate.
- Preserve scale, collision clearance, door visibility, natural light and realistic clinical finishes.
- Do not make the model dependent on external asset URLs.
- Keep room labels legible and avoid floating-label overlap.
- Build quality before adding animations or large numbers of people.

## Sustainability priorities

1. Occupancy-aware lighting in non-critical spaces.
2. Room HVAC display with restrictions for critical clinical environments.
3. Transparent simulated energy and estimated CO2 calculations.
4. Water-use and anomaly scenarios.
5. Solar/PV and EV-charging scenario modelling.
6. Paper minimization and biomedical-waste reporting scenarios.
7. Staff comfort/work-environment indicators that do not track individual employees.

## Acceptance criteria

- The application starts independently of the previous project.
- All four floor-plan references load locally.
- Each floor is represented separately and selectable.
- The floor plan and 3D cutaway use the same room IDs and geometry data.
- Room entry points open into usable spaces with 360-degree viewing.
- Furniture fits the correct room without wall/floor intersections.
- Occupancy, lights, HVAC and device controls use a shared source of truth.
- All simulated/proposed information is labelled as such.
- The production build succeeds, and actual browser interactions are tested.

Do not claim a building reconstruction, room map, sensor integration, or measured sustainability result is accurate unless it has been validated. Report assumptions and unresolved questions honestly.
