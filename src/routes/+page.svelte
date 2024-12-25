<!-- KickedRotor.svelte -->
<script lang="ts">
    // Constants for SVG dimensions
    const width = 800;
    const height = 500;
    const margin = 50;

    // State using runes
    let kParameter = $state(1.5);
    let points = $state<[number, number][][]>([]);
    let initialPoints = $state<[number, number][]>([]);  // Store initial conditions
    let isAnimating = $state(false);
    let animationInterval = $state<number | undefined>(undefined);
    let selectedTrajectory = $state<number | null>(null);
    let isAddingPoint = $state(true);  // Toggle for adding new points

    // Computed values using runes
    let chaosLevel = $derived(kParameter > 2.5 ? 'Chaotic' : kParameter > 1.5 ? 'Mixed' : 'Regular');
    
    // Colors
    const colors = {
        background: '#1a1a2e',
        trajectoryColors: [
            '#00ff9d', // cyan
            '#ff0055', // magenta
            '#ffcc00', // yellow
            '#00ccff', // blue
            '#ff6600'  // orange
        ],
        axes: '#4a4a6a',
        text: '#ffffff'
    };

    function fromSVGCoords(x: number, y: number): [number, number] {
        const theta = ((x - margin) / (width - 2 * margin)) * 2 * Math.PI;
        const p = ((y - margin) / (height - 2 * margin)) * 4 - 2;
        return [theta, p];
    }

    function nextState(theta: number, p: number, k: number): [number, number] {
        const newP = p + k * Math.sin(theta);
        const newTheta = (theta + newP) % (2 * Math.PI);
        return [newTheta, newP];
    }

    function generateTrajectory(initialTheta: number, initialP: number, steps: number): [number, number][] {
        let trajectory: [number, number][] = [];
        let theta = initialTheta;
        let p = initialP;
        
        for (let i = 0; i < steps; i++) {
            trajectory.push([theta, p]);
            [theta, p] = nextState(theta, p, kParameter);
        }
        
        return trajectory;
    }

    function handlePhaseSpaceClick(event: MouseEvent) {
        if (!isAddingPoint) return;
        if (points.length >= 5) return; // Limit to 5 trajectories
        
        const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const [theta, p] = fromSVGCoords(x, y);
        
        // Generate new trajectory
        const newTrajectory = generateTrajectory(theta, p, 150);
        points = [...points, newTrajectory];
        initialPoints = [...initialPoints, [theta, p]];
    }

    function initializePhaseSpace() {
        points = [];
        initialPoints = [];
    }

    function toSVGCoords(theta: number, p: number): [number, number] {
        const x = margin + (theta / (2 * Math.PI)) * (width - 2 * margin);
        const y = margin + ((p + 2) / 4) * (height - 2 * margin);
        return [x, y];
    }

    // Animation control with smoother transitions
    $effect(() => {
        if (isAnimating) {
            animationInterval = setInterval(() => {
                points = points.map(trajectory => {
                    const [lastTheta, lastP] = trajectory[trajectory.length - 1];
                    const [newTheta, newP] = nextState(lastTheta, lastP, kParameter);
                    return [...trajectory.slice(1), [newTheta, newP]];
                });
            }, 30);
        }
        
        return () => {
            if (animationInterval !== undefined) {
                clearInterval(animationInterval);
                animationInterval = undefined;
            }
        };
    });

    // Initialize on component mount
    $effect(() => {
        initializePhaseSpace();
    });

    function handleTrajectoryHover(index: number) {
        selectedTrajectory = index;
    }

    function handleTrajectoryLeave() {
        selectedTrajectory = null;
    }

    function clearTrajectories() {
        points = [];
        initialPoints = [];
        isAnimating = false;
    }
</script>

