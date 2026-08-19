import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function base(p: P): P {
  return {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...p,
  };
}

/* orchestrator spark */
export const IcSpark = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 2.6c.7 4.6 2.3 6.6 7 7.4-4.7.8-6.3 2.8-7 7.4-.7-4.6-2.3-6.6-7-7.4 4.7-.8 6.3-2.8 7-7.4Z" />
    <path d="M19 15.5l.6 2.9 2.9.6-2.9.6-.6 2.9-.6-2.9-2.9-.6 2.9-.6.6-2.9Z" strokeWidth={1.3} />
  </svg>
);

/* product tag */
export const IcTag = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 12.6V5.5a2 2 0 0 1 2-2h7.1a2 2 0 0 1 1.4.6l6.4 6.4a2 2 0 0 1 0 2.8l-7.1 7.1a2 2 0 0 1-2.8 0l-6.4-6.4a2 2 0 0 1-.6-1.4Z" />
    <circle cx="8.2" cy="8.2" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

/* spec / document */
export const IcDoc = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 3.5h8l4 4V20a.9.9 0 0 1-1 .9H6a.9.9 0 0 1-1-.9V4.4a.9.9 0 0 1 1-.9Z" />
    <path d="M14 3.5V8h4.2M8.4 12h7.2M8.4 15.5h7.2" />
  </svg>
);

/* scout radar */
export const IcRadar = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 12 18.5 6" />
    <circle cx="12" cy="12" r="2.4" />
    <path d="M12 4.2a7.8 7.8 0 1 0 7.8 7.8" />
    <path d="M12 7.4a4.6 4.6 0 1 0 4.6 4.6" opacity=".55" />
  </svg>
);

/* voice call */
export const IcPhone = (p: P) => (
  <svg {...base(p)}>
    <path d="M5.2 4.5h3l1.5 3.8-1.9 1.5a12.4 12.4 0 0 0 6.4 6.4l1.5-1.9 3.8 1.5v3a1.7 1.7 0 0 1-1.8 1.7C10.5 20 4 13.5 3.5 6.3a1.7 1.7 0 0 1 1.7-1.8Z" />
  </svg>
);

/* tv / screen */
export const IcTv = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.2" y="5" width="17.6" height="11.4" rx="1.4" />
    <path d="M8.6 20h6.8M12 16.4V20" />
  </svg>
);

/* vacuum */
export const IcVacuum = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.8v2.4M5.6 17.6l2-1.6" opacity=".7" />
  </svg>
);

/* chat / whatsapp-style */
export const IcChat = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.8a8 8 0 0 0-6.9 12l-.9 4 4.1-.9A8 8 0 1 0 12 3.8Z" />
    <path d="M8.6 10.2c.3 2.3 2.9 4.9 5.2 5.2l1.2-1.3-2-1.2-.9.7a5.7 5.7 0 0 1-2.3-2.3l.7-.9-1.2-2-1.7.8Z" strokeWidth={1.3} />
  </svg>
);

/* external link */
export const IcLink = (p: P) => (
  <svg {...base(p)}>
    <path d="M9.5 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5" />
    <path d="M13.5 4H20v6.5M20 4 11 13" />
  </svg>
);

/* scale / analysis */
export const IcScale = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v16M7 20h10M12 4l-5.5 3M12 4l5.5 3" />
    <path d="M3.5 12.5 6.5 7l3 5.5a3.2 3.2 0 0 1-6 0ZM14.5 12.5 17.5 7l3 5.5a3.2 3.2 0 0 1-6 0Z" />
  </svg>
);

/* shield check */
export const IcShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.2 5 5.8v5.4c0 4.5 3 7.9 7 9.6 4-1.7 7-5.1 7-9.6V5.8L12 3.2Z" />
    <path d="m9 11.8 2.2 2.2L15.4 9.6" />
  </svg>
);

export const IcCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m4.5 12.8 4.7 4.7L19.5 7" />
  </svg>
);

export const IcArrow = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12h16M13.5 5.5 20 12l-6.5 6.5" />
  </svg>
);

export const IcX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IcChevron = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 9.5 6 6 6-6" />
  </svg>
);

export const IcWallet = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a1 1 0 0 1 1 1v2" />
    <path d="M4 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5Z" />
    <circle cx="16" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const IcBolt = (p: P) => (
  <svg {...base(p)}>
    <path d="M13 2.5 4.5 13.5H11L10 21.5l8.5-11H12l1-8Z" />
  </svg>
);

export const IcAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.8 2.8 19.5h18.4L12 3.8Z" />
    <path d="M12 10v4.2" />
    <circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none" />
  </svg>
);

export const IcReplay = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 5v5h5" />
    <path d="M4.6 10A8 8 0 1 1 4 13.5" />
  </svg>
);

export const IcFwd = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 6 6 6-6 6M13 6l6 6-6 6" />
  </svg>
);

export const IcPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z" />
    <circle cx="12" cy="10.3" r="2.2" />
  </svg>
);

export const IcCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M5.5 15.5h-1a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </svg>
);

export const IcGavel = (p: P) => (
  <svg {...base(p)}>
    <path d="m13.2 6.2 4.6 4.6M9.4 10l4.6 4.6M11.3 4.3l6.5 6.5M12.6 8.1 6 14.7a1.6 1.6 0 0 0 2.3 2.3l6.6-6.6" />
    <path d="M3.5 20.5h9" />
  </svg>
);
