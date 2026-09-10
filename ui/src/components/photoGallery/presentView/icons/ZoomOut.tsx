import * as React from 'react'

function SvgZoomOut(props: React.SVGProps<SVGSVGElement>) {
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
      <g fill="none" stroke="#000" strokeWidth={3}>
        <circle cx="15" cy="15" r="10" />
        <path d="M22.5 22.5L32 32M10 15h10" />
      </g>
    </svg>
  )
}

export default SvgZoomOut
