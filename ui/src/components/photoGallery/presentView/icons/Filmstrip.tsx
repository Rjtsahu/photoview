import * as React from 'react'

function SvgFilmstrip(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 36 36"
      fillRule="evenodd"
      clipRule="evenodd"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={1.5}
      width="1em"
      height="1em"
      {...props}
    >
      <g fill="none" stroke="currentColor" strokeWidth={2.5}>
        <rect x="2" y="6" width="32" height="24" rx="3" />
        <line x1="2" y1="13" x2="34" y2="13" />
        <line x1="2" y1="23" x2="34" y2="23" />
        <line x1="9" y1="6" x2="9" y2="13" />
        <line x1="18" y1="6" x2="18" y2="13" />
        <line x1="27" y1="6" x2="27" y2="13" />
        <line x1="9" y1="23" x2="9" y2="30" />
        <line x1="18" y1="23" x2="18" y2="30" />
        <line x1="27" y1="23" x2="27" y2="30" />
      </g>
    </svg>
  )
}

export default SvgFilmstrip
