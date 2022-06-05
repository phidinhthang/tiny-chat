import React from 'react';

export const OutlineLogoutIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={16}
      height={16}
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      strokeWidth={2}
      {...props}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
      />
    </svg>
  );
};
