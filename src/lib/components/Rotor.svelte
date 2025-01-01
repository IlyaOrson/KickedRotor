<script lang="ts">
  const { theta, p, size } = $props<{
    theta: number;
    p: number;
    size: number;
  }>();

  // NOTE SVG coordinate system
  // 1. SVG coordinate system has:
  // - X axis goes right (+)
  // - Y axis goes down (+) ← This is key!
  // 2. Current rotation issue:
  // - Math.sin() and Math.cos() assume counterclockwise in standard coordinates
  // - SVG's inverted Y makes it appear clockwise
  // 3. Solution:
  // - Negate the Y coordinates for correct visual rotation

  let radius = $derived(size / 3);
  let innerRadius = $derived(radius / 3);

  let centerX = $derived(size / 2);
  let centerY = $derived(size / 2);

  let headSize = $derived(radius / 10);
  let normalizedP = $derived(-p / Math.PI); // Negate Y for SVG compatibility
  let headDirection = $derived(p > 0 ? 1 : -1);

  let sinTheta = $derived(Math.sin(theta));
  let cosTheta = $derived(Math.cos(theta));

  let componentX = $derived(radius * cosTheta);
  let componentY = $derived(-1 * radius * sinTheta); // Negate Y for SVG compatibility

  let rotorEndX = $derived(centerX + componentX);
  let rotorEndY = $derived(centerY + componentY);

  let arrowEndX = $derived(rotorEndX - componentY * normalizedP);
  let arrowEndY = $derived(rotorEndY + componentX * normalizedP);

  let arrowHead1X = $derived(
    arrowEndX + headDirection * headSize * Math.cos(theta - Math.PI / 4)
  );
  let arrowHead1Y = $derived(
    arrowEndY - headDirection * headSize * Math.sin(theta - Math.PI / 4) // Negate Y for SVG compatibility
  );
  let arrowHead2X = $derived(
    arrowEndX + headDirection * headSize * Math.cos(theta - (3 * Math.PI) / 4)
  );
  let arrowHead2Y = $derived(
    arrowEndY - headDirection * headSize * Math.sin(theta - (3 * Math.PI) / 4) // Negate Y for SVG compatibility
  );

  let pPositionX = $derived(centerX + 1.1 * componentX);
  let pPositionY = $derived(centerY + 1.1 * componentY);
  let thetaPositionX = $derived(
    centerX + 0.5 * innerRadius * Math.cos(theta / 2)
  );
  let thetaPositionY = $derived(
    centerY - 0.5 * innerRadius * Math.sin(theta / 2)
  ); // Negate Y for SVG compatibility

  // Theta arc calculation
  let arcPath = $derived.by(() => {
    const startX = centerX + innerRadius; // Start at 0 degrees (adjusted scale)
    const startY = centerY;
    const endX = centerX + innerRadius * cosTheta;
    const endY = centerY - innerRadius * sinTheta;
    const largeArcFlag = theta > Math.PI ? 1 : 0;
    return `M ${startX} ${startY} A ${innerRadius} ${innerRadius} 1 ${largeArcFlag} 0 ${endX} ${endY}`;
  });
</script>

<svg class="rotor" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
  <circle cx={centerX} cy={centerY} r={radius} class="rotor-circle" />
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
  <text x={pPositionX} y={pPositionY} class="momentum-label"> p </text>
  <text x={thetaPositionX} y={thetaPositionY} class="angle-label"> θ </text>
</svg>

<style>
  .rotor-circle {
    fill: none;
    stroke: #faecff;
    stroke-width: 2px; /* Adjusted stroke width */
  }

  .rotor-arm {
    stroke: #faecff;
    stroke-width: 2px; /* Adjusted stroke width */
  }

  .rotor-point {
    fill: #faecff;
    r: 3px; /* Added explicit radius */
  }

  .momentum-arrow {
    stroke: #faecff;
    stroke-width: 2px; /* Adjusted stroke width */
  }

  .arrow-head {
    fill: #faecff;
    stroke: #faecff; /* Added stroke to make arrow head more visible */
    stroke-width: 1px;
  }

  .angle-arc {
    fill: none;
    stroke: #faecff;
    stroke-width: 1.5px;
    opacity: 0.7;
  }

  .momentum-label,
  .angle-label {
    fill: #faecff;
    font-style: italic;
    font-size: 14px;
    font-family: serif;
  }
</style>
