<script lang="ts">
  import README from "../../README.md";
  import Rotor from "$lib/components/Rotor.svelte";
  import PhaseSpace from "$lib/components/PhaseSpace.svelte";
  import GithubLogo from "$lib/components/GithubLogo.svelte";
  import KickDecomposition from "$lib/components/KickDecomposition.svelte";
  import { onMount, onDestroy } from "svelte";

  // Types
  type Point = [number, number]; // [theta, p]
  type Trajectory = Point[];
  type InitialPoint = { theta: number; p: number };

  // Constants
  const ASPECT_RATIO = 2 / 3; // height = width * 2/3
  const MAX_WIDTH = 600;
  const MARGIN = 50;
  const TOP_MARGIN = 8;
  const NUM_TRAJECTORIES = 10;
  const MIN_POINTS = 10; // small screens
  const MAX_POINTS = 150; // large screens
  const PI = Math.PI;
  const TWO_PI = 2 * PI;

  // State

  // let k = $state(0.971635);
  let k = $state(0.7);
  let initialPoints = $state<InitialPoint[]>([]);
  let trajectories = $state<Trajectory[]>([]);
  let clickTrajectory = $state<Trajectory | null>(null);
  let animationPoints = $state(0);
  let animationFrameId: number | null = null;
  let animationTimeoutId: ReturnType<typeof setTimeout> | null = null;

  let WIDTH = $state(MAX_WIDTH);
  let HEIGHT = $derived(WIDTH * ASPECT_RATIO);

  let pointsPerTrajectory = $derived(
    Math.floor(MIN_POINTS + (WIDTH / MAX_WIDTH) * (MAX_POINTS - MIN_POINTS))
  );
  let pointsClickedTrajectory = $derived(pointsPerTrajectory * 10);

  let selectedTheta = $state(3.77);
  let selectedP = $state(-1.03);

  // Rotor Animation State
  let currentRotorState = $state<{ theta: number; p: number }>({
    theta: 3.77,
    p: -1.03,
  });
  let isSlowMode = $state(true); // Default to slow mode for explainability

  $effect(() => {
    startTrajectoryAnimation(
      generateTrajectory(selectedTheta, selectedP, pointsClickedTrajectory)
    );
  });

  onMount(() => {
    const updateDimensions = () => {
      WIDTH = Math.min(window.innerWidth, MAX_WIDTH);
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Sample initial points once
    sampleInitialPoints();
    initializePhaseSpace();

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  });

  // Colors for trajectories
  const colors = Array(NUM_TRAJECTORIES)
    .fill(0)
    .map((_, i) => `hsl(${(i * 360) / NUM_TRAJECTORIES}, 80%, 60%)`);

  // Helper functions
  function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
  }

  function nextState(theta: number, p: number): Point {
    const newP = mod(p + k * Math.sin(theta), TWO_PI) - PI; // Center around 0
    const newTheta = mod(theta + newP, TWO_PI);
    return [newTheta, newP];
  }

  function fromSVGCoords(x: number, y: number): Point {
    const theta = ((x - MARGIN) / (WIDTH - 2 * MARGIN)) * TWO_PI;
    // Inverse of toSVGCoords for y
    const p = ((y - TOP_MARGIN) / (HEIGHT - MARGIN - TOP_MARGIN)) * TWO_PI - PI;
    return [theta, p];
  }

  function generateTrajectory(
    initialTheta: number,
    initialP: number,
    points = pointsPerTrajectory // Use dynamic points by default
  ): Trajectory {
    const trajectory: Trajectory = [];
    let [theta, p] = [initialTheta, initialP];

    for (let i = 0; i < points; i++) {
      trajectory.push([theta, p]);
      [theta, p] = nextState(theta, p);
    }

    return trajectory;
  }

  // Sample initial points
  function sampleInitialPoints() {
    initialPoints = Array(NUM_TRAJECTORIES)
      .fill(0)
      .map(() => ({
        theta: Math.random() * TWO_PI,
        p: Math.random() * TWO_PI - PI, // Range [-π, π]
      }));
  }

  // Modified initializePhaseSpace to use fixed initial points
  function initializePhaseSpace() {
    trajectories = initialPoints.map(({ theta, p }) =>
      generateTrajectory(theta, p)
    );
  }

  function startTrajectoryAnimation(trajectory: Trajectory) {
    // Cancel any existing animation
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (animationTimeoutId) {
      clearTimeout(animationTimeoutId);
      animationTimeoutId = null;
    }

    // Reset animation state
    animationPoints = 0;
    clickTrajectory = trajectory;
    currentRotorState = {
      theta: trajectory[0][0],
      p: trajectory[0][1],
    };

    // Start animation
    const animate = () => {
      if (animationPoints >= trajectory.length - 1) {
        // Stop
      } else {
        animationPoints++;
        const [theta, p] = trajectory[animationPoints];
        currentRotorState = { theta, p };

        if (!isReadmeExpanded || !isSlowMode) {
            // Fast mode (default or requested)
            animationFrameId = requestAnimationFrame(animate);
        } else {
            // Slow mode
            animationTimeoutId = setTimeout(() => {
                animate();
            }, 600); // 600ms delays
        }
      }
    };

    if (!isReadmeExpanded || !isSlowMode) {
         animationFrameId = requestAnimationFrame(animate);
    } else {
         // Initial delay?
         animationTimeoutId = setTimeout(animate, 600);
    }
  }

  function handleSliderInput(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    k = value; // Immediate update
  }

  function isWithinPhaseBounds(x: number, y: number): boolean {
    return (
      x >= MARGIN &&
      x <= WIDTH - MARGIN &&
      y >= TOP_MARGIN &&
      y <= HEIGHT - MARGIN
    );
  }

  function handleCanvasClick(event: MouseEvent) {
    const svg = document.querySelector(".phase-space") as SVGSVGElement;
    const pt = svg.createSVGPoint();
    const CTM = svg.getScreenCTM();
    if (!CTM) {
      throw new Error("Could not get SVG coordinate transformation matrix");
    }

    pt.x = event.clientX;
    pt.y = event.clientY;

    // Transform the point from screen coordinates to SVG coordinates
    const svgPoint = pt.matrixTransform(CTM.inverse());

    // Check if click is within phase space bounds
    if (!isWithinPhaseBounds(svgPoint.x, svgPoint.y)) {
      return;
    }

    // Convert SVG coordinates to phase space coordinates
    [selectedTheta, selectedP] = fromSVGCoords(svgPoint.x, svgPoint.y);

    startTrajectoryAnimation(
      generateTrajectory(selectedTheta, selectedP, pointsClickedTrajectory)
    );
  }

  function handleCanvasKeydown(event: KeyboardEvent) {
    const step = TWO_PI / 100;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectedTheta = mod(selectedTheta - step, TWO_PI);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      selectedTheta = mod(selectedTheta + step, TWO_PI);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      selectedP = Math.min(PI, Math.max(-PI, selectedP + step));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      selectedP = Math.min(PI, Math.max(-PI, selectedP - step));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startTrajectoryAnimation(
        generateTrajectory(selectedTheta, selectedP, pointsClickedTrajectory)
      );
    }
  }

  // Initialize and update on k changes
  $effect(() => {
    initializePhaseSpace();
    // Clear click trajectory when k changes
    // clickTrajectory = null;
  });

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    if (animationTimeoutId) {
      clearTimeout(animationTimeoutId);
    }
  });

  // State for README widget
  let isReadmeExpanded = $state(false);

  function toggleReadme() {
    isReadmeExpanded = !isReadmeExpanded;
    // Restart animation to pick up mode change
    startTrajectoryAnimation(
        generateTrajectory(selectedTheta, selectedP, pointsClickedTrajectory)
    );
  }

  function toggleSpeed() {
      isSlowMode = !isSlowMode;
      // Restart animation to pick up speed change
      startTrajectoryAnimation(clickTrajectory || generateTrajectory(selectedTheta, selectedP, pointsClickedTrajectory));
  }
