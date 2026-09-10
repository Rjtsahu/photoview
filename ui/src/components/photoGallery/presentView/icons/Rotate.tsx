import * as React from 'react'

function SvgRotate(props: React.SVGProps<SVGSVGElement>) {
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
      <g fill="none" stroke="currentColor" strokeWidth={3}>
        <path d="M29 18a11 11 0 1 1-3.2-7.8L31 5M31 13V5h-8" />
      </g>
    </svg>
  )
}

export default SvgRotate
