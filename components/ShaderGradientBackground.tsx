const CONTOUR_LOOPS = [
  "M-190-17C-177-91-114-132-45-119C18-107 23-45 82-40C147-34 194 19 175 83C154 154 59 151 2 119C-54 88-76 31-133 44C-170 52-198 31-190-17Z",
  "M-158-12C-147-69-101-101-45-94C8-88 20-38 69-34C121-30 158 13 143 61C126 113 52 113 4 91C-44 68-62 23-108 34C-136 41-164 24-158-12Z",
  "M-125-8C-115-50-79-74-36-69C6-64 18-31 58-27C95-23 121 10 110 45C96 84 38 84 2 70C-35 55-49 19-84 26C-107 31-130 19-125-8Z",
  "M-92-6C-83-34-58-51-27-48C4-45 18-22 45-19C70-16 89 7 80 31C70 58 29 60 2 49C-25 38-37 14-61 18C-78 21-97 13-92-6Z",
  "M-61-4C-55-23-38-34-17-32C4-30 16-15 34-13C52-11 64 5 58 20C50 38 22 39 2 33C-17 26-25 9-42 12C-52 14-64 8-61-4Z",
];

const CHANNEL_LOOPS = [
  "M-218-18C-188-96-99-117-29-69C42-20 103-67 169-37C232-9 219 66 156 93C93 121 44 86-15 110C-84 139-193 93-218-18Z",
  "M-174-15C-149-72-83-87-27-51C31-14 83-47 135-25C180-5 171 48 124 69C76 90 38 63-12 82C-66 103-152 67-174-15Z",
  "M-130-12C-112-50-61-61-20-35C23-8 62-29 99-14C130-1 124 35 89 50C55 65 28 47-9 60C-47 74-115 47-130-12Z",
  "M-88-8C-76-32-42-39-14-22C14-5 42-17 65-8C85 0 80 22 58 31C36 40 19 30-7 38C-31 46-78 30-88-8Z",
];

const CONTOUR_ISLANDS = [
  { transform: "translate(88 76) rotate(-11) scale(0.74 0.36)" },
  { transform: "translate(328 88) rotate(8) scale(0.54 0.72)" },
  { transform: "translate(555 72) rotate(-24) scale(0.58 0.34)", variant: "channel" },
  { transform: "translate(782 112) rotate(16) scale(0.48 0.62)" },
  { transform: "translate(1015 82) rotate(-7) scale(0.76 0.34)", variant: "channel" },
  { transform: "translate(1312 122) rotate(13) scale(0.55 0.7)" },
  { transform: "translate(1538 78) rotate(-18) scale(0.42 0.42)" },
  { transform: "translate(98 286) rotate(19) scale(0.5 0.88)", variant: "channel" },
  { transform: "translate(285 326) rotate(-13) scale(0.64 0.34)" },
  { transform: "translate(510 288) rotate(6) scale(0.82 0.48)" },
  { transform: "translate(778 312) rotate(-4) scale(0.44 1.02)" },
  { transform: "translate(1085 325) rotate(20) scale(0.74 0.4)", variant: "channel" },
  { transform: "translate(1358 292) rotate(-16) scale(0.48 0.62)" },
  { transform: "translate(1554 338) rotate(10) scale(0.42 0.78)" },
  { transform: "translate(184 536) rotate(-26) scale(0.78 0.34)", variant: "channel" },
  { transform: "translate(430 556) rotate(14) scale(0.58 0.72)" },
  { transform: "translate(676 512) rotate(-9) scale(0.44 0.5)" },
  { transform: "translate(920 548) rotate(17) scale(0.86 0.46)" },
  { transform: "translate(1198 534) rotate(-18) scale(0.58 0.86)", variant: "channel" },
  { transform: "translate(1448 558) rotate(9) scale(0.52 0.42)" },
  { transform: "translate(66 764) rotate(7) scale(0.46 0.68)" },
  { transform: "translate(334 782) rotate(-13) scale(0.78 0.38)", variant: "channel" },
  { transform: "translate(603 760) rotate(22) scale(0.48 0.74)" },
  { transform: "translate(858 786) rotate(-10) scale(0.38 0.46)" },
  { transform: "translate(1095 764) rotate(11) scale(0.74 0.34)" },
  { transform: "translate(1398 782) rotate(-20) scale(0.62 0.78)" },
  { transform: "translate(1602 742) rotate(12) scale(0.4 0.58)" },
];

const GRID_COLUMNS = [92, 330, 568, 806, 1044, 1282, 1520];
const GRID_ROWS = [126, 324, 522, 720];

function ContourIsland({
  transform,
  variant,
}: {
  transform: string;
  variant?: string;
}) {
  const loops = variant === "channel" ? CHANNEL_LOOPS : CONTOUR_LOOPS;

  return (
    <g className={`topographic-map__island${variant === "channel" ? " topographic-map__island--channel" : ""}`} transform={transform}>
      {loops.map((path, index) => (
        <path d={path} key={index} />
      ))}
    </g>
  );
}

export function ShaderGradientBackground() {
  return (
    <div aria-hidden="true" className="static-grain-background absolute inset-0 z-0">
      <svg
        className="topographic-map"
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1600 900"
      >
        <g className="topographic-map__grid">
          {GRID_COLUMNS.map((x) => (
            <line key={`col-${x}`} x1={x} x2={x} y1="-60" y2="960" />
          ))}
          {GRID_ROWS.map((y) => (
            <line key={`row-${y}`} x1="-80" x2="1680" y1={y} y2={y} />
          ))}
        </g>

        <g className="topographic-map__terrain">
          <path d="M-80 205C62 169 151 190 246 244C355 306 434 258 514 183C602 101 716 102 814 156C905 206 1000 199 1110 136C1218 74 1338 86 1432 155C1514 216 1598 222 1680 190" />
          <path d="M-74 372C72 318 176 338 276 414C366 482 487 492 590 389C692 287 815 288 918 365C1014 437 1135 447 1236 352C1328 266 1446 276 1544 347C1610 395 1660 400 1712 382" />
          <path d="M-92 640C42 596 152 608 260 676C371 746 488 773 612 676C726 588 844 603 954 673C1070 747 1190 768 1302 684C1414 600 1540 622 1678 711" />
        </g>

        {CONTOUR_ISLANDS.map((island) => (
          <ContourIsland key={island.transform} {...island} />
        ))}

        <g className="topographic-map__crosses">
          {GRID_ROWS.flatMap((y) =>
            GRID_COLUMNS.map((x) => (
              <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
                <path d="M-12 0H12" />
                <path d="M0-12V12" />
              </g>
            )),
          )}
        </g>
      </svg>
    </div>
  );
}
