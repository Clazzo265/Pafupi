export function Neighborhood() {
  return (
    <svg
      viewBox="0 0 530 310"
      className="neighborhood"
      role="img"
      aria-label="Illustration of neighbours helping each other around a leafy campus"
    >
      <defs>
        <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#a4c9a0" opacity=".18" />
        </pattern>
        <linearGradient id="hill" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#38795a" />
          <stop offset="1" stopColor="#256247" />
        </linearGradient>
      </defs>
      <rect width="530" height="310" fill="url(#dots)" />
      <ellipse cx="310" cy="255" rx="218" ry="43" fill="#104531" opacity=".4" />
      <path d="M45 235Q105 178 160 215T300 212T501 235L497 268H50Z" fill="url(#hill)" />
      <path
        d="M151 264Q160 238 241 239T365 193"
        stroke="#c7d6aa"
        strokeWidth="24"
        fill="none"
        opacity=".8"
      />
      <path
        d="M154 263Q165 240 243 240T363 193"
        stroke="#f3eed6"
        strokeWidth="2"
        strokeDasharray="5 7"
        fill="none"
      />
      <g transform="translate(101 91)">
        <path d="M-16 72L64 12l79 60" fill="#d6a46b" />
        <path d="M-5 66L64 21l68 45v90H-5Z" fill="#f3deae" />
        <path d="M64 21l68 45v90H64Z" fill="#dbbe85" />
        <path
          d="M-17 72L64 12l81 60"
          fill="none"
          stroke="#d38c5a"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <rect x="12" y="82" width="30" height="30" rx="2" fill="#3c6e59" />
        <path d="M27 82v30m-15-15h30" stroke="#f3deae" strokeWidth="3" />
        <rect x="79" y="82" width="29" height="30" rx="2" fill="#3c6e59" />
        <path d="M93 82v30m-14-15h29" stroke="#dbbe85" strokeWidth="3" />
        <path d="M47 117h25v39H47z" fill="#9f6945" />
        <circle cx="64" cy="137" r="2" fill="#efdbb1" />
        <path d="M-13 157h150" stroke="#a2b97d" strokeWidth="7" strokeLinecap="round" />
      </g>
      <g transform="translate(326 102)">
        <path d="M0 58l58-35 58 35v91H0z" fill="#e6b393" />
        <path d="M58 23l58 35v91H58Z" fill="#c68f6e" />
        <path
          d="M-9 57l67-40 67 40"
          fill="none"
          stroke="#b6bd83"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <rect x="12" y="72" width="30" height="24" fill="#406d55" />
        <path d="M27 72v24m-15-12h30" stroke="#e6b393" strokeWidth="2" />
        <rect x="72" y="72" width="28" height="24" fill="#406d55" />
        <path d="M86 72v24m-14-12h28" stroke="#c68f6e" strokeWidth="2" />
        <rect x="44" y="110" width="24" height="39" fill="#794e39" />
      </g>
      <g stroke="#8a9f62" strokeWidth="6" strokeLinecap="round">
        <path d="M68 247v-75m409 77v-84M286 204v-86" />
      </g>
      <g fill="#77a26b">
        <ellipse cx="68" cy="157" rx="31" ry="48" />
        <ellipse cx="477" cy="154" rx="27" ry="42" />
        <ellipse cx="286" cy="111" rx="29" ry="48" />
      </g>
      <g fill="#8fb77b">
        <ellipse cx="57" cy="148" rx="20" ry="31" />
        <ellipse cx="467" cy="145" rx="18" ry="27" />
        <ellipse cx="277" cy="99" rx="18" ry="30" />
      </g>
      <g transform="translate(259 191)">
        <ellipse cx="0" cy="59" rx="20" ry="5" fill="#194f39" />
        <path d="M-3 30l-8 26m16-26 9 26" stroke="#233e34" strokeWidth="7" strokeLinecap="round" />
        <path d="M-6 11q8-6 15 0l6 22H-11Z" fill="#f1b071" />
        <path d="M-7 15l-12 14m28-13 13 9" stroke="#d8a17b" strokeWidth="5" strokeLinecap="round" />
        <circle cx="1" cy="0" r="8" fill="#d8a17b" />
        <path d="M-7 0q-3-14 10-10 8 2 5 11L3-5Z" fill="#263f32" />
        <rect x="18" y="19" width="19" height="19" rx="2" fill="#d5dea9" />
        <path d="M24 19v-4h7v4" fill="none" stroke="#d5dea9" strokeWidth="2" />
      </g>
      <g transform="translate(386 212)">
        <circle cx="-22" cy="35" r="17" fill="none" stroke="#143e30" strokeWidth="4" />
        <circle cx="27" cy="35" r="17" fill="none" stroke="#143e30" strokeWidth="4" />
        <path
          d="M-22 35l18-26 13 26h-31L-7 17h28l6 18m-6-18-3-13h-9"
          fill="none"
          stroke="#edb173"
          strokeWidth="3"
        />
        <path
          d="M0-12l-6 20 17 8-11 17"
          fill="none"
          stroke="#d8a17b"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M-1-18l14 8 7 13"
          stroke="#b5d18e"
          strokeWidth="11"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="-1" cy="-27" r="8" fill="#d8a17b" />
        <path d="M-9-28q0-12 10-9l7 5" stroke="#253f32" strokeWidth="4" fill="none" />
      </g>
      <g transform="translate(227 49)">
        <rect width="162" height="37" rx="18.5" fill="#fff9e9" />
        <circle cx="20" cy="18" r="8" fill="#d9e9b7" />
        <path d="M16 18l3 3 6-6" stroke="#3b6c4a" strokeWidth="2" fill="none" />
        <text
          x="36"
          y="23"
          fill="#3c6048"
          fontSize="11"
          fontFamily="Arial, sans-serif"
          fontWeight="600"
        >
          Good people, nearby
        </text>
      </g>
      <path
        d="M420 62v14m-7-7h14M113 54v10m-5-5h10"
        stroke="#c5d5a2"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <g fill="#b7ca8b">
        <circle cx="455" cy="103" r="3" />
        <circle cx="170" cy="49" r="3" />
        <circle cx="313" cy="171" r="2" />
      </g>
    </svg>
  );
}
