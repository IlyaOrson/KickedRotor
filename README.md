# The Kicked Rotor: Chaos on a Swing

Welcome to the fascinating world of the [kicked rotor](https://en.wikipedia.org/wiki/Kicked_rotator), a fun model to play with chaos.

Imagine a simple pendulum that gets periodically kicked, like a child on a swing receiving random pushes. This simple system is governed by two elegant equations:

$$
p_{n+1} = p_n + K \sin(\theta_n) \mod 2\pi
$$

$$
\theta_{n+1} = \theta_n + p_{n+1} \ \ \ \ \ \ \ \ \ \mod 2\pi
$$

Here, θ represents the angle, p the angular momentum, and K the kick strength - the chaos tuner!
While the pendulum receives kicks at a constant rhythm, it's the strength of each kick that determines whether the motion remains predictable or descends into chaos.
These memorable equations, known as the [**Chirikov Standard Map**](http://www.scholarpedia.org/article/Chirikov_standard_map), demonstrate how captivating complexity can emerge from simplicity, a theme that resonates throughout nature.

## Physical connections 🪐

- In our solar system, similar dynamics explain the mysterious Kirkwood gaps in the asteroid belt - regions where asteroids are conspicuously absent due to Jupiter's gravitational kicks (Meiss, 1992).

- Scientists at the NIST created a real quantum kicked rotor using cesium atoms in a pulsed optical lattice. They discovered that quantum mechanics can actually suppress chaos - a phenomenon called dynamical localization (Moore et al., Nature, 1995). This finding challenges our intuitions and has practical implications for quantum computing.

- In fusion reactors, plasma (super-hot ionized gas) is confined in a donut-shaped magnetic field. The particles can receive kicks from magnetic field perturbations as they orbit, similar to our pendulum. These perturbations can lead to magnetic islands and chaos, affecting our ability to contain the plasma. The [Chirikov criterion](http://www.scholarpedia.org/article/Chirikov_criterion) helps predict when chaos will emerge.

## Interactive Exploration 🧑‍🔬

- **Play with K**: Start with K = 0.5 and watch ordered, predictable motion. Crank it up past K ≈ 0.971635... (the critical parameter) and witness the onset of global chaos.
- **Click new paths**: Each click sets an initial system state that evolves into a trajectory following the equations of motion. Watch the system's unexpected symmetries unfold!
- **Hunt for Islands**: Even in the chaotic sea (high K), you can find stable islands. These "KAM tori" are the last survivors of order in a chaotic world. Can you find them?

## Final thoughts 💭

Perhaps the most profound insight from the kicked rotor is this: chaos and order aren't opposites - they're dance partners in a cosmic swing.
Playing with the interactive visualization we are exploring fundamental principles that relate seemingly unrelated physical phenomena, from atomic behaviour to celestial mechanics.

So go ahead, start clicking! Every trajectory tells a story about the balance between predictability and chaos.

---

See *Chaos in Dynamical Systems* by Edward Ott for a nice book on the subject.