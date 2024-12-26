<script lang="ts">

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
  let k = $state(0.5);
  let trajectories = $state<Trajectory[]>([]);
  let clickTrajectory = $state<Trajectory | null>(null);

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
    initialP: number
  ): Trajectory {
    const trajectory: Trajectory = [];
    let [theta, p] = [initialTheta, initialP];

    for (let i = 0; i < POINTS_PER_TRAJECTORY; i++) {
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

  function handleCanvasClick(event: MouseEvent) {
    const rect = (event.target as SVGElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert click coordinates to phase space
    const theta = ((x - MARGIN) / (WIDTH - 2 * MARGIN)) * TWO_PI;
    const p = -((y - MARGIN) / (HEIGHT - 2 * MARGIN)) * TWO_PI + PI;

    clickTrajectory = generateTrajectory(theta, p);
  }

  function handleCanvasKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      const rect = (event.target as SVGElement).getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const mouseEvent = new MouseEvent("click", {
        clientX: x,
        clientY: y,
      });
      handleCanvasClick(mouseEvent);
    }
  }

  function handleCanvasKeypress(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
    }
  }

  // Initialize and update on k changes
  $effect(() => {
    initializePhaseSpace();
    // Clear click trajectory when k changes
    clickTrajectory = null;
  });
</script>

<div class="kicked-rotor">
  <h1 class="title">The Kicked Rotor</h1>
  <div
    class="svg-container"
    onclick={handleCanvasClick}
    onkeydown={handleCanvasKeydown}
    onkeypress={handleCanvasKeypress}
    role="button"
    tabindex="0"
  >
    <svg
      width={WIDTH}
      height={HEIGHT}
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
        {#each clickTrajectory as [theta, p]}
          {@const [x, y] = toSVGCoords(theta, p)}
          <circle cx={x} cy={y} r="1.5" />
        {/each}
      </g>
    {/if}
  </svg>
</div>

  <div class="controls">
    <div class="parameter-control">
      <div class="k-value">K = {k.toFixed(2)}</div>
      <!-- <label for="k-param">K = {k.toFixed(2)}</label> -->
      <input
        id="k-param"
        type="range"
        min="0"
        max="5"
        step="0.1"
        bind:value={k}
      />
    </div>

    <div
      class="system-state"
      class:regular={systemState === "Regular"}
      class:mixed={systemState === "Mixed"}
      class:chaotic={systemState === "Chaotic"}
    >
      System State: {systemState}
    </div>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap');

  .kicked-rotor {
    background: #1a1a2e;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: 100%;
    margin: auto;
  }

  .title {
    font-family: 'Press Start 2P', cursive;
    color: #00ff88;
    text-shadow: 0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 30px #00ff88;
    margin-bottom: 1rem;
  }

  .svg-container {
    width: 100%;
    max-width: 800px;
    display: flex;
    justify-content: center;
  }

  .phase-space {
    background: #0f0f1a;
    border-radius: 0.5rem;
    overflow: hidden;
    width: 100%;
    height: auto;
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
    font-size: 15px;
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
  }

  .click-trajectory circle {
    fill: #00ff88;
    filter: drop-shadow(0 0 4px #00ff88);
    opacity: 0.8;
  }

  .controls {
    margin-top: 1rem;
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
    font-family: 'Press Start 2P', cursive;
    color: #00ff88;
    margin-bottom: 0.5rem;
  }

  input[type="range"] {
    width: 100%;
    max-width: 200px;
    accent-color: #00ff88;
  }

  .system-state {
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    font-weight: bold;
    transition: all 0.3s;
    text-align: center;
    font-family: 'Press Start 2P', cursive;
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
