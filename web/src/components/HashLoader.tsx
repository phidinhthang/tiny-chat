import * as React from 'react';

// https://github.com/davidhu2000/react-spinners/blob/main/src/HashLoader.tsx

interface HashLoaderProps {
  color?: string;
  loading?: boolean;
  css?: React.CSSProperties;
  speedMultiplier?: number;
  size?: number;
}

const createAnimation = (
  loaderName: string,
  frames: string,
  suffix: string
) => {
  const styleEl = document.createElement('style');
  document.head.appendChild(styleEl);
  const styleSheet = styleEl.sheet;

  const animationName = `react-spinners-${loaderName}-${suffix}`;

  const keyFrames = `
		@keyframes ${animationName} {
			${frames}
		}
	`;

  if (styleSheet) {
    styleSheet.insertRule(keyFrames, 0);
  }

  return animationName;
};
enum BasicColors {
  green = '#800080',
  teal = '#008080',
  blue = '#0000FF',
}

export const calculateRgba = (color: string, opacity: number): string => {
  if (Object.keys(BasicColors).includes(color)) {
    color = BasicColors[color as keyof typeof BasicColors];
  }

  if (color[0] === '#') {
    color = color.slice(1);
  }

  if (color.length === 3) {
    let res = '';
    color.split('').forEach((c: string) => {
      res += c;
      res += c;
    });
    color = res;
  }

  const rgbValues: string = (color.match(/.{2}/g) || [])
    .map((hex: string) => parseInt(hex, 16))
    .join(', ');

  return `rgba(${rgbValues}, ${opacity})`;
};

export const HashLoader: React.FC<HashLoaderProps> = ({
  loading = true,
  speedMultiplier,
  css = {},
  size = 200,
  ...props
}) => {
  const wrapper: React.CSSProperties = {
    display: 'inherit',
    position: 'relative',
    width: size,
    height: size,
    transform: 'rotate(165deg)',
    ...css,
  };

  const thickness = size / 6;
  const lat = (size - thickness) / 2;

  const offset = lat - thickness;

  const colorValue = 'rgba(15, 179, 142, 0.6)';
  const color = 'rgba(37, 133, 246, 0.75)';

  const before = createAnimation(
    'HashLoader',
    `0% {width: ${thickness}px; box-shadow: ${lat}px ${-offset}px ${colorValue}, ${-lat}px ${offset}px ${colorValue}}
    35% {width: ${size}px; box-shadow: 0 ${-offset}px ${colorValue}, 0 ${offset}px ${colorValue}}
    70% {width: ${thickness}px; box-shadow: ${-lat}px ${-offset}px ${colorValue}, ${lat}px ${offset}px ${colorValue}}
    100% {box-shadow: ${lat}px ${-offset}px ${colorValue}, ${-lat}px ${offset}px ${colorValue}}`,
    'before'
  );

  const after = createAnimation(
    'HashLoader',
    `0% {height: ${thickness}px; box-shadow: ${offset}px ${lat}px ${color}, ${-offset}px ${-lat}px ${color}}
    35% {height: ${size}px; box-shadow: ${offset}px 0 ${color}, ${-offset}px 0 ${color}}
    70% {height: ${thickness}px; box-shadow: ${offset}px ${-lat}px ${color}, ${-offset}px ${lat}px ${color}}
    100% {box-shadow: ${offset}px ${lat}px ${color}, ${-offset}px ${-lat}px ${color}}`,
    'after'
  );

  const style = (i: number): React.CSSProperties => {
    return {
      position: 'absolute',
      content: '',
      top: '50%',
      left: '50%',
      display: 'block',
      width: `${size / 6}px`,
      height: `${size / 6}px`,
      borderRadius: `${size / 10}px`,
      transform: 'translate(-50%, -50%)',
      animationFillMode: 'none',
      animation: `${i === 1 ? before : after} ${2 / 1}s infinite`,
    };
  };

  return (
    <span style={wrapper} {...props}>
      <span style={style(1)} />
      <span style={style(2)} />
    </span>
  );
};
