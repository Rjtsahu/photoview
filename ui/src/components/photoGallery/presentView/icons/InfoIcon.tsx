import * as React from 'react'

function SvgInfo(props: React.SVGProps<SVGSVGElement>) {
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
        <circle cx="18" cy="18" r="14" />
        <line x1="18" y1="16" x2="18" y2="25" strokeWidth={3} />
        <circle cx="18" cy="11" r="1.5" fill="currentColor" />
      </g>
    </svg>
  )
}

export default SvgInfo
