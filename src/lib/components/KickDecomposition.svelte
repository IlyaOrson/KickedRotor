<script lang="ts">
  interface Props {
    theta: number;
    k: number;
    size: number;
  }

  let { theta, k, size }: Props = $props();

  // Resize height to be more compact
  let height = $derived(size * 0.6); // Reduce vertical space

  // Layout calculations
  let centerX = $derived(size / 2);
  let centerY = $derived(height / 2); // Center in reduced height
  
  // Scaling
  let vectorScale = 40; // Pixels per unit K
  
  // Force Vector: Horizontal LEFT (-K, 0)
  let originX = $derived(centerX + (k * vectorScale) / 2); 
  let originY = $derived(centerY);
  
  let forceVecX = $derived(-k * vectorScale);
  let forceVecY = 0;
  
  let endX = $derived(originX + forceVecX);
  let endY = $derived(originY + forceVecY);
  
  // Radial Component
  let p1X = $derived(originX - k * Math.cos(theta) * Math.cos(theta) * vectorScale);
  let p1Y = $derived(originY + k * Math.cos(theta) * Math.sin(theta) * vectorScale);
  
</script>

<div class="decomposition-container">
    <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`}>
        <defs>
            <!-- Solid Marker -->
            <marker id="arrowhead-solid" markerWidth="6" markerHeight="4.2" 
            refX="5" refY="2.1" orient="auto">
            <polygon points="0 0, 6 2.1, 0 4.2" fill="#ffa500" />
            </marker>
            <!-- Dashed Marker -->
            <marker id="arrowhead-dashed" markerWidth="6" markerHeight="4.2" 
            refX="5" refY="2.1" orient="auto">
            <polygon points="0 0, 6 2.1, 0 4.2" fill="#ffa500" />
            </marker>
        </defs>

        <!-- Axes (Rotor Arm Frame) -->
        <line 
            x1={originX - 1000 * Math.cos(theta)} 
            y1={originY + 1000 * Math.sin(theta)}
            x2={originX + 1000 * Math.cos(theta)} 
            y2={originY - 1000 * Math.sin(theta)}
            class="axis-line"
        />
        
        <!-- Tangential Axis perpendicular to arm -->
        <line 
            x1={originX - 1000 * Math.cos(theta + Math.PI/2)} 
            y1={originY + 1000 * Math.sin(theta + Math.PI/2)}
            x2={originX + 1000 * Math.cos(theta + Math.PI/2)} 
            y2={originY - 1000 * Math.sin(theta + Math.PI/2)}
            class="axis-line"
        />
        
        <!-- Radial Component (Dashed, Inactive) -->
        <line
            x1={originX}
            y1={originY}
            x2={p1X}
            y2={p1Y}
            class="component-arrow dashed"
        />
        
        <!-- Tangential Component (Continuous) - Matches the Rotor Kick Arrow -->
        <line
            x1={p1X}
            y1={p1Y}
            x2={endX}
            y2={endY}
            class="component-arrow solid kick-component"
            marker-end="url(#arrowhead-solid)"
        />
        
        <!-- Fixed Force K (Dashed) -->
        <line
            x1={originX}
            y1={originY}
            x2={endX}
            y2={endY}
            class="fixed-force-arrow dashed"
            marker-end="url(#arrowhead-dashed)"
        />
        
        <!-- Labels -->
        <text x={endX - 15} y={endY - 5} class="label">K</text>
        
    </svg>
</div>

<style>
    .decomposition-container {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .axis-line {
        stroke: #4a4a5a;
        stroke-width: 1;
        stroke-dasharray: 4 4;
        opacity: 0.5;
    }
    
    .dashed {
        stroke-dasharray: 6 3;
    }
    
    .solid {
        stroke-dasharray: none;
    }
    
    .fixed-force-arrow {
        stroke: #ffa500;
        stroke-width: 2; /* Reduced width for dashed style */
    }
    
    .component-arrow {
        stroke: #ffa500;
        stroke-width: 2;
        opacity: 0.8;
    }
    
    .kick-component {
        stroke: #ffa500; 
        stroke-width: 3; /* Thicker for emphasis (continuous) */
        opacity: 1;
    }
    
    .label {
        fill: #ffa500;
        font-family: "Courier New", monospace;
        font-size: 12px;
    }
</style>
