/** Illustrations for the product + helpers tour (black / white / grey). */

/** Ride · Delivery · Farm · Courier · Shops overview */
export function ArtServices() {
  const tiles = [
    { x: 28, y: 48, label: "Ride" },
    { x: 172, y: 48, label: "Delivery" },
    { x: 28, y: 148, label: "Farm" },
    { x: 172, y: 148, label: "Courier" },
  ] as const;

  return (
    <svg viewBox="0 0 320 280" className="h-auto w-full" aria-hidden>
      <rect width="320" height="280" rx="32" fill="#f5f5f5" />
      {tiles.map((t) => (
        <g key={t.label}>
          <rect
            x={t.x}
            y={t.y}
            width="120"
            height="84"
            rx="16"
            fill="#fff"
            stroke="#e5e5e5"
            strokeWidth="2"
          />
          <circle cx={t.x + 60} cy={t.y + 32} r="14" fill="#000" />
          <text
            x={t.x + 60}
            y={t.y + 64}
            textAnchor="middle"
            fill="#111"
            fontSize="13"
            fontFamily="system-ui,sans-serif"
            fontWeight="700"
          >
            {t.label}
          </text>
        </g>
      ))}
      <text
        x="160"
        y="258"
        textAnchor="middle"
        fill="#6e6e6e"
        fontSize="12"
        fontFamily="system-ui,sans-serif"
        fontWeight="600"
      >
        + Buy from local shops
      </text>
    </svg>
  );
}

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
        y="192"
        textAnchor="middle"
        fill="#6e6e6e"
        fontSize="11"
        fontFamily="system-ui,sans-serif"
        fontWeight="600"
      >
        When the map doesn’t work
      </text>
      <text
        x="160"
        y="214"
        textAnchor="middle"
        fill="#111"
        fontSize="12"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        “Green gate, mango tree”
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
