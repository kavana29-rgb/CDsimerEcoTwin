# CDSIMER Green Hospital Digital Twin — Starter Foundation

A fresh React + Vite prototype for a floor-plan-based hospital digital twin and sustainability decision-support experience.

## Run locally

1. Install Node.js (LTS) if it is not already installed.
2. Open a terminal in this folder.
3. Install packages:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL printed by Vite.

For Windows PowerShell where `npm.ps1` is blocked, use `npm.cmd install`, `npm.cmd run dev`, and `npm.cmd run build`.

## Included in this first milestone

- New project independent from the previous `greentwin-ai` application.
- Four reference floor-plan photographs and the supplied exterior/sustainability references.
- A procedural, classical-style exterior concept guided by the provided exterior photo.
- Floor selectors and an interactive Three.js exterior scene.
- Dashboard with explicitly simulated demo zones.
- Room inspector with occupancy, lighting, HVAC, and simulated device controls.
- Energy/load view, illustrative water/paper/waste scenarios, and rule-based insights.
- Reference-plan viewer to compare source photographs while the 3D layout is being traced.

## Important limitations of this starter

- The current 3D exterior is a **visual concept**, not a measured as-built model.
- Floor plan photographs are perspective views of display boards, so room labels, exact dimensions, and room-to-floor mappings need manual verification.
- Demo room IDs and operational values are provisional simulated data. They are not actual CDSIMER telemetry.
- The current first milestone does not yet contain a traced, room-by-room accurate 3D interior or human GLB models. Implement these only after the floor layout and room mapping are verified.
- Solar capacity, water consumption, paper consumption, biomedical waste, and emissions factors are placeholders/scenario inputs; replace them with cited values if verified data becomes available.

## Suggested next milestone

Trace the four floor layouts into normalized floor coordinates, verify room names and adjacency from the reference images, and create a room catalog. Then build the spatially aligned cutaway/interior model and room-specific furniture.
