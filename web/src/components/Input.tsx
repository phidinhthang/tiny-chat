import React from 'react';

const sizeClassnames = {
  lg: 'p-4 sm:text-md',
  md: 'p-2.5 text-sm',
  sm: 'p-2 sm:text-xs',
};

interface InputProps
  extends Omit<React.ComponentPropsWithoutRef<'input'>, 'size'> {
  size?: keyof typeof sizeClassnames;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      className = '',
      disabled,
      onFocus,
      onBlur,
      rightIcon = <div />,
      style,
      ...props
    },
    ref
  ) => {
    const [isFocus, setFocus] = React.useState(false);
    const cn = `flex items-center block w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white ${
      sizeClassnames[size]
    } ${disabled ? 'cursor-not-allowed' : ''} ${
      isFocus
        ? 'ring-blue-500 border-blue-500 focus:ring-blue-500 focus:border-blue-500'
        : ''
    } ${className}`;
    return (
      <div className={cn}>
        <input
          ref={ref}
          disabled={disabled}
          onFocus={(e) => {
            onFocus?.(e);
            setFocus(true);
          }}
          onBlur={(e) => {
            onBlur?.(e);
            setFocus(false);
          }}
          style={{
            outline: 'none',
            border: 'none',
            backgroundColor: 'transparent',
            height: '100%',
            flexGrow: 1,
          }}
          {...props}
        />
        {rightIcon}
      </div>
    );
  }
);
