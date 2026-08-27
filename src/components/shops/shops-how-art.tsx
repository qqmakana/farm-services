/** How Shops work — black / white / warm grocery art. Unique ids so gradients never clash. */

export function ArtShopChoose() {
  return (
    <svg viewBox="0 0 320 220" className="h-auto w-full" aria-hidden>
      <defs>
        <linearGradient id="shopsHowChooseBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF8EE" />
          <stop offset="100%" stopColor="#F3F3F3" />
        </linearGradient>
      </defs>
      <rect width="320" height="220" rx="28" fill="url(#shopsHowChooseBg)" />
      <g>
        <rect x="28" y="36" width="124" height="148" rx="22" fill="#fff" />
        <rect x="28" y="36" width="124" height="148" rx="22" fill="none" stroke="#E8E8E8" strokeWidth="2" />
        <rect x="48" y="56" width="84" height="10" rx="5" fill="#111" />
        <rect x="48" y="76" width="68" height="8" rx="4" fill="#D8D8D8" />
        <rect x="48" y="94" width="76" height="8" rx="4" fill="#D8D8D8" />
        <rect x="48" y="112" width="52" height="8" rx="4" fill="#D8D8D8" />
        <rect x="48" y="142" width="84" height="22" rx="11" fill="#000" />
        <text
          x="90"
          y="157"
          textAnchor="middle"
          fill="#fff"
          fontSize="10"
          fontFamily="system-ui,sans-serif"
          fontWeight="700"
        >
          Send list
        </text>
      </g>
      <g>
        <rect x="168" y="36" width="124" height="148" rx="22" fill="#111" />
        <rect x="184" y="54" width="92" height="56" rx="12" fill="#2A2A2A" />
        <circle cx="208" cy="82" r="10" fill="#FFB020" />
        <circle cx="230" cy="78" r="8" fill="#0ECB81" />
        <circle cx="250" cy="86" r="7" fill="#EEEEEA" />
        <rect x="184" y="122" width="70" height="8" rx="4" fill="#fff" />
        <rect x="184" y="138" width="48" height="7" rx="3.5" fill="#6B6B6B" />
        <text
          x="230"
          y="170"
          textAnchor="middle"
          fill="#fff"
          fontSize="10"
          fontFamily="system-ui,sans-serif"
          fontWeight="700"
        >
          Nearby menu
        </text>
      </g>
    </svg>
  );
}

export function ArtShopDriver() {
  return (
    <svg viewBox="0 0 320 220" className="h-auto w-full" aria-hidden>
      <rect width="320" height="220" rx="28" fill="#F3F3F3" />
      <path d="M0 168c70-28 120-20 160 4 40 24 90 20 160-8v56H0z" fill="#E8E8E8" />
      <rect x="36" y="48" width="92" height="132" rx="16" fill="#111" />
      <rect x="44" y="60" width="76" height="100" rx="8" fill="#fff" />
      <rect x="52" y="72" width="60" height="8" rx="4" fill="#111" />
      <rect x="52" y="88" width="44" height="6" rx="3" fill="#D4D4D4" />
      <rect x="52" y="102" width="52" height="6" rx="3" fill="#D4D4D4" />
      <rect x="52" y="116" width="36" height="6" rx="3" fill="#D4D4D4" />
      <circle cx="82" cy="150" r="5" fill="#333" />
      <g transform="translate(148 78)">
        <rect x="8" y="36" width="128" height="38" rx="10" fill="#111" />
        <path d="M36 36h64l16 26H24z" fill="#1a1a1a" />
        <rect x="44" y="42" width="24" height="14" rx="3" fill="#d4d4d4" />
        <rect x="78" y="42" width="24" height="14" rx="3" fill="#d4d4d4" />
        <circle cx="36" cy="76" r="12" fill="#1A1A1A" />
        <circle cx="36" cy="76" r="5" fill="#888" />
        <circle cx="122" cy="76" r="12" fill="#1A1A1A" />
        <circle cx="122" cy="76" r="5" fill="#888" />
        <rect x="108" y="14" width="32" height="26" rx="5" fill="#FFB020" />
        <path d="M108 24h32" stroke="#fff" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function ArtShopTill() {
  return (
    <svg viewBox="0 0 320 220" className="h-auto w-full" aria-hidden>
      <rect width="320" height="220" rx="28" fill="#F6F6F6" />
      <rect x="28" y="40" width="156" height="140" rx="20" fill="#fff" stroke="#E8E8E8" strokeWidth="2" />
      <text
        x="106"
        y="68"
        textAnchor="middle"
        fill="#6B6B6B"
        fontSize="11"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        AT THE SHOP
      </text>
      <rect x="48" y="82" width="116" height="10" rx="5" fill="#111" />
      <rect x="48" y="102" width="88" height="8" rx="4" fill="#D8D8D8" />
      <rect x="48" y="118" width="72" height="8" rx="4" fill="#D8D8D8" />
      <rect x="48" y="144" width="116" height="18" rx="9" fill="#F3F3F3" />
      <text
        x="106"
        y="157"
        textAnchor="middle"
        fill="#111"
        fontSize="11"
        fontFamily="system-ui,sans-serif"
        fontWeight="800"
      >
        You pay the goods
      </text>
      <rect x="196" y="58" width="96" height="108" rx="20" fill="#111" />
      <text
        x="244"
        y="86"
        textAnchor="middle"
        fill="#A6A6A6"
        fontSize="10"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        VILLAGE RIDE
      </text>
      <text
        x="244"
        y="122"
        textAnchor="middle"
        fill="#fff"
        fontSize="22"
        fontFamily="system-ui,sans-serif"
        fontWeight="800"
      >
        R15
      </text>
      <text
        x="244"
        y="144"
        textAnchor="middle"
        fill="#0ECB81"
        fontSize="11"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        Delivery only
      </text>
    </svg>
  );
}

export function ArtShopArrive() {
  return (
    <svg viewBox="0 0 320 220" className="h-auto w-full" aria-hidden>
      <defs>
        <linearGradient id="shopsHowArriveBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F3F3F3" />
          <stop offset="100%" stopColor="#EAEAEA" />
        </linearGradient>
      </defs>
      <rect width="320" height="220" rx="28" fill="url(#shopsHowArriveBg)" />
      <g transform="translate(132 28)">
        <path
          d="M28 0c-14 0-26 12-26 26 0 20 26 50 26 50s26-30 26-50c0-14-12-26-26-26z"
          fill="#000"
        />
        <circle cx="28" cy="25" r="9" fill="#fff" />
      </g>
      <rect x="40" y="128" width="240" height="64" rx="20" fill="#fff" />
      <rect x="56" y="146" width="96" height="28" rx="14" fill="#000" />
      <text
        x="104"
        y="165"
        textAnchor="middle"
        fill="#fff"
        fontSize="12"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        Cash
      </text>
      <rect x="168" y="146" width="96" height="28" rx="14" fill="#EEEEEE" />
      <text
        x="216"
        y="165"
        textAnchor="middle"
        fill="#111"
        fontSize="12"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        Card
      </text>
    </svg>
  );
}