</script>

<svelte:head>
  <title>The Kicked Rotor - A Chaotic Playground!</title>
</svelte:head>
<div class="kicked-rotor">
  <!-- <h1 class="title">The Kicked Rotor</h1> -->
  {#if !isReadmeExpanded}
    <h1 class="title">The Kicked Rotor</h1>
    <h2 class="subtitle">
      Tap on the map to explore chaos!<br />Can you find stable regions?
    </h2>
    <div
      class="phase-space-container"
      onclick={handleCanvasClick}
      onkeydown={handleCanvasKeydown}
      role="button"
      tabindex="0"
      aria-label="Interactive phase space plot. Click to spawn a trajectory, or use arrow keys to navigate and Enter or Space to run."
    >
      <PhaseSpace
        width={WIDTH}
        height={HEIGHT}
        axisMargin={MARGIN}
        topMargin={TOP_MARGIN}
        rightMargin={MARGIN}
        {trajectories}
        {colors}
        {clickTrajectory}
        {animationPoints}
      />
    </div>

    <div class="controls">
      <div class="parameter-control">
        <div class="k-value">Kick Strength = {k.toFixed(2)}</div>
        <input
          id="k-param-playground"
          type="range"
          min="0"
          max="5"
          step="0.02"
          value={k}
          oninput={handleSliderInput}
          aria-label="K parameter"
        />
      </div>
    </div>
  {/if}
  <div class="readme-widget">
    <div class="button-row">
      <div></div>
      <div class="toggle-group">
      <button class="toggle-button" onclick={toggleReadme}>
        {isReadmeExpanded ? "Playground" : "What is this?"}
      </button>
      </div>
      <div class="github-link" style="margin-right: {MARGIN}px">
        <GithubLogo />
      </div>
    </div>
    {#if isReadmeExpanded}
      <div class="rotor-explorer">
        <div class="trajectories-explorer">
          <h3 class="trajectories-title">Positions after kicks</h3>
          <div
            class="phase-space-container"
            onclick={handleCanvasClick}
            onkeydown={handleCanvasKeydown}
            role="button"
            tabindex="0"
            aria-label="Interactive phase space plot. Click to spawn a trajectory, or use arrow keys to navigate and Enter or Space to run."
          >
            <!-- TODO handle svg coords transform correctly with other dimensions/margins -->
            <PhaseSpace
              width={WIDTH}
              height={HEIGHT}
              axisMargin={MARGIN}
              topMargin={TOP_MARGIN}
              rightMargin={MARGIN}
              trajectories={null}
              colors={null}
              {clickTrajectory}
              {animationPoints}
            />
          </div>
           <!-- Speed Control for Explorer moved to params -->
          <!-- <div class="explorer-controls">
            <button class="speed-button" onclick={toggleSpeed}>
                {isSlowMode ? "Speed Up" : "Slow Down"}
            </button>
          </div> -->
        </div>
        <div class="controls-explorer">
          <h3 class="controls-title">Initial position</h3>
          <div class="controls-grid">
            <div class="rotor-container">
              <Rotor
                theta={currentRotorState.theta}
                p={currentRotorState.p}
                {k}
                size={(WIDTH * 7) / 16}
              />
              <KickDecomposition
                theta={currentRotorState.theta}
                {k}
                size={(WIDTH * 7) / 16}
                />
            </div>
            <div class="parameters-container">
               <!-- Sliders update the initial state and trigger new trajectory -->
              <div class="parameter-group">
                <div class="parameter-label">
                  Angle<br />θ = {selectedTheta.toFixed(2)}
                </div>
                <input
                  type="range"
                  min="0"
                  max={TWO_PI}
                  step="0.01"
                  bind:value={selectedTheta}
                  aria-label="Theta parameter"
                />
              </div>
              <div class="parameter-group">
                <div class="parameter-label">
                  Momentum<br />p = {selectedP.toFixed(2)}
                </div>
                <input
                  type="range"
                  min={-PI}
                  max={PI}
                  step="0.01"
                  bind:value={selectedP}
                  aria-label="P parameter"
                />
              </div>
              <div class="parameter-group">
                <div class="parameter-label">
                  Kick<br />K = {k.toFixed(2)}
                </div>
                <input
                  id="k-param-readme"
                  type="range"
                  min="0"
                  max="5"
                  step="0.02"
                  bind:value={k}
                  aria-label="K parameter"
                />
              </div>
               <!-- Speed Control -->
               <button class="speed-button" onclick={toggleSpeed}>
                 {isSlowMode ? "Speed Up" : "Slow Down"}
               </button>
            </div>
          </div>
        </div>
      </div>
      <div class="readme-content">
        <README />
      </div>
    {/if}
  </div>
</div>

<style>
  /* Workaround to render equations from a markdown file */
  /* https://github.com/pngwn/MDsveX/issues/302#issuecomment-1041293000  */
  @import url("https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css");

  @import url("https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Press+Start+2P&display=swap");

  .kicked-rotor {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 95vw;
    max-height: 95vh;
    margin: auto;
    box-sizing: content-box;
    position: relative;
    gap: 0.5rem;
  }

  .title {
    font-family: "Press Start 2P", monospace;
    color: #00ff88;
    font-size: clamp(1rem, 4vw, 3rem);
    margin: 0;
    min-height: var(--min-title-height);
    text-align: center;
    position: relative;
    z-index: 10;
    text-shadow:
      /* 0 0 10px #00ff88, */
      0 0 20px #00ff88,
      0 0 30px #00ff88;
  }

  .subtitle {
    font-family: "Chakra Petch", monospace;
    color: #00ff88;
    font-size: clamp(0.6rem, 2vw, 1rem);
    margin: 0;
    text-align: center;
    position: relative;
    z-index: 10;
  }

  .phase-space-container {
    width: auto;
    display: flex;
    justify-content: center;
    min-height: 0;
    background: rgba(15, 15, 26, 0.45);
    border: 1px solid rgba(0, 255, 136, 0.25);
    border-radius: 1rem;
    padding: 1rem;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.45),
                0 0 15px rgba(0, 255, 136, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    outline: none;
  }

  .phase-space-container:hover {
    border-color: rgba(0, 255, 136, 0.55);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5),
                0 0 25px rgba(0, 255, 136, 0.15);
  }

  .phase-space-container:focus-visible {
    border-color: #ff00ff;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5),
                0 0 25px rgba(255, 0, 255, 0.3);
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    width: 100%;
  }

  .parameter-control {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: #8a8a9a;
    flex-direction: column;
  }

  .k-value {
    font-family: "Press Start 2P", monospace;
    color: #ff00ff;
    font-size: clamp(0.7rem, 1.2vw, 1rem);
    /* margin-top: 1rem; */
  }

  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    max-width: 200px;
    background: rgba(255, 255, 255, 0.1);
    height: 6px;
    border-radius: 3px;
    outline: none;
    margin-bottom: 1rem;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #00ff88;
    cursor: pointer;
    box-shadow: 0 0 8px #00ff88;
    transition: all 0.2s ease;
    border: 2px solid #ffffff;
  }

  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 0 14px #00ff88, 0 0 6px rgba(255, 255, 255, 0.8);
  }

  input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #00ff88;
    cursor: pointer;
    box-shadow: 0 0 8px #00ff88;
    transition: all 0.2s ease;
    border: 2px solid #ffffff;
  }

  input[type="range"]::-moz-range-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 0 14px #00ff88, 0 0 6px rgba(255, 255, 255, 0.8);
  }

  .readme-widget {
    width: 100%;
    max-width: 800px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .toggle-button {
    background: rgba(157, 0, 255, 0.15);
    color: #e4e4ff;
    border: 1px solid #9d00ff;
    padding: 0.8rem 1.2rem;
    font-family: "Press Start 2P", monospace;
    cursor: pointer;
    border-radius: 0.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: clamp(0.6rem, 2vw, 0.85rem);
    box-shadow: 0 0 10px rgba(157, 0, 255, 0.15);
    text-shadow: 0 0 5px rgba(228, 228, 255, 0.3);
  }

  .toggle-button:hover {
    background: #9d00ff;
    box-shadow: 0 0 20px rgba(157, 0, 255, 0.5);
    transform: translateY(-2px);
    color: #ffffff;
  }

  .toggle-button:active {
    transform: translateY(0);
  }
  
  .speed-button {
      background: rgba(255, 165, 0, 0.12);
      color: #ffa500;
      border: 1px solid #ffa500;
      padding: 0.8rem 0;
      font-family: "Press Start 2P", monospace;
      cursor: pointer;
      border-radius: 0.5rem;
      font-size: 0.7rem;
      margin-top: 1rem;
      width: 100%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0 10px rgba(255, 165, 0, 0.1);
      text-shadow: 0 0 4px rgba(255, 165, 0, 0.2);
  }
  
  .speed-button:hover {
      background: #ffa500;
      color: #0f0f1a;
      box-shadow: 0 0 20px rgba(255, 165, 0, 0.4);
      transform: translateY(-2px);
  }

  .speed-button:active {
      transform: translateY(0);
  }

  .toggle-group {
      display: flex;
      gap: 1rem;
      align-items: center;
  }

  .button-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    width: 100%;
  }

  .github-link {
    justify-self: end;
  }

  .rotor-explorer {
    display: flex;
    flex-direction: column;
    margin-top: 1rem;
    /* padding: 1rem; */
    border-radius: 0.5rem;
    width: 100%;
  }

  @media (min-width: 1024px) {
    .rotor-explorer {
      flex-direction: row;
    }
    .readme-widget {
      max-width: 1024px;
    }
  }

  .trajectories-title,
  .controls-title {
    font-family: "Press Start 2P", monospace;
    color: #9d00ff;
    font-size: clamp(0.7rem, 1.2vw, 1rem);
    margin: 1rem;
  }

  .trajectories-explorer {
    display: grid;
    grid-template-columns: 1fr;
    align-items: center;
    justify-items: center;
    /* margin-bottom: 1rem; */
  }
  

  /* .explorer-controls {
      display: flex;
      justify-content: center;
      width: 100%;
  } */

  .parameters-container {
    grid-column: 2;
    grid-row: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: center;
    align-items: center;
  }

  .controls-explorer {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    background: rgba(26, 26, 46, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 0.75rem;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25);
  }

  .rotor-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1rem;
  }

  .controls-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    /* gap: 1.5rem; */
  }

  .parameter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }

  .parameter-group input[type="range"] {
    width: 100%;
    margin: 0;
  }

  .parameter-label {
    color: #8a8a9a;
    text-align: center;
    font-size: 0.9rem;
  }

  .readme-content {
    margin-top: 1.5rem;
    margin-bottom: 1.5rem;
    background: rgba(26, 26, 46, 0.65);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 1.5rem;
    border-radius: 0.75rem;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.35);
    width: 100%;
    text-align: left;
  }

  :global(body) {
    background: #0f0f1a;
    color: #e4e4ff;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
    font-family: "Open Sans", system-ui, -apple-system, sans-serif;
    font-size: 18px;
    line-height: 1.7;
  }

  :global(a) {
    color: #ff00ff;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  :global(a:hover) {
    color: #00ffff;
    text-decoration: none;
    text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
  }

  :global(a:visited) {
    color: #ff3864;
  }

  :global(a:active) {
    color: #00ffff;
  }
</style>
