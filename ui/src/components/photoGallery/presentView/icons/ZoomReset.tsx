import * as React from 'react'

function SvgZoomReset(props: React.SVGProps<SVGSVGElement>) {
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
        <path d="M7 18a11 11 0 1 1 3.2 7.8L5 31M5 23v8h8" />
      </g>
    </svg>
  )
}

export default SvgZoomReset
