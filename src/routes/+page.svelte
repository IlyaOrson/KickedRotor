<!-- Hack to render equations from the markdown file
https://github.com/pngwn/MDsveX/issues/302#issuecomment-1041293000 -->

<svelte:head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css" integrity="sha384-AfEj0r4/OFrOo5t7NnNe46zW/tFgW6x/bCJG8FqQCEo3+Aro6EYUG4+cU+KJWu/X" crossorigin="anonymous">
</svelte:head>

<script lang="ts">

  import README from '../../README.md';

  // Cleanup on unmount or k changes
  import { onDestroy } from 'svelte';

  // Types
  type Point = [number, number]; // [theta, p]
  type Trajectory = Point[];

  // Constants
  const WIDTH = 800;
  const HEIGHT = 600;
  const MARGIN = 50;
  const NUM_TRAJECTORIES = 30;
  const POINTS_PER_TRAJECTORY = 100;
  const PI = Math.PI;
  const TWO_PI = 2 * PI;

  // State
  let k = $state(0.971635);
  let trajectories = $state<Trajectory[]>([]);
  let clickTrajectory = $state<Trajectory | null>(null);
  let animationPoints = $state(0);
  let animationInterval: number | null = null;

  // Colors for trajectories
  const colors = Array(NUM_TRAJECTORIES)
    .fill(0)
    .map((_, i) => `hsl(${(i * 360) / NUM_TRAJECTORIES}, 80%, 60%)`);

  // State classification
  let systemState = $derived(getSystemState(k));

  function getSystemState(k: number): string {
    if (k < 0.5) return "Regular";
    if (k < 2.0) return "Mixed";
    return "Chaotic";
  }

  // Helper functions
  function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
  }

  function nextState(theta: number, p: number): Point {
    const newP = mod(p + k * Math.sin(theta), TWO_PI) - PI; // Center around 0
    const newTheta = mod(theta + newP, TWO_PI);
    return [newTheta, newP];
  }

  function toSVGCoords(theta: number, p: number): Point {
    const x = MARGIN + (theta / TWO_PI) * (WIDTH - 2 * MARGIN);
    // Map p from [-π, π] to [HEIGHT - MARGIN, MARGIN]
    const y = HEIGHT - (MARGIN + ((p + PI) / TWO_PI) * (HEIGHT - 2 * MARGIN));
    return [x, y];
  }

  function generateTrajectory(
    initialTheta: number,
    initialP: number,
    points = POINTS_PER_TRAJECTORY,
  ): Trajectory {
    const trajectory: Trajectory = [];
    let [theta, p] = [initialTheta, initialP];

    for (let i = 0; i < points; i++) {
      trajectory.push([theta, p]);
      [theta, p] = nextState(theta, p);
    }

    return trajectory;
  }

  function initializePhaseSpace() {
    trajectories = Array(NUM_TRAJECTORIES)
      .fill(0)
      .map(() => {
        const initialTheta = Math.random() * TWO_PI;
        const initialP = Math.random() * TWO_PI - PI; // Range [-π, π]
        return generateTrajectory(initialTheta, initialP);
      });
  }

  function startTrajectoryAnimation(trajectory: Trajectory) {
    // Clear any existing animation
    if (animationInterval) {
      clearInterval(animationInterval);
    }

    // Reset animation state
    animationPoints = 0;
    clickTrajectory = trajectory;

    // Start animation
    animationInterval = setInterval(() => {
      if (animationPoints >= trajectory.length - 1) {
        clearInterval(animationInterval!);
      } else {
        animationPoints++;
      }
    }, 20); // Adjust this value to control animation speed (20ms = 50fps)
  }

  function debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number = 300
  ): (...args: Parameters<T>) => void {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (...args: Parameters<T>) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
              func(...args);
          }, delay);
      };
  }

  // Debounced update function for k
  const updateK = debounce((value: number) => {
    k = value;
  }, 300);

  function handleCanvasClick(event: MouseEvent | KeyboardEvent) {
    if (event instanceof MouseEvent) {
      const svg = document.querySelector('.phase-space') as SVGGraphicsElement;
      const pt = new DOMPoint();
      const CTM = svg.getScreenCTM();

      if (CTM) {
        pt.x = event.clientX;
        pt.y = event.clientY;

        // Transform the point from screen coordinates to SVG coordinates
        const svgPoint = pt.matrixTransform(CTM.inverse());

        // Convert SVG coordinates to phase space coordinates
        const theta = ((svgPoint.x - MARGIN) / (WIDTH - 2 * MARGIN)) * TWO_PI;
        const p = ((HEIGHT - svgPoint.y - MARGIN) / (HEIGHT - 2 * MARGIN)) * TWO_PI - PI;

        startTrajectoryAnimation(generateTrajectory(theta, p, 10 * POINTS_PER_TRAJECTORY));
      }
    } else if (event instanceof KeyboardEvent) {
      // Handle keyboard events
    }
  }

  function handleCanvasKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      handleCanvasClick(event);
    }
  }

  function handleCanvasKeypress(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
    }
  }

  // Initialize and update on k changes
  $effect(() => {
    initializePhaseSpace();
    // Clear click trajectory when k changes
    clickTrajectory = null;
  });

  onDestroy(() => {
    if (animationInterval) {
      clearInterval(animationInterval);
    }
  });

  // State for README widget
  let isReadmeExpanded = $state(false);

  function toggleReadme() {
    isReadmeExpanded = !isReadmeExpanded;
  }
