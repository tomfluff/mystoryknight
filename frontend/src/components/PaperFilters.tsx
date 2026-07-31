/*
 * Torn-edge filters for the paper-craft world: turbulence-displaced rectangles
 * read as hand-torn paper. Referenced from paper.module.css (and the modules
 * composing it) via url(#msk-tear*). SVG filter references are document-global,
 * so this is mounted exactly once, in App — every mat (entry view, story view,
 * navbar cards) shares these five seeds; vary --tf1/--tf2 between neighbouring
 * sheets so no two tears repeat.
 */
const PaperFilters = () => (
  <svg
    width="0"
    height="0"
    style={{ position: "absolute" }}
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <filter id="msk-tearA" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.028 0.052"
          numOctaves="4"
          seed="3"
          result="n"
        />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="11" />
      </filter>
      <filter id="msk-tearB" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.031 0.047"
          numOctaves="4"
          seed="11"
          result="n"
        />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="13" />
      </filter>
      <filter id="msk-tearC" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.042 0.06"
          numOctaves="3"
          seed="19"
          result="n"
        />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="9" />
      </filter>
      <filter id="msk-tearD" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.05 0.07"
          numOctaves="3"
          seed="27"
          result="n"
        />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="7" />
      </filter>
      <filter id="msk-tearE" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.036 0.055"
          numOctaves="4"
          seed="35"
          result="n"
        />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="10" />
      </filter>
    </defs>
  </svg>
);

export default PaperFilters;
