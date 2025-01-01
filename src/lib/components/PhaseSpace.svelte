<script lang="ts">
  type Point = [number, number];
  type Trajectory = Point[];

  const {
    width,
    height,
    margin = 50,
    topMargin = 5,
    trajectories = null,
    colors = null,
    clickTrajectory,
    animationPoints,
  } = $props<{
    width: number;
    height: number;
    margin?: number;
    topMargin?: number;
    trajectories?: Trajectory[];
    colors?: string[];
    clickTrajectory: Trajectory | null;
    animationPoints: number;
  }>();

  const PI = Math.PI;
  const TWO_PI = 2 * PI;

  function toSVGCoords(theta: number, p: number): Point {
    const x = margin + (theta / TWO_PI) * (width - 2 * margin);
    const y = topMargin + ((p + PI) / TWO_PI) * (height - margin - topMargin);
    return [x, y];
  }
</script>

<svg
  {width}
  {height}
  viewBox={`0 0 ${width} ${height}`}
  preserveAspectRatio="xMidYMid meet"
  role="img"
  aria-label="Phase space visualization"
  class="phase-space"
>
  <!-- Grid -->
  {#each Array(10) as _, i}
    <line
      x1={margin}
      y1={topMargin + (i * (height - margin - topMargin)) / 9}
      x2={width - margin}
      y2={topMargin + (i * (height - margin - topMargin)) / 9}
      class="grid-line"
    />
    <line
      x1={margin + (i * (width - 2 * margin)) / 9}
      y1={topMargin}
      x2={margin + (i * (width - 2 * margin)) / 9}
      y2={height - margin}
      class="grid-line"
    />
  {/each}

  <!-- Axes -->
  <line
    x1={margin}
    y1={height - margin}
    x2={width - margin}
    y2={height - margin}
    class="axis"
  />
  <line
    x1={margin}
    y1={topMargin}
    x2={margin}
    y2={height - margin}
    class="axis"
  />

  <!-- Axis Labels and Ticks -->
  <text x={width / 2} y={height - 10} class="axis-label">Angle (θ)</text>
  <text
    x={10}
    y={height / 2}
    class="axis-label"
    transform="rotate(-90, 10, {height / 2})"
  >
    Momentum (p)
  </text>

  <!-- p-axis ticks -->
  {#each [-PI, -PI / 2, 0, PI / 2, PI] as p, i}
    {@const [_, y] = toSVGCoords(0, p)}
    <line x1={margin - 5} y1={y} x2={margin} y2={y} class="tick" />
    <text
      x={margin - 10}
      {y}
      class="tick-label y-axis-label"
      text-anchor="end"
      dominant-baseline="middle"
    >
      {p === 0 ? "0" : `${p < 0 ? "-" : ""}π${Math.abs(p) !== PI ? "/2" : ""}`}
    </text>
  {/each}

  <!-- θ-axis ticks -->
  {#each [0, PI / 2, PI, (3 * PI) / 2, TWO_PI] as theta, i}
    {@const [x, _] = toSVGCoords(theta, 0)}
    <line
      x1={x}
      y1={height - margin}
      x2={x}
      y2={height - margin + 5}
      class="tick"
    />
    <text
      {x}
      y={height - margin + 20}
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

<style>
  .phase-space {
    cursor: crosshair;
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
    font-size: clamp(10px, 2vw, 15px);
    text-anchor: middle;
    font-family: "Roboto Mono", monospace;
    user-select: none;
  }

  .y-axis-label {
    transform: translateX(-10px);
  }

  .trajectory circle {
    fill: var(--trajectory-color);
    opacity: 0.6;
    filter: drop-shadow(0 0 2px var(--trajectory-color));
    r: clamp(0.5px, 0.2vw, 1.5px);
  }

  .click-trajectory circle {
    fill: #00ff88;
    filter: drop-shadow(0 0 4px #00ff88);
    opacity: 0.8;
    r: clamp(0.75px, 0.3vw, 3px);
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
</style>
