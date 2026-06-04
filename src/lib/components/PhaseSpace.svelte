<script lang="ts">
  type Point = [number, number];
  type Trajectory = Point[];

  interface Props {
    width: number;
    height: number;
    axisMargin: number;
    topMargin: number;
    rightMargin: number;
    trajectories: Trajectory[] | null;
    colors: string[] | null;
    clickTrajectory: Trajectory | null;
    animationPoints: number | null;
  }

  let {
    width,
    height,
    axisMargin = 50,
    topMargin = 8,
    rightMargin = 8,
    trajectories = null,
    colors = null,
    clickTrajectory = null,
    animationPoints = null,
  }: Props = $props();

  const PI = Math.PI;
  const TWO_PI = 2 * PI;

  function toSVGCoords(theta: number, p: number): Point {
    const x =
      axisMargin + (theta / TWO_PI) * (width - axisMargin - rightMargin);
    const y =
      topMargin + ((p + PI) / TWO_PI) * (height - axisMargin - topMargin);
    return [x, y];
  }

  let canvas = $state<HTMLCanvasElement | null>(null);

  $effect(() => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Support high-DPI screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear previous frame
    ctx.clearRect(0, 0, width, height);

    // 1. Draw background trajectories
    if (trajectories && colors) {
      trajectories.forEach((trajectory, i) => {
        ctx.fillStyle = colors[i];
        ctx.globalAlpha = 0.6;
        const r = Math.max(0.5, Math.min(1.2, width * 0.002));
        
        trajectory.forEach(([theta, p]) => {
          const [x, y] = toSVGCoords(theta, p);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TWO_PI);
          ctx.fill();
        });
      });
    }

    // 2. Draw standard click trajectory points (drawn on top of background)
    if (clickTrajectory && animationPoints) {
      ctx.fillStyle = "#00ff88";
      ctx.globalAlpha = 0.85;
      
      const maxPts = Math.min(animationPoints, clickTrajectory.length - 1);
      for (let i = 1; i <= maxPts; i++) {
        const [theta, p] = clickTrajectory[i];
        const [x, y] = toSVGCoords(theta, p);
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, TWO_PI);
        ctx.fill();
      }
    }
  });
</script>

<div class="phase-space-canvas-wrapper" style="width: {width}px; height: {height}px;">
  <!-- SVG is the bottom layer rendering static grids, axes, ticks and labels -->
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
        x1={axisMargin}
        y1={topMargin + (i * (height - axisMargin - topMargin)) / 9}
        x2={width - rightMargin}
        y2={topMargin + (i * (height - axisMargin - topMargin)) / 9}
        class="grid-line"
      />
      <line
        x1={axisMargin + (i * (width - axisMargin - rightMargin)) / 9}
        y1={topMargin}
        x2={axisMargin + (i * (width - axisMargin - rightMargin)) / 9}
        y2={height - axisMargin}
        class="grid-line"
      />
    {/each}

    <!-- Axes -->
    <line
      x1={axisMargin}
      y1={height - axisMargin}
      x2={width - rightMargin}
      y2={height - axisMargin}
      class="axis"
    />
    <line
      x1={axisMargin}
      y1={topMargin}
      x2={axisMargin}
      y2={height - axisMargin}
      class="axis"
    />

    <!-- Axis Labels and Ticks -->
    <text x={width / 2} y={height - 10} class="axis-label">Angle (θ)</text>
    <text
      x={height / 8}
      y={height / 2}
      class="axis-label"
      transform="rotate(-90, 10, {(height * 1) / 2})"
    >
      Momentum (p)
    </text>

    <!-- p-axis ticks -->
    {#each [-PI, -PI / 2, 0, PI / 2, PI] as p, i}
      {@const [_, y] = toSVGCoords(0, p)}
      <line x1={axisMargin - 5} y1={y} x2={axisMargin} y2={y} class="tick" />
      <text
        x={axisMargin - 10}
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
        y1={height - axisMargin}
        x2={x}
        y2={height - axisMargin + 5}
        class="tick"
      />
      <text
        {x}
        y={height - axisMargin + 20}
        class="tick-label x-axis-label"
        text-anchor="middle"
      >
        {theta === 0
          ? "0"
          : `${theta === TWO_PI ? "2" : ""}π${theta !== PI && theta !== TWO_PI ? "/2" : ""}`}
      </text>
    {/each}

    <!-- First point rendered last in vector SVG to keep the smooth keyframe CSS animation -->
    {#if clickTrajectory && animationPoints}
      {@const [firstX, firstY] = toSVGCoords(
        clickTrajectory[0][0],
        clickTrajectory[0][1]
      )}
      <circle cx={firstX} cy={firstY} r="1.5" class="first-point" />
    {/if}
  </svg>

  <!-- Canvas overlays on top of the SVG so the dots are rendered above gridlines -->
  <canvas
    bind:this={canvas}
    class="phase-space-canvas"
    style="width: {width}px; height: {height}px;"
  ></canvas>
</div>

<style>
  .phase-space-canvas-wrapper {
    position: relative;
    display: inline-block;
    cursor: crosshair;
  }

  .phase-space {
    display: block;
    width: 100%;
    height: auto;
    background: transparent;
  }

  .phase-space-canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
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

  .first-point {
    fill: #00ff88;
    animation: firstPointAppear 2s ease-out infinite;
    mix-blend-mode: screen;
    isolation: isolate;
  }

  @keyframes firstPointAppear {
    0% {
      fill: #7fff00;
      r: 2;
      filter: drop-shadow(0 0 2px #9d00ff);
      filter: drop-shadow(0 0 4px #9d00ff);
      filter: drop-shadow(0 0 8px #9d00ff);
      filter: drop-shadow(0 0 16px #9d00ff);
    }
    25% {
      fill: #ffa500;
      r: 4;
      filter: drop-shadow(0 0 2px #9d00ff);
    }
    50% {
      fill: #ff3864;
      r: 3;
      filter: drop-shadow(0 0 4px #9d00ff);
      filter: drop-shadow(0 0 8px #9d00ff);
      filter: drop-shadow(0 0 16px #9d00ff);
      filter: drop-shadow(0 0 32px #9d00ff);
    }
    75% {
      fill: #ffa500;
      r: 4;
      filter: drop-shadow(0 0 2px #9d00ff);
    }
    100% {
      fill: #7fff00;
      r: 2;
      filter: drop-shadow(0 0 2px #9d00ff);
      filter: drop-shadow(0 0 4px #9d00ff);
      filter: drop-shadow(0 0 8px #9d00ff);
      filter: drop-shadow(0 0 16px #9d00ff);
    }
  }
</style>
