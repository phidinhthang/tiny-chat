import React from 'react';

export const avatarSizeMap = {
  default: '80px',
  lg: '60px',
  md: '50px',
  sm: '40px',
  xs: '20px',
  xxs: '30px',
};

export const onlineIndicatorStyleMap = {
  default: {
    width: '15px',
    height: '15px',
    right: '2px',
    bottom: '-4px',
    borderWidth: '4px',
  },
  lg: {
    width: '12px',
    height: '12px',
    right: '2px',
    bottom: '-2px',
    borderWidth: '2px',
  },
  md: {
    width: '10px',
    height: '10px',
    right: '2px',
    bottom: '-2px',
    borderWidth: '2px',
  },
  sm: {
    width: '8px',
    height: '8px',
    right: '2px',
    bottom: '-2px',
    borderWidth: '2px',
  },
  xs: {
    width: '4px',
    height: '4px',
    right: '0px',
    bottom: '-1px',
    borderWidth: '1px',
  },
  xxs: {
    width: '6px',
    height: '6px',
    right: '1px',
    bottom: '-1px',
    borderWidth: '1px',
  },
};

export interface AvatarProps {
  src?: string;
  size?: keyof typeof onlineIndicatorStyleMap;
  className?: string;
  isOnline?: boolean;
  username?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  size = 'default',
  className = '',
  isOnline = false,
  username,
}) => {
  const sizeStyle = onlineIndicatorStyleMap[size];
  return (
    <div
      className={`relative inline-block bg-white rounded-full ${className}`}
      style={{ width: avatarSizeMap[size], height: avatarSizeMap[size] }}
    >
      <img
        src={
          src
            ? src
            : `https://avatars.dicebear.com/api/initials/${username}.svg`
        }
        className='rounded-full w-full h-full object-cover'
      />
      {isOnline && (
        <span
          className={
            'rounded-full absolute box-content bg-green-600 border-primary-800'
          }
          style={sizeStyle}
          data-testid='online-indictor'
        ></span>
      )}
    </div>
  );
};
