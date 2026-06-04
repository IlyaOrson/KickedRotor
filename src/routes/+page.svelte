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
  const MAX_WIDTH = 800; // Increased default playground size
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
  let isReadmeExpanded = $state(false);

  let WIDTH = $state(MAX_WIDTH);
  let HEIGHT = $derived(WIDTH * ASPECT_RATIO);

  let pointsPerTrajectory = $derived(
    Math.floor(MIN_POINTS + (WIDTH / MAX_WIDTH) * (MAX_POINTS - MIN_POINTS))
  );
  let pointsClickedTrajectory = $derived(pointsPerTrajectory * 10);

  // Responsive sizes for the explanation (Readme expanded) view columns
  let explorerWidth = $derived(isReadmeExpanded ? Math.min(WIDTH, 520) : WIDTH);
  let explorerHeight = $derived(explorerWidth * ASPECT_RATIO);
  let rotorSize = $derived(isReadmeExpanded ? Math.min(WIDTH * 0.35, 240) : (WIDTH * 7) / 16);

  // Compute Lyapunov Exponent diagnostics reactively based on active position and K
  let lyapunovData = $derived.by(() => {
    if (selectedTheta !== undefined && selectedP !== undefined) {
      return calculateLyapunov(selectedTheta, selectedP, 200);
    }
    return { lambda: 0, history: [] };
  });

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
      WIDTH = Math.max(280, Math.min(window.innerWidth - 40, MAX_WIDTH));
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

  function fromSVGCoords(x: number, y: number, currentWidth: number, currentHeight: number): Point {
    const theta = ((x - MARGIN) / (currentWidth - 2 * MARGIN)) * TWO_PI;
    // Inverse of toSVGCoords for y
    const p = ((y - TOP_MARGIN) / (currentHeight - MARGIN - TOP_MARGIN)) * TWO_PI - PI;
    return [theta, p];
  }

  // Lyapunov Exponent Calculator (using the standard perturbation renormalization method)
  function calculateLyapunov(initialTheta: number, initialP: number, steps = 200): { lambda: number; history: number[] } {
    const d0 = 1e-8;
    let [theta, p] = [initialTheta, initialP];
    let dTheta = d0;
    let dP = 0;
    let sumLogDivergence = 0;
    const history: number[] = [];
    
    for (let i = 1; i <= steps; i++) {
      const [nextTheta, nextP] = nextState(theta, p);
      const [nextThetaPert, nextPPert] = nextState(theta + dTheta, p + dP);
      
      const diffTheta = mod(nextThetaPert - nextTheta + PI, TWO_PI) - PI;
      const diffP = mod(nextPPert - nextP + PI, TWO_PI) - PI;
      const d1 = Math.sqrt(diffTheta * diffTheta + diffP * diffP);
      
      if (d1 > 0) {
        sumLogDivergence += Math.log(d1 / d0);
        dTheta = d0 * (diffTheta / d1);
        dP = d0 * (diffP / d1);
      } else {
        dTheta = d0;
        dP = 0;
      }
      
      history.push(sumLogDivergence / i);
      [theta, p] = [nextTheta, nextP];
    }
    
    return { lambda: sumLogDivergence / steps, history };
  }

  function getSparklinePath(history: number[]): string {
    if (history.length === 0) return "";
    const minVal = Math.min(...history, 0);
    const maxVal = Math.max(...history, 0.5);
    const range = maxVal - minVal;
    
    return history.map((val, i) => {
      const x = (i / (history.length - 1)) * 200;
      const y = 40 - ((val - minVal) / range) * 40;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  }

  function getZeroY(history: number[]): number | null {
    if (history.length === 0) return null;
    const minVal = Math.min(...history, 0);
    const maxVal = Math.max(...history, 0.5);
    const range = maxVal - minVal;
    if (range === 0) return 20;
    return 40 - ((0 - minVal) / range) * 40;
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

  function isWithinPhaseBounds(x: number, y: number, currentWidth: number, currentHeight: number): boolean {
    return (
      x >= MARGIN &&
      x <= currentWidth - MARGIN &&
      y >= TOP_MARGIN &&
      y <= currentHeight - MARGIN
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

    const currentWidth = isReadmeExpanded ? explorerWidth : WIDTH;
    const currentHeight = isReadmeExpanded ? explorerHeight : HEIGHT;

    // Check if click is within phase space bounds
    if (!isWithinPhaseBounds(svgPoint.x, svgPoint.y, currentWidth, currentHeight)) {
      return;
    }

    // Convert SVG coordinates to phase space coordinates
    [selectedTheta, selectedP] = fromSVGCoords(svgPoint.x, svgPoint.y, currentWidth, currentHeight);

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

      <!-- Lyapunov Exponent Chaos Diagnostic Widget -->
      <div class="lyapunov-widget">
        <div class="lyapunov-header">
          <span class="lyapunov-title">Chaos Diagnostic (Lyapunov Exponent)</span>
          <span class="lyapunov-value" class:chaotic={lyapunovData.lambda > 0.1} class:regular={lyapunovData.lambda <= 0.1}>
            λ ≈ {lyapunovData.lambda.toFixed(3)} 
            ({lyapunovData.lambda > 0.1 ? 'Chaotic' : 'Orderly'})
          </span>
        </div>
        
        {#if lyapunovData.history.length > 0}
          {@const path = getSparklinePath(lyapunovData.history)}
          {@const zeroY = getZeroY(lyapunovData.history)}
          <div class="sparkline-container">
            <svg class="sparkline" viewBox="0 0 200 40">
              {#if zeroY !== null}
                <line x1="0" y1={zeroY} x2="200" y2={zeroY} class="baseline" />
              {/if}
              <path d={path} class="sparkpath" />
            </svg>
            <div class="sparkline-labels">
              <span>Kick 1</span>
              <span>Convergence over 200 kicks</span>
              <span>Kick 200</span>
            </div>
          </div>
        {/if}
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
            <PhaseSpace
              width={explorerWidth}
              height={explorerHeight}
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
                size={rotorSize}
              />
              <KickDecomposition
                theta={currentRotorState.theta}
                {k}
                size={rotorSize}
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

               <!-- Lyapunov Exponent Chaos Diagnostic Widget (Compact) -->
               <div class="lyapunov-widget compact">
                 <div class="lyapunov-header">
                   <span class="lyapunov-title">Chaos Diagnostic</span>
                   <span class="lyapunov-value" class:chaotic={lyapunovData.lambda > 0.1} class:regular={lyapunovData.lambda <= 0.1}>
                     λ ≈ {lyapunovData.lambda.toFixed(3)}
                   </span>
                 </div>
                 
                 {#if lyapunovData.history.length > 0}
                   {@const path = getSparklinePath(lyapunovData.history)}
                   {@const zeroY = getZeroY(lyapunovData.history)}
                   <div class="sparkline-container">
                     <svg class="sparkline" viewBox="0 0 200 40">
                       {#if zeroY !== null}
                         <line x1="0" y1={zeroY} x2="200" y2={zeroY} class="baseline" />
                       {/if}
                       <path d={path} class="sparkpath" />
                     </svg>
                     <div class="sparkline-labels">
                       <span>Kick 1</span>
                       <span>200 kicks</span>
                       <span>Kick 200</span>
                     </div>
                   </div>
                 {/if}
               </div>
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
    width: 100%;
    max-width: 100vw;
    margin: auto;
    box-sizing: border-box;
    position: relative;
    gap: 0.5rem;
    overflow-x: hidden;
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
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #00ff88;
    cursor: pointer;
    box-shadow: 0 0 8px #00ff88;
    transition: all 0.2s ease;
    border: 2px solid #ffffff;
    margin-top: -1px; /* Align correctly with track */
  }

  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 0 14px #00ff88, 0 0 6px rgba(255, 255, 255, 0.8);
  }

  input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #00ff88;
    cursor: pointer;
    box-shadow: 0 0 8px #00ff88;
    transition: all 0.2s ease;
    border: 2px solid #ffffff;
  }

  input[type="range"]::-moz-range-thumb:hover {
    transform: scale(1.15);
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
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 2rem;
      align-items: start;
      max-width: 100%;
    }
    .readme-widget {
      max-width: 1200px;
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
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    width: 100%;
  }

  @media (min-width: 600px) {
    .controls-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
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
    padding: 1rem;
    border-radius: 0.75rem;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.35);
    width: 100%;
    text-align: left;
  }

  @media (min-width: 768px) {
    .readme-content {
      padding: 1.5rem;
    }
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

  /* Lyapunov Exponent Diagnostic styles */
  .lyapunov-widget {
    background: rgba(26, 26, 46, 0.55);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.75rem;
    padding: 1rem;
    width: 100%;
    max-width: 320px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
    transition: all 0.3s ease;
  }

  .lyapunov-widget.compact {
    max-width: 200px;
    padding: 0.8rem;
    margin-top: 1rem;
  }

  .lyapunov-widget.compact .lyapunov-title {
    font-size: 0.65rem;
  }

  .lyapunov-widget.compact .lyapunov-value {
    font-size: 0.65rem;
  }

  .lyapunov-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    text-align: center;
  }

  .lyapunov-title {
    font-size: 0.75rem;
    color: #8a8a9a;
    font-family: "Chakra Petch", sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .lyapunov-value {
    font-family: "Press Start 2P", monospace;
    font-size: 0.7rem;
    font-weight: bold;
    transition: all 0.3s ease;
  }

  .lyapunov-value.chaotic {
    color: #ff3864;
    text-shadow: 0 0 8px rgba(255, 56, 100, 0.4);
  }

  .lyapunov-value.regular {
    color: #00ff88;
    text-shadow: 0 0 8px rgba(0, 255, 136, 0.4);
  }

  .sparkline-container {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0.25rem;
  }

  .sparkline {
    width: 100%;
    height: 40px;
    background: rgba(0, 0, 0, 0.25);
    border-radius: 0.25rem;
    border: 1px solid rgba(255, 255, 255, 0.03);
  }

  .sparkpath {
    fill: none;
    stroke: #ff00ff;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    filter: drop-shadow(0 0 2px #ff00ff);
  }

  .baseline {
    stroke: rgba(255, 255, 255, 0.15);
    stroke-dasharray: 3 3;
    stroke-width: 1;
  }

  .sparkline-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.6rem;
    color: #6a6a7a;
    font-family: "Chakra Petch", sans-serif;
  }
</style>
