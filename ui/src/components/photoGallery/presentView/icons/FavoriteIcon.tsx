import * as React from 'react'

function SvgFavorite({
  filled,
  ...props
}: { filled?: boolean } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.15em"
      height="1.15em"
      fill={filled ? '#f43f5e' : 'none'}
      stroke={filled ? '#f43f5e' : 'currentColor'}
      strokeWidth={filled ? 0 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        filter: filled ? 'drop-shadow(0 0 6px rgba(244, 63, 94, 0.6))' : 'none',
        transition: 'all 160ms ease',
      }}
      {...props}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export default SvgFavorite
