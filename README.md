# The Kicked Rotor: Chaos on a Swing

Welcome to the curious dance of the [kicked rotor](https://en.wikipedia.org/wiki/Kicked_rotator), a fun model that thrives with chaos.

Imagine a pendulum that gets periodically kicked on a fixed direction, like a child on a swing receiving pushes with a fixed rhythm and strength.

This idealised system is governed by two simple equations:

$$
p_{n+1} = p_n + K \sin(\theta_n) \mod 2\pi
$$

$$
\theta_{n+1} = \theta_n + p_{n+1} \ \ \ \ \ \ \ \ \ \mod 2\pi
$$

Here, θ represents the angle, p the angular momentum, and K the kick strength - the chaos tuner.

Each point on the interactive map represents then a particular position and velocity of the pendulum.
While the pendulum receives kicks at a constant rhythm, it's the strength of each kick that determines whether the motion of any given initial condition set up with a click will remain predictable or descend into absolute chaos.
These memorable equations, known as the [Chirikov Standard Map](http://www.scholarpedia.org/article/Chirikov_standard_map), demonstrate how captivating complexity can emerge from simplicity, a theme that resonates throughout nature.

## Physical connections 🪐

- In our solar system, similar dynamics explain the mysterious [*Kirkwood gaps*](https://en.wikipedia.org/wiki/Kirkwood_gap) in the asteroid belt - regions where asteroids are conspicuously absent due to Jupiter's gravitational kicks ([Moons and Morbidelly, 1995](https://doi.org/10.1006/icar.1995.1041)).

- Scientists at the NIST created a real quantum kicked rotor using cesium atoms in a pulsed optical lattice. They discovered that quantum mechanics can actually suppress chaos - a phenomenon called *dynamical localization* ([Moore et al., 1995](https://doi.org/10.1103/PhysRevLett.73.2974)). Turns out this counterintuitive phenomenon has practical implications for quantum computing ([Pizzamiglio et al., 2021](https://doi.org/10.3390/e23060654)).

- In fusion reactors, plasma (super-hot ionized gas) is confined in a donut-shaped magnetic field. The plasma particles receive kicks from magnetic field perturbations as they orbit, just like our pendulum system, which lead to regions of stability known as *magnetic islands* and to chaos regions on their border ([Willensdorfer et al., 2024](https://doi.org/10.1038/s41567-024-02666-y)), affecting our ability to contain the plasma. Luckily the [Chirikov criterion](http://www.scholarpedia.org/article/Chirikov_criterion) helps to predict under which conditions will chaos emerge.

## Interactive Exploration 🧑‍🔬

- **Click new paths**: Each click sets an initial system state (θ, p) that evolves into a trajectory following the equations of motion. The animation shows each new system state after a kick. Watch the system's unexpected symmetries unfold!
- **Play with K**: Start with K = 0.5 and watch ordered, predictable motion. Crank it up past K ≈ 0.971635... (the critical parameter) and witness the onset of global chaos.
- **Hunt for Islands**: Even in the chaotic sea (high K), you can find stable islands. These [KAM tori](http://www.scholarpedia.org/article/Kolmogorov-Arnold-Moser_theory) are the last survivors of order in a chaotic world. Can you find them?

## Final thoughts 💭

Perhaps the most profound insight from the kicked rotor is this: chaos and order aren't opposites - they're dance partners in a cosmic swing.
Playing with the interactive visualization we are exploring fundamental principles that relate seemingly unrelated physical phenomena, from atomic behaviour to celestial mechanics.

So go ahead, click around and hunt for stable regions! Every trajectory tells a story about the delicate balance between predictability and chaos.

---

See *Chaos in Dynamical Systems* by Edward Ott for a nice book on the subject.