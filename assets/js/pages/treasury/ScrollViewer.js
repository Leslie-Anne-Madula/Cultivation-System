const UNROLL = "transform 1s cubic-bezier(0.22, 0.7, 0.18, 1)";

/** Full-screen certificate viewer that unrolls like a handscroll. */
export class ScrollViewer {
  constructor(dialog) {
    this.dialog = dialog;
    this.paper = dialog.querySelector("[data-paper]");
    this.image = this.paper.querySelector("img");
    this.caption = dialog.querySelector("[data-caption]");
    this.rods = dialog.querySelectorAll("[data-rod]");
  }

  mount() {
    this.dialog.addEventListener("click", (event) => {
      if (event.target === this.dialog || event.target.hasAttribute("data-stage") || event.target.closest("[data-close]")) this.close();
    });
    this.dialog.addEventListener("close", () => this.paper.classList.remove("open"));
  }

  open(treasure) {
    this.paper.classList.remove("open");
    this.rods.forEach((rod) => (rod.style.transition = "none"));
    this.image.src = treasure.image;
    this.image.alt = `Certificate: ${treasure.title}`;
    this.caption.textContent = `${treasure.title} · ${treasure.issuer} · ${treasure.date}`;
    if (typeof this.dialog.showModal === "function") this.dialog.showModal();
    else this.dialog.setAttribute("open", "");

    const unroll = () => {
      this.setRodOffset(this.paper.offsetWidth / 2);
      void this.paper.offsetWidth;
      requestAnimationFrame(() => {
        this.rods.forEach((rod) => (rod.style.transition = UNROLL));
        this.paper.classList.add("open");
        this.setRodOffset(0);
      });
    };
    if (this.image.complete && this.image.naturalWidth) unroll();
    else this.image.onload = unroll;
  }

  close() {
    if (typeof this.dialog.close === "function") this.dialog.close();
    else this.dialog.removeAttribute("open");
  }

  setRodOffset(pixels) {
    this.rods[0].style.transform = `translateX(${pixels}px)`;
    this.rods[1].style.transform = `translateX(${-pixels}px)`;
  }
}
