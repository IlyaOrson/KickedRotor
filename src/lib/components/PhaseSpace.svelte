<script lang="ts">
  type Point = [number, number];
  type Trajectory = Point[];

  //   interface Props {
  //     width: number;
  //     height: number;
  //     axisMargin: number;
  //     topMargin: number;
  //     rightMargin: number;
  //     trajectories: Trajectory[] | null;
  //     colors: string[] | null;
  //     clickTrajectory: Trajectory | null;
  //     animationPoints: number | null;
  //   }

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
  } = $props();

  const PI = Math.PI;
  const TWO_PI = 2 * PI;

  function toSVGCoords(theta: number, p: number): Point {
    const x =
      axisMargin + (theta / TWO_PI) * (width - axisMargin - rightMargin);
    const y =
      topMargin + ((p + PI) / TWO_PI) * (height - axisMargin - topMargin);
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
          class={i === 0 ? "animated-point first-point" : "animated-point"}
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

  .first-point {
    r: clamp(1.5px, 0.6vw, 6px);
  }

  .animated-point {
    animation: pointAppear 0.3s ease-out forwards;
    opacity: 0;
  }

  .first-point {
    animation: firstPointAppear 0.3s ease-out forwards;
  }

  @keyframes firstPointAppear {
    from {
      opacity: 0;
      r: 0.5;
    }
    50% {
      opacity: 1;
      r: 5;
    }
    to {
      opacity: 0.8;
      r: 3.5;
    }
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
