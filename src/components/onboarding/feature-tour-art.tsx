/** Illustrations for the unique-feature tour (black / white / grey). */

export function ArtDescribePlace() {
  return (
    <svg viewBox="0 0 320 280" className="h-auto w-full" aria-hidden>
      <rect width="320" height="280" rx="32" fill="#f5f5f5" />
      <g stroke="#000" strokeOpacity="0.08" strokeWidth="1.5">
        <path d="M36 100h248M36 148h248M36 196h248" />
        <path d="M88 56v176M160 56v176M232 56v176" />
      </g>
      {/* Landmark pin */}
      <g transform="translate(136 72)">
        <path
          d="M24 0c-11 0-20 9-20 20 0 16 20 40 20 40s20-24 20-40c0-11-9-20-20-20z"
          fill="#000"
        />
        <circle cx="24" cy="19" r="7" fill="#fff" />
      </g>
      {/* Description bubble */}
      <rect
        x="48"
        y="168"
        width="224"
        height="72"
        rx="18"
        fill="#fff"
        stroke="#e5e5e5"
        strokeWidth="2"
      />
      <text
        x="160"
        y="198"
        textAnchor="middle"
        fill="#111"
        fontSize="13"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        “House with green gate,
      </text>
      <text
        x="160"
        y="218"
        textAnchor="middle"
        fill="#111"
        fontSize="13"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        next to the mango tree”
      </text>
    </svg>
  );
}

export function ArtWearing() {
  return (
    <svg viewBox="0 0 320 280" className="h-auto w-full" aria-hidden>
      <rect width="320" height="280" rx="32" fill="#f5f5f5" />
      {/* Person silhouette */}
      <circle cx="160" cy="88" r="28" fill="#000" />
      <path
        d="M110 200c8-44 28-64 50-64s42 20 50 64"
        fill="#1a1a1a"
      />
      {/* Outfit card */}
      <rect
        x="56"
        y="168"
        width="208"
        height="72"
        rx="18"
        fill="#fff"
        stroke="#e5e5e5"
        strokeWidth="2"
      />
      <text
        x="160"
        y="198"
        textAnchor="middle"
        fill="#111"
        fontSize="14"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        “Nike tracksuit”
      </text>
      <text
        x="160"
        y="220"
        textAnchor="middle"
        fill="#6e6e6e"
        fontSize="12"
        fontFamily="system-ui,sans-serif"
      >
        Driver spots you faster
      </text>
    </svg>
  );
}

export function ArtShopLocal() {
  return (
    <svg viewBox="0 0 320 280" className="h-auto w-full" aria-hidden>
      <rect width="320" height="280" rx="32" fill="#f5f5f5" />
      {/* Shop facade */}
      <rect x="70" y="96" width="180" height="120" rx="12" fill="#fff" stroke="#e5e5e5" strokeWidth="2" />
      <path d="M58 96h204l-18-36H76z" fill="#000" />
      <rect x="96" y="128" width="48" height="56" rx="6" fill="#f0f0f0" />
      <rect x="176" y="128" width="48" height="56" rx="6" fill="#f0f0f0" />
      <rect x="136" y="168" width="48" height="48" rx="6" fill="#1a1a1a" />
      {/* Bag */}
      <g transform="translate(214 148)">
        <rect x="0" y="12" width="40" height="36" rx="6" fill="#000" />
        <path
          d="M10 18v-6c0-8 6-12 10-12s10 4 10 12v6"
          fill="none"
          stroke="#000"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
      <text
        x="160"
        y="248"
        textAnchor="middle"
        fill="#6e6e6e"
        fontSize="13"
        fontFamily="system-ui,sans-serif"
        fontWeight="600"
      >
        Order from Qunu Spaza
      </text>
    </svg>
  );
}

export function ArtFuelHelp() {
  return (
    <svg viewBox="0 0 320 280" className="h-auto w-full" aria-hidden>
      <rect width="320" height="280" rx="32" fill="#f5f5f5" />
      {/* Road */}
      <path d="M0 210h320" stroke="#d4d4d4" strokeWidth="10" />
      <path
        d="M0 210h320"
        stroke="#fff"
        strokeWidth="2"
        strokeDasharray="16 14"
      />
      {/* Car */}
      <g transform="translate(48 148)">
        <rect x="10" y="28" width="110" height="36" rx="10" fill="#000" />
        <path d="M30 28h50l16 24H20z" fill="#1a1a1a" />
        <circle cx="36" cy="68" r="12" fill="#333" />
        <circle cx="96" cy="68" r="12" fill="#333" />
      </g>
      {/* Fuel callout */}
      <rect
        x="176"
        y="72"
        width="112"
        height="96"
        rx="18"
        fill="#fff"
        stroke="#e5e5e5"
        strokeWidth="2"
      />
      <rect x="212" y="92" width="40" height="52" rx="8" fill="#000" />
      <rect x="248" y="104" width="14" height="28" rx="3" fill="#444" />
      <text
        x="232"
        y="164"
        textAnchor="middle"
        fill="#111"
        fontSize="12"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        Out of fuel
      </text>
    </svg>
  );
}