</script>

<div class="kicked-rotor">
  <!-- <h1 class="title">The Kicked Rotor</h1> -->
  {#if !isReadmeExpanded}
  <h1 class="title">The Kicked Rotor</h1>
  <h2 class="subtitle">(Click on the map!)</h2>
    <div
      class="svg-container"
      onclick={handleCanvasClick}
      onkeydown={handleCanvasKeydown}
      onkeypress={handleCanvasKeypress}
      role="button"
      tabindex="0"
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Phase space visualization"
        class="phase-space"
      >
      <!-- Grid -->
      {#each Array(10) as _, i}
        <line
          x1={MARGIN}
          y1={MARGIN + (i * (HEIGHT - 2 * MARGIN)) / 9}
          x2={WIDTH - MARGIN}
          y2={MARGIN + (i * (HEIGHT - 2 * MARGIN)) / 9}
          class="grid-line"
        />
        <line
          x1={MARGIN + (i * (WIDTH - 2 * MARGIN)) / 9}
          y1={MARGIN}
          x2={MARGIN + (i * (WIDTH - 2 * MARGIN)) / 9}
          y2={HEIGHT - MARGIN}
          class="grid-line"
        />
      {/each}

      <!-- Axes -->
      <line
        x1={MARGIN}
        y1={HEIGHT - MARGIN}
        x2={WIDTH - MARGIN}
        y2={HEIGHT - MARGIN}
        class="axis"
      />
      <line
        x1={MARGIN}
        y1={MARGIN}
        x2={MARGIN}
        y2={HEIGHT - MARGIN}
        class="axis"
      />

      <!-- Axis Labels and Ticks -->
      <text x={WIDTH / 2} y={HEIGHT - 10} class="axis-label">θ</text>
      <text
        x={10}
        y={HEIGHT / 2}
        class="axis-label">p</text
      >

      <!-- p-axis ticks -->
      {#each [-PI, -PI / 2, 0, PI / 2, PI] as p, i}
        {@const [_, y] = toSVGCoords(0, p)}
        <line x1={MARGIN - 5} y1={y} x2={MARGIN} y2={y} class="tick" />
        <text
          x={MARGIN - 10}
          {y}
          class="tick-label y-axis-label"
          text-anchor="end"
          dominant-baseline="middle"
        >
          {p === 0
            ? "0"
            : `${p < 0 ? "-" : ""}π${Math.abs(p) !== PI ? "/2" : ""}`}
        </text>
      {/each}

      <!-- θ-axis ticks -->
      {#each [0, PI / 2, PI, (3 * PI) / 2, TWO_PI] as theta, i}
        {@const [x, _] = toSVGCoords(theta, 0)}
        <line
          x1={x}
          y1={HEIGHT - MARGIN}
          x2={x}
          y2={HEIGHT - MARGIN + 5}
          class="tick"
        />
        <text
          {x}
          y={HEIGHT - MARGIN + 20}
          class="tick-label x-axis-label"
          text-anchor="middle"
        >
          {theta === 0
            ? "0"
            : `${theta === TWO_PI ? "2" : ""}π${theta !== PI && theta !== TWO_PI ? "/2" : ""}`}
        </text>
      {/each}

      <!-- Trajectories -->
      {#each trajectories as trajectory, i}
        <g class="trajectory" style="--trajectory-color: {colors[i]}">
          {#each trajectory as [theta, p]}
            {@const [x, y] = toSVGCoords(theta, p)}
            <circle cx={x} cy={y} r="1" />
          {/each}
        </g>
      {/each}

      <!-- Click Trajectory -->
      {#if clickTrajectory}
        <g class="click-trajectory">
          {#each clickTrajectory.slice(0, animationPoints + 1) as [theta, p], i}
            {@const [x, y] = toSVGCoords(theta, p)}
            <circle
              cx={x}
              cy={y}
              r="1.5"
              class="animated-point"
              style="--point-index: {i}"
            />
          {/each}
        </g>
      {/if}
    </svg>
  </div>
  <div
    class="system-state"
    class:regular={systemState === "Regular"}
    class:mixed={systemState === "Mixed"}
    class:chaotic={systemState === "Chaotic"}
  >
    System State: {systemState}
  </div>
  <div class="controls">
    <div class="parameter-control">
      <div class="k-value">K = {k.toFixed(2)}</div>
      <input
        id="k-param"
        type="range"
        min="0"
        max="5"
        step="0.1"
        value={k}
        oninput={(e) => {
          if (e.target) {
            updateK(parseFloat((e.target as HTMLInputElement).value));
          }
        }}
      />
    </div>
  </div>
  {/if}
  <div class="readme-widget">
    <button class="toggle-button" onclick={toggleReadme}>
      {isReadmeExpanded ? 'Hide README' : 'Show README'}
    </button>
    {#if isReadmeExpanded}
      <div class="readme-content">
        <README />
      </div>
    {/if}
  </div>
</div>

<style>

  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap');

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

  .phase-space {
    cursor: crosshair;
  }

  .title {
    font-family: 'Press Start 2P', cursive;
    color: #00ff88;
    font-size: clamp(1rem, 4vw, 1.5rem);
    margin: 0;
    min-height: var(--min-title-height);
    text-align: center;
    position: relative;
    z-index: 10;
    text-shadow: 0 0 20px #00ff88, 0 0 30px #00ff88, 0 0 40px #00ff88;
  }

  .subtitle {
    font-family: 'Roboto Mono', monospace;
    color: #00ff88;
    font-size: clamp(0.7rem, 2vw, 1rem);
    margin: 0;
    text-align: center;
    position: relative;
    z-index: 10;
  }

  .svg-container {
    width: 100%;
    aspect-ratio: 8/6;
    display: flex;
    justify-content: center;
    flex-shrink: 5;
    min-height: 0;
  }

  .grid-line {
    stroke: #2a2a3a;
    stroke-width: 0.5;
    opacity: 0.3;
  }

  .axis {
    stroke: #4a4a5a;
    stroke-width: 2;
  }

  .tick {
    stroke: #4a4a5a;
    stroke-width: 2;
  }

  .axis-label,
  .tick-label {
    fill: #8a8a9a;
    font-size: clamp(10px, 2vw, 15px);
    text-anchor: middle;
    font-family: 'Roboto Mono', monospace;
    user-select: none;
  }

  .y-axis-label {
    transform: translateX(-10px);
  }

  .trajectory circle {
    fill: var(--trajectory-color);
    opacity: 0.6;
    filter: drop-shadow(0 0 2px var(--trajectory-color));
    r: clamp(0.5px, 0.2vw, 1px);
  }

  .click-trajectory circle {
    fill: #00ff88;
    filter: drop-shadow(0 0 4px #00ff88);
    opacity: 0.8;
    r: clamp(0.75px, 0.3vw, 1.5px);
  }

  .animated-point {
    animation: pointAppear 0.3s ease-out forwards;
    opacity: 0;
  }

  @keyframes pointAppear {
    from {
      opacity: 0;
      r: 0.5;
    }
    50% {
      opacity: 1;
      r: 2.5;
    }
    to {
      opacity: 0.8;
      r: 1.5;
    }
  }

  .controls {
    margin: 0.5rem 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    width: 100%;
    user-select: none;
  }

  .parameter-control {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: #8a8a9a;
    flex-direction: column;
  }

  .k-value {
    font-family: 'Press Start 2P', cursive;
    color: #a200ff;
    font-size: clamp(0.7rem, 1.5vw, 1rem);
    margin-top: 1rem;
  }

  input[type="range"] {
    width: 100%;
    max-width: 200px;
    accent-color: #00ff88;
  }

  .system-state {
    font-size: clamp(0.7rem, 1.5vw, 1rem);
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    font-weight: bold;
    transition: all 0.3s;
    text-align: center;
    vertical-align: baseline;
    font-family: 'Press Start 2P', cursive;
    user-select: none;
  }

  .regular {
    background: #00448833;
    color: #00ff88;
  }

  .mixed {
    background: #884400aa;
    color: #ffaa00;
  }

  .chaotic {
    background: #880000aa;
    color: #ff4444;
  }

  .readme-widget {
    width: 100%;
    max-width: 800px;
    text-align: center;
  }

  .toggle-button {
    background: #00ff88;
    color: #0f0f1a;
    border: none;
    padding: 0.5rem 1rem;
    font-family: 'Press Start 2P', cursive;
    cursor: pointer;
    border-radius: 0.25rem;
    transition: background 0.3s;
  }

  .toggle-button:hover {
    background: #00cc70;
  }

  .readme-content {
    margin-top: 1rem;
    margin-bottom: 1rem;
    background: #1a1a2e;
    padding: 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    /* height: 70%; */
    overflow-y: auto;
  }

  @media (max-height: 600px) {
    .kicked-rotor {
      padding: 0.5rem;
      gap: 0.25rem;
    }

    .title {
      padding: 0.25rem;
    }

    .controls {
      margin: 0.25rem 0;
      gap: 0.5rem;
    }

    .parameter-control {
      gap: 0.5rem;
    }

    .system-state {
      padding: 0.25rem 0.5rem;
    }

    input[type="range"] {
      transform: scale(0.9);
    }
  }

  :global(body) {
    background: #0f0f1a;
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
  }
</style>
