const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;

export const icons = {
  moon: svg('<path d="M20 14.6A8.4 8.4 0 0 1 9.4 4a8.4 8.4 0 1 0 10.6 10.6Z"/>'),
  sun: svg('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/>'),
  soundOn: svg('<path d="M4 9.5h3.2L12 5.6v12.8l-4.8-3.9H4z"/><path d="M15.4 9.2a4 4 0 0 1 0 5.6M17.9 6.7a7.5 7.5 0 0 1 0 10.6"/>'),
  soundOff: svg('<path d="M4 9.5h3.2L12 5.6v12.8l-4.8-3.9H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  arrow: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5 2.5 10.5 8 5 13.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
