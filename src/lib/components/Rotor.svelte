<script lang="ts">
  interface Props {
    theta: number;
    p: number;
    size: number;
  }
  let { theta, p, size }: Props = $props();

  let radius = $derived(size / 3);
  let innerRadius = $derived(radius / 3);
  let centerX = $derived(size / 2);
  let centerY = $derived(size / 2);
  let headSize = $derived(radius / 10);
  let normalizedP = $derived(-p / Math.PI);
  let headDirection = $derived(p > 0 ? 1 : -1);

  let sinTheta = $derived(Math.sin(theta));
  let cosTheta = $derived(Math.cos(theta));
  let componentX = $derived(radius * cosTheta);
  let componentY = $derived(-1 * radius * sinTheta);
  let rotorEndX = $derived(centerX + componentX);
  let rotorEndY = $derived(centerY + componentY);
  let arrowEndX = $derived(rotorEndX - componentY * normalizedP);
  let arrowEndY = $derived(rotorEndY + componentX * normalizedP);

  let arrowHead1X = $derived(
    arrowEndX + headDirection * headSize * Math.cos(theta - Math.PI / 4)
  );
  let arrowHead1Y = $derived(
    arrowEndY - headDirection * headSize * Math.sin(theta - Math.PI / 4)
  );
  let arrowHead2X = $derived(
    arrowEndX + headDirection * headSize * Math.cos(theta - (3 * Math.PI) / 4)
  );
  let arrowHead2Y = $derived(
    arrowEndY - headDirection * headSize * Math.sin(theta - (3 * Math.PI) / 4)
  );

  let pPositionX = $derived(centerX + 1.2 * componentX);
  let pPositionY = $derived(centerY + 1.2 * componentY);
  let thetaPositionX = $derived(
    centerX + 0.5 * innerRadius * Math.cos(theta / 2)
  );
  let thetaPositionY = $derived(
    centerY - 0.5 * innerRadius * Math.sin(theta / 2)
  );

  // Grid pattern definition
  let gridSize = $derived(size / 20);
  let gridLines = $derived(() => {
    let lines = [];
    for (let i = gridSize; i < size; i += gridSize) {
      lines.push({
        x1: 0,
        y1: i,
        x2: size,
        y2: i,
        opacity: i % (gridSize * 2) === 0 ? 0.3 : 0.1,
      });
      lines.push({
        x1: i,
        y1: 0,
        x2: i,
        y2: size,
        opacity: i % (gridSize * 2) === 0 ? 0.3 : 0.1,
      });
    }
    return lines;
  });

  let arcPath = $derived.by(() => {
    const startX = centerX + innerRadius;
    const startY = centerY;
    const endX = centerX + innerRadius * cosTheta;
    const endY = centerY - innerRadius * sinTheta;
    const largeArcFlag = theta > Math.PI ? 1 : 0;
    return `M ${startX} ${startY} A ${innerRadius} ${innerRadius} 1 ${largeArcFlag} 0 ${endX} ${endY}`;
  });

  let animationDirection = $derived(p > 0 ? "reverse" : "normal");
</script>

<svg
  style="--rotation-direction: {animationDirection}"
  class="rotor"
  width={size}
  height={size}
  viewBox={`0 0 ${size} ${size}`}
>
  <circle cx={centerX} cy={centerY} r={radius} class="rotor-circle" />

  <line
    x1={centerX}
    y1={centerY}
    x2={centerX + radius}
    y2={centerY}
    class="angle-ref"
  />

  <line
    x1={centerX}
    y1={centerY}
    x2={rotorEndX}
    y2={rotorEndY}
    class="rotor-arm"
  />

  <circle cx={centerX} cy={centerY} r="5" class="rotor-point" />
  <circle cx={rotorEndX} cy={rotorEndY} r="5" class="rotor-point" />

  <line
    x1={rotorEndX}
    y1={rotorEndY}
    x2={arrowEndX}
    y2={arrowEndY}
    class="momentum-arrow"
  />

  <path
    d={`M ${arrowEndX} ${arrowEndY} L ${arrowHead1X} ${arrowHead1Y} L ${arrowHead2X} ${arrowHead2Y} Z`}
    class="arrow-head"
  />

  <path d={arcPath} class="angle-arc" />

  <!-- Labels -->
  <text x={pPositionX} y={pPositionY} class="momentum-label">p</text>
  <text x={thetaPositionX} y={thetaPositionY} class="angle-label">θ</text>
</svg>

<style>
  .rotor {
    background: transparent;
  }

  .angle-ref {
    stroke: #ff00ff;
    stroke-width: 1px;
    stroke-dasharray: 10 4;
  }

  .rotor-circle {
    fill: none;
    stroke: #00ffff;
    stroke-width: 1px;
    stroke-dasharray: 10 4;
    opacity: 0.5;
    animation: rotate 20s linear infinite;
    animation-direction: var(--rotation-direction, normal);
  }

  .rotor-arm {
    stroke: #ff00ff;
    stroke-width: 2px;
  }

  .rotor-point {
    fill: #ff00ff;
  }

  .momentum-arrow {
    stroke: #00ffff;
    stroke-width: 2px;
  }

  .arrow-head {
    fill: #00ffff;
    stroke: #00ffff;
    stroke-width: 1px;
  }

  .angle-arc {
    fill: none;
    stroke: #ff00ff;
    stroke-width: 1.5px;
    opacity: 0.7;
  }

  .momentum-label {
    fill: #00ffff;
    font-family: "Courier New", monospace;
    font-style: italic;
    font-size: 14px;
  }
  .angle-label {
    fill: #ff00ff;
    font-family: "Courier New", monospace;
    font-style: italic;
    font-size: 14px;
  }

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
      transform-origin: 50% 50%;
    }
    to {
      transform: rotate(360deg);
      transform-origin: 50% 50%;
    }
  }
</style>