<div class="container">
    <div class="visualization-card">
        <header>
            <h2>Kicked Rotor Phase Space</h2>
            <div class="system-state">
                System State: <span class="state-indicator {chaosLevel.toLowerCase()}">{chaosLevel}</span>
            </div>
        </header>

        <div class="visualization">
            <svg {width} {height} on:click={handlePhaseSpaceClick}>
                <!-- Grid -->
                {#each Array(10) as _, i}
                    <line 
                        x1={margin} 
                        y1={margin + i * (height - 2 * margin) / 9}
                        x2={width - margin}
                        y2={margin + i * (height - 2 * margin) / 9}
                        class="grid-line"
                    />
                    <line 
                        x1={margin + i * (width - 2 * margin) / 9}
                        y1={margin}
                        x2={margin + i * (width - 2 * margin) / 9}
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
                    y1={margin} 
                    x2={margin} 
                    y2={height - margin} 
                    class="axis"
                />
                
                <!-- Axis labels -->
                <text x={width/2} y={height - 10} class="axis-label">θ (Phase)</text>
                <text x={20} y={height/2} class="axis-label" transform="rotate(-90, 20, {height/2})">p (Momentum)</text>
                
                <!-- Phase space points with trails -->
                {#each points as trajectory, i}
                    <g 
                        on:mouseenter={() => handleTrajectoryHover(i)}
                        on:mouseleave={handleTrajectoryLeave}
                    >
                        {#each trajectory as [theta, p], j}
                            {@const [x, y] = toSVGCoords(theta, p)}
                            <circle
                                cx={x}
                                cy={y}
                                r={selectedTrajectory === i ? 2 : 1}
                                class="point"
                                style="
                                    opacity: {(j / trajectory.length) * 0.8 + 0.2};
                                    fill: {colors.trajectoryColors[i]};
                                "
                            />
                        {/each}
                    </g>
                {/each}

                <!-- Initial points -->
                {#each initialPoints as [theta, p], i}
                    {@const [x, y] = toSVGCoords(theta, p)}
                    <circle
                        cx={x}
                        cy={y}
                        r="4"
                        class="initial-point"
                        style="
                            fill: {colors.trajectoryColors[i]};
                            stroke: white;
                            stroke-width: 1;
                        "
                    />
                {/each}
            </svg>
        </div>

        <div class="controls">
            <div class="button-group">
                <button
                    class="control-button {isAnimating ? 'active' : ''}"
                    on:click={() => isAnimating = !isAnimating}
                >
                    {isAnimating ? '⏸ Pause' : '▶ Start'} Animation
                </button>
                
                <button
                    class="control-button {isAddingPoint ? 'active' : ''}"
                    on:click={() => isAddingPoint = !isAddingPoint}
                >
                    {isAddingPoint ? '✏️ Adding Points' : '🖱️ Click to Add Points'}
                </button>

                <button
                    class="control-button clear"
                    on:click={clearTrajectories}
                >
                    🗑️ Clear All
                </button>
            </div>
            
            <div class="parameter-control">
                <label for="k-parameter">Kicking Strength (K)</label>
                <input
                    id="k-parameter"
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    bind:value={kParameter}
                />
                <span class="parameter-value">K = {kParameter.toFixed(2)}</span>
            </div>
        </div>

        <div class="instructions">
            Click anywhere in the phase space to add up to 5 initial conditions. Each trajectory has its own color. Watch how they evolve differently based on their starting points!
        </div>
    </div>
</div>

<style lang="postcss">
    .container {
        @apply flex justify-center items-center min-h-screen p-8;
        background: linear-gradient(135deg, #0f0f1f 0%, #1a1a2e 100%);
    }

    .visualization-card {
        @apply bg-opacity-90 backdrop-blur-lg rounded-xl shadow-2xl p-8;
        background-color: rgba(26, 26, 46, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    header {
        @apply mb-6 flex justify-between items-center;
    }

    h2 {
        @apply text-2xl font-bold text-white;
        text-shadow: 0 0 10px rgba(0, 255, 157, 0.3);
    }

    .system-state {
        @apply text-sm font-medium;
        color: #4a4a6a;
    }

    .state-indicator {
        @apply px-3 py-1 rounded-full ml-2;
    }

    .state-indicator.regular {
        @apply bg-green-500 bg-opacity-20 text-green-400;
    }

    .state-indicator.mixed {
        @apply bg-yellow-500 bg-opacity-20 text-yellow-400;
    }

    .state-indicator.chaotic {
        @apply bg-red-500 bg-opacity-20 text-red-400;
    }

    .visualization {
        @apply mb-6;
    }

    svg {
        @apply rounded-lg cursor-crosshair;
        background: #1a1a2e;
    }

    .grid-line {
        @apply stroke-current;
        stroke: rgba(74, 74, 106, 0.2);
        stroke-width: 1;
    }

    .axis {
        @apply stroke-current;
        stroke: #4a4a6a;
        stroke-width: 2;
    }

    .axis-label {
        @apply fill-current text-sm;
        fill: #4a4a6a;
        font-family: 'Monaco', monospace;
    }

    .point {
        transition: all 0.2s ease;
    }

    .initial-point {
        filter: drop-shadow(0 0 4px rgba(255, 0, 85, 0.5));
    }

    .controls {
        @apply mt-6 flex flex-col gap-4;
    }

    .button-group {
        @apply flex gap-4 flex-wrap;
    }

    .control-button {
        @apply px-6 py-3 rounded-lg text-white font-medium transition-all duration-200;
        background: linear-gradient(135deg, #00ff9d 0%, #00cc7e 100%);
    }

    .control-button:hover {
        @apply transform scale-105;
        box-shadow: 0 0 20px rgba(0, 255, 157, 0.3);
    }

    .control-button.active {
        background: linear-gradient(135deg, #ff0055 0%, #cc0044 100%);
    }

    .control-button.clear {
        background: linear-gradient(135deg, #666 0%, #444 100%);
    }

    .parameter-control {
        @apply flex flex-col gap-2;
    }

    .parameter-control label {
        @apply text-sm font-medium text-gray-400;
    }

    input[type="range"] {
        @apply w-full;
        -webkit-appearance: none;
        height: 4px;
        background: #4a4a6a;
        border-radius: 2px;
    }

    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: #00ff9d;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 10px rgba(0, 255, 157, 0.5);
    }

    .parameter-value {
        @apply text-sm font-mono text-gray-400;
    }

    .instructions {
        @apply mt-4 text-sm text-gray-400 text-center;
    }
</style>