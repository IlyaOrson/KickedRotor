<script>
  const REPO_URL = "https://github.com/IlyaOrson/KickedRotor";
  const size = 24;
  let isHovered = $state(false);

  function onMouseEnter() {
    isHovered = true;
  }

  function onMouseLeave() {
    isHovered = false;
  }
</script>

<a
  href={REPO_URL}
  target="_blank"
  rel="noopener noreferrer"
  aria-label="GitHub Repository"
  class="github-link"
  onmouseenter={onMouseEnter}
  onmouseleave={onMouseLeave}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{size}"
    height="{size}"
    viewBox="0 0 {size} {size}"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="github-icon"
    class:hovered={isHovered}
    >
    <path
      d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
    />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
</a>

<style>
  .github-link {
    color: #00ff8c;
    transition: all 0.3s ease;
    display: flex;
  }

  .github-icon {
    filter: drop-shadow(0 0 5px #00ff8c);
    transition: all 0.3s ease;
  }

  .github-icon.hovered {
    filter: drop-shadow(0 0 10px #00ff8c);
    transform: scale(1.1);
  }

  @media (hover: hover) {
    .github-link:hover {
      transform: translateY(-2px);
    }
  }
</style>
