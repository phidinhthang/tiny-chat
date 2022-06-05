import React from 'react';
import { Spinner } from './Spinner';

const variantClassnames = {
  primary:
    'text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800',
  secondary:
    'text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700',
};

const sizeClassnames = {
  xs: 'py-2 px-3 text-xs',
  sm: 'py-2 px-3 text-sm',
  md: 'text-sm px-5 py-2.5',
  lg: 'py-3 px-5 text-base',
};

interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: keyof typeof variantClassnames;
  size?: keyof typeof sizeClassnames;
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  disabled,
  loading,
  ...props
}) => {
  const cn = `font-medium rounded-lg inline-flex items-center justify-center ${
    variantClassnames[variant]
  } ${sizeClassnames[size]} ${
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  } ${fullWidth ? 'w-full' : ''} ${className}`;
  return (
    <button className={cn} disabled={disabled} {...props}>
      {loading ? <Spinner className='inline mr-3' /> : null}
      {children}
    </button>
  );
};
