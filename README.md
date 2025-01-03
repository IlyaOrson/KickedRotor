# The Kicked Rotor: Chaos on a Swing

Welcome to the curious world of the [kicked rotor](https://en.wikipedia.org/wiki/Kicked_rotator), a physical system that thrives with chaos!

A rotor is similar to a rigid pendulum, which can rotate without friction around a fixed point.
A kicked rotor is a gravity-free rotor that gets periodically hit with a specific rhythm, direction and strength, like a child on a swing receiving pushes.

This idealised system is governed by 2 equations known as the [Chirikov Standard Map](http://www.scholarpedia.org/article/Chirikov_standard_map):

$$
p_{n+1} = p_n + K \sin(\theta_n) \mod 2\pi
$$

$$
\theta_{n+1} = \theta_n + p_{n+1} \ \ \ \ \ \ \ \ \ \mod 2\pi
$$

Here, θ represents the angle, p the angular momentum, and K the kick strength - the chaos tuner.

Each point on the interactive map represents a particular position and velocity of the rotor.
While the rotor receives kicks at a constant rhythm, it's the strength of each kick what determines whether the next states of the rotor will remain predictable or evolve chaotically.
The kicked rotor demonstrates how captivating complexity can emerge from simplicity, a theme that resonates throughout nature.

## Interactive exploration 🧑‍🔬

- **Click new paths**: Each click sets a rotor on a particular angle (θ) and velocity of rotation (p). Points of the same colour show where the rotor ends up after each kick. This trajectory of points is calculated from the equations above and animated to be able to follow where the rotor lands after many consistent kicks of the same strength. Watch closely how unexpected symmetries unfold!
- **Play with K**: Start with K = 0.5 and watch ordered, predictable motion. Crank it up past K ≈ 0.971635... (the critical parameter) and witness the onset of global chaos.
- **Hunt for islands**: Even in the chaotic sea (high K), you can find stable regions of tangible symmetry (called *islands* or *KAM tori*). These [KAM tori](http://www.scholarpedia.org/article/Kolmogorov-Arnold-Moser_theory) are the last survivors of order in a chaotic world. Can you find them?

## Physical connections 🪐

- In our solar system, similar dynamics explain the mysterious [*Kirkwood gaps*](https://en.wikipedia.org/wiki/Kirkwood_gap) in the asteroid belt - regions where asteroids are conspicuously absent due to Jupiter's gravitational kicks ([Moons, 1996](https://doi.org/10.1007/BF00048446)).

- Scientists at the NIST created a real quantum kicked rotor using cesium atoms in a pulsed optical lattice. They discovered that quantum mechanics can actually suppress chaos - a phenomenon called *dynamical localization* ([Moore et al., 1995](https://doi.org/10.1103/PhysRevLett.73.2974)). Turns out this counterintuitive phenomenon has practical implications for quantum computing ([Pizzamiglio et al., 2021](https://doi.org/10.3390/e23060654)).

- In fusion reactors, plasma (super-hot ionized gas) is confined in a donut-shaped magnetic field. The plasma particles receive kicks from magnetic field perturbations as they orbit, just like the kicked rotor system, which lead to regions of stability known as *magnetic islands* and to chaos regions on their border ([Willensdorfer et al., 2024](https://doi.org/10.1038/s41567-024-02666-y)), affecting our ability to contain the plasma. Luckily the [Chirikov criterion](http://www.scholarpedia.org/article/Chirikov_criterion) helps to predict under which conditions will chaos emerge.

## Final thoughts 💭

Perhaps the most profound insight from the kicked rotor is this: chaos and order aren't opposites - they're dance partners in a cosmic swing.
When playing with the Kicked Rotor we are exploring fundamental principles that relate seemingly unrelated physical phenomena, from atomic behaviour to celestial mechanics.

So go ahead, click around and hunt for stable regions! Every trajectory tells a story about the delicate balance between predictability and chaos.

---

See *Chaos in Dynamical Systems* by Edward Ott for a nice book on the subject.