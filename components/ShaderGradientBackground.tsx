const CONTOUR_LOOPS = [
  "M-152 4C-146-78-82-132 9-139C103-146 174-91 181-10C189 79 123 142 23 149C-78 156-159 96-152 4Z",
  "M-124 2C-119-59-72-100 2-106C76-112 133-71 140-8C148 61 96 108 18 114C-61 120-130 73-124 2Z",
  "M-96 1C-91-44-58-76-3-81C52-86 98-55 104-7C111 45 72 82 12 87C-47 92-101 55-96 1Z",
  "M-69-2C-64-33-40-54 0-57C40-60 73-38 78-5C84 31 54 58 10 62C-33 66-74 38-69-2Z",
  "M-43-4C-39-23-24-36 3-38C30-39 52-25 55-5C59 18 38 35 10 38C-17 40-47 22-43-4Z",
  "M-21-4C-18-14-10-21 5-22C20-22 32-14 34-4C36 9 23 18 8 19C-7 20-24 10-21-4Z",
];

const SMALL_CONTOUR_LOOPS = [
  "M-88 0C-83-46-44-74 9-76C63-78 99-44 98 3C97 50 56 79 4 78C-49 77-93 48-88 0Z",
  "M-66 1C-62-32-34-52 5-54C44-55 71-31 71 2C70 35 41 56 3 56C-36 55-70 35-66 1Z",
  "M-43 0C-40-20-23-33 4-34C31-35 49-20 49 1C49 23 29 37 3 37C-23 36-46 22-43 0Z",
  "M-22-1C-20-11-10-19 5-19C20-19 30-10 30 1C30 14 17 21 3 21C-12 20-24 12-22-1Z",
];

const CONTOUR_ISLANDS = [
  { transform: "translate(116 74) rotate(-17) scale(0.72 0.52)", size: "small" },
  { transform: "translate(318 92) rotate(11) scale(0.58 0.9)" },
  { transform: "translate(535 65) rotate(-28) scale(0.52 0.42)", size: "small" },
  { transform: "translate(735 112) rotate(19) scale(0.48 0.74)", size: "small" },
  { transform: "translate(1010 92) rotate(-9) scale(0.72 0.48)" },
  { transform: "translate(1305 112) rotate(14) scale(0.56 0.84)" },
  { transform: "translate(1516 84) rotate(-20) scale(0.42 0.54)", size: "small" },
  { transform: "translate(95 286) rotate(23) scale(0.54 0.86)" },
  { transform: "translate(278 318) rotate(-11) scale(0.62 0.44)", size: "small" },
  { transform: "translate(515 285) rotate(8) scale(0.84 0.62)" },
  { transform: "translate(782 310) rotate(-5) scale(0.56 1.08)" },
  { transform: "translate(1082 322) rotate(21) scale(0.76 0.56)" },
  { transform: "translate(1358 292) rotate(-15) scale(0.52 0.66)", size: "small" },
  { transform: "translate(1554 334) rotate(12) scale(0.44 0.82)" },
  { transform: "translate(190 528) rotate(-27) scale(0.72 0.5)" },
  { transform: "translate(432 558) rotate(15) scale(0.64 0.78)" },
  { transform: "translate(674 514) rotate(-8) scale(0.48 0.56)", size: "small" },
  { transform: "translate(918 548) rotate(18) scale(0.84 0.64)" },
  { transform: "translate(1198 535) rotate(-19) scale(0.62 0.9)" },
  { transform: "translate(1448 552) rotate(8) scale(0.52 0.58)", size: "small" },
  { transform: "translate(70 760) rotate(8) scale(0.48 0.72)", size: "small" },
  { transform: "translate(335 780) rotate(-14) scale(0.76 0.54)" },
  { transform: "translate(602 760) rotate(22) scale(0.52 0.78)" },
  { transform: "translate(860 786) rotate(-10) scale(0.42 0.52)", size: "small" },
  { transform: "translate(1095 765) rotate(12) scale(0.7 0.5)" },
  { transform: "translate(1398 782) rotate(-21) scale(0.66 0.84)" },
  { transform: "translate(1605 742) rotate(13) scale(0.44 0.62)", size: "small" },
];

const SURVEY_MARKS = [
  "translate(92 164)",
  "translate(356 170)",
  "translate(672 150)",
  "translate(930 162)",
  "translate(1268 176)",
  "translate(1510 158)",
  "translate(172 414)",
  "translate(420 430)",
  "translate(760 410)",
  "translate(1040 424)",
  "translate(1330 430)",
  "translate(1546 408)",
  "translate(244 694)",
  "translate(540 704)",
  "translate(834 690)",
  "translate(1168 708)",
  "translate(1476 690)",
];

function ContourIsland({
  transform,
  size,
}: {
  transform: string;
  size?: string;
}) {
  const loops = size === "small" ? SMALL_CONTOUR_LOOPS : CONTOUR_LOOPS;

  return (
    <g className={`topographic-map__island${size === "small" ? " topographic-map__island--small" : ""}`} transform={transform}>
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
        <g className="topographic-map__terrain">
          <path d="M-80 210C54 168 140 172 230 226C330 287 430 274 514 189C597 106 710 95 814 157C907 213 1010 207 1108 138C1214 64 1338 72 1436 156C1518 226 1598 234 1680 192" />
          <path d="M-74 372C74 312 180 326 274 411C365 493 491 482 590 386C688 291 818 282 916 363C1013 444 1135 436 1234 350C1329 268 1448 267 1546 346C1608 396 1658 405 1712 386" />
          <path d="M-92 640C40 585 154 596 258 676C368 761 494 762 611 676C726 591 844 590 954 672C1067 755 1196 760 1302 682C1414 600 1541 609 1678 712" />
        </g>

        {CONTOUR_ISLANDS.map((island) => (
          <ContourIsland key={island.transform} {...island} />
        ))}

        <g className="topographic-map__survey">
          {SURVEY_MARKS.map((transform) => (
            <g key={transform} transform={transform}>
              <path d="M-14 0H14" />
              <path d="M0-14V14" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
