export default function FeatureArt({ index }: { index: number }) {
  const id = `feature-${index}`;
  return (
    <svg
      className={`feature-art feature-art-${index}`}
      viewBox="0 0 280 155"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="0.3" y2="1">
          <stop stopColor="#b4c7dd" />
          <stop offset=".32" stopColor="#5e7895" />
          <stop offset="1" stopColor="#263b50" />
        </linearGradient>
        <linearGradient id={`${id}-orange`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ffd5a2" />
          <stop offset="1" stopColor="#e57e35" />
        </linearGradient>
        <linearGradient id={`${id}-glass`}>
          <stop stopColor="#3e9bde" stopOpacity=".02" />
          <stop offset="1" stopColor="#3e9bde" stopOpacity=".2" />
        </linearGradient>
        <pattern
          id={`${id}-dots`}
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r=".6" fill="#7293b5" opacity=".3" />
        </pattern>
      </defs>
      <rect width="280" height="155" fill={`url(#${id}-dots)`} />
      {index === 0 && (
        <>
          <path
            d="M39 112 130 146 242 88 151 56Z"
            fill="#263c52"
            fillOpacity=".2"
            stroke="#7895b2"
            strokeOpacity=".25"
          />
          <g transform="translate(140 93) rotate(-27)">
            <rect
              x="-82"
              y="-16"
              width="164"
              height="33"
              rx="16"
              fill={`url(#${id}-steel)`}
            />
            <ellipse
              cx="-66"
              cy="0"
              rx="15"
              ry="16"
              fill="#182a3c"
              stroke="#809ab4"
            />
            <ellipse cx="-66" cy="0" rx="10" ry="11" fill="#0b1621" />
            <path d="M-66 -13H67" stroke="#c4ddf1" strokeOpacity=".45" />
          </g>
          <path
            d="M129 28 78 110 205 66Z"
            fill="#ee9945"
            fillOpacity=".08"
            stroke="#ee9945"
            strokeOpacity=".35"
          />
          <path d="M78 110 205 66" stroke="#f4b263" strokeWidth="2" />
          <rect
            x="114"
            y="12"
            width="35"
            height="19"
            rx="4"
            fill="#4b6179"
            stroke="#9aaec0"
          />
          <circle cx="131" cy="31" r="4" fill="#f6a450" />
          <path d="M123 7h18" stroke="#9aaec0" />
          <g fill="#e5af73">
            {Array.from({ length: 16 }, (_, i) => (
              <circle key={i} cx={81 + i * 8} cy={109 - i * 2.8} r="1.5" />
            ))}
          </g>
        </>
      )}
      {index === 1 && (
        <>
          <path
            d="M48 103 127 138 235 78 156 41Z"
            fill="#23384f"
            fillOpacity=".15"
            stroke="#607e9a"
            strokeOpacity=".25"
          />
          {Array.from({ length: 12 }, (_, row) =>
            Array.from({ length: 18 }, (_, col) => (
              <circle
                key={`${row}-${col}`}
                cx={59 + col * 7 + row * 3.6}
                cy={98 - col * 3.1 + row * 2.6}
                r={row === 5 ? 1.8 : 1.2}
                fill={row < 4 ? "#5da5fb" : row < 8 ? "#69cc9b" : "#bd80de"}
                opacity={0.4 + ((row + col) % 3) * 0.2}
              />
            )),
          )}
          <path
            d="M77 114 203 58"
            stroke="#ffc878"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          <g stroke="#9bb7cf" fill="none" opacity=".7">
            <path d="M54 63V47h17M210 41h16v16M66 116v15h17M229 88v16h-17" />
          </g>
          <rect
            x="188"
            y="17"
            width="39"
            height="22"
            rx="5"
            fill="#263e53"
            stroke="#5d839d"
          />
          <text
            x="207"
            y="32"
            textAnchor="middle"
            fill="#b7dbed"
            fontSize="11"
            fontFamily="monospace"
          >
            AI
          </text>
          <path
            d="m228 25 4 4 8-9"
            stroke="#e9ab65"
            fill="none"
            strokeWidth="2"
          />
        </>
      )}
      {index === 2 && (
        <>
          <path
            d="M57 113 135 144 231 94 152 63Z"
            fill="#314759"
            fillOpacity=".15"
            stroke="#7f9db0"
            strokeOpacity=".25"
          />
          <g strokeWidth="2" strokeLinecap="round">
            <path d="M91 105V43" stroke="#679ee5" />
            <path d="m91 105 49 19" stroke="#de8968" />
            <path d="m91 105 42-24" stroke="#6ac69d" />
            <path d="M182 88V27" stroke="#679ee5" />
            <path d="m182 88 47 19" stroke="#de8968" />
            <path d="m182 88 35-22" stroke="#6ac69d" />
          </g>
          <path
            d="M102 56Q148 14 175 49"
            fill="none"
            stroke="#d7a368"
            strokeDasharray="4 4"
          />
          <path d="m168 43 9 8 1-13" fill="none" stroke="#d7a368" />
          <circle cx="91" cy="105" r="5" fill="#7195c1" />
          <circle cx="182" cy="88" r="5" fill="#dcaa6e" />
          <g fontSize="11" fontFamily="monospace" fill="#91a9be">
            <text x="79" y="36">
              C
            </text>
            <text x="170" y="20">
              R
            </text>
            <text x="118" y="79" fill="#c6a97e">
              T 4×4
            </text>
          </g>
          <g stroke="#dcb67a">
            <path d="m137 94 4 4 7-8" fill="none" />
          </g>
        </>
      )}
      {index === 3 && (
        <>
          <path
            d="M44 121 121 150 238 94 162 66Z"
            fill="#30485a"
            fillOpacity=".16"
            stroke="#7f9db0"
            strokeOpacity=".25"
          />
          <path
            d="M91 122Q99 68 165 79T235 54"
            stroke="#d8a166"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="4 4"
          />
          {[
            [91, 122],
            [118, 82],
            [165, 79],
            [207, 77],
            [235, 54],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill={i < 3 ? "#efb76e" : "#6d879f"}
            />
          ))}
          <path
            d="M69 116 82 76 127 49 153 67"
            fill="none"
            stroke="#22394d"
            strokeWidth="22"
            strokeLinejoin="round"
          />
          <path
            d="M69 116 82 76 127 49 153 67"
            fill="none"
            stroke={`url(#${id}-steel)`}
            strokeWidth="16"
            strokeLinejoin="round"
          />
          <g fill="#738a9f" stroke="#b5c7d6" strokeWidth="1.5">
            {[
              [69, 116],
              [82, 76],
              [127, 49],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="8" />
            ))}
          </g>
          <path
            d="m153 64 10 8-6 14"
            stroke="#d9ac77"
            strokeWidth="6"
            fill="none"
          />
          <path d="m157 85 4 6" stroke="#e2e9ef" strokeWidth="3" />
          <path d="M49 126h43l6 10H44Z" fill="#536b82" />
        </>
      )}
      {index === 4 && (
        <>
          <path
            d="M39 115 117 145 240 85 164 54Z"
            fill="#30485a"
            fillOpacity=".13"
            stroke="#7f9db0"
            strokeOpacity=".2"
          />
          <rect
            x="55"
            y="31"
            width="69"
            height="91"
            rx="7"
            fill="#263e53"
            stroke="#708ea5"
          />
          <path
            d="M68 50h24M68 61h42M68 72h30M68 83h41"
            stroke="#a4bbcc"
            strokeOpacity=".5"
            strokeWidth="2"
          />
          <text
            x="89"
            y="109"
            textAnchor="middle"
            fill="#edb876"
            fontSize="16"
            fontFamily="monospace"
          >
            .LS
          </text>
          <rect
            x="188"
            y="36"
            width="48"
            height="79"
            rx="7"
            fill={`url(#${id}-steel)`}
          />
          <rect x="196" y="44" width="32" height="29" rx="2" fill="#162a3c" />
          <g fill="#82a1b5">
            {[0, 1, 2].map((i) => (
              <rect
                key={i}
                x="198"
                y={82 + i * 7}
                width="27"
                height="2"
                rx="1"
              />
            ))}
          </g>
          <circle cx="212" cy="61" r="4" fill="#79c7a5" />
          <path
            d="M132 77h42m-9-9 9 9-9 9"
            stroke="#e8ad6e"
            strokeWidth="2"
            fill="none"
          />
          <circle
            cx="154"
            cy="77"
            r="21"
            stroke="#c99a6455"
            fill="none"
            strokeDasharray="3 5"
          />
        </>
      )}
    </svg>
  );
}
