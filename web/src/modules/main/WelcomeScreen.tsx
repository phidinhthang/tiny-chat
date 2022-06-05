import React from 'react';
import { Typewriter } from 'react-simple-typewriter';

export const WelcomeScreen = () => {
  return (
    <div className='w-full h-full flex items-center justify-center font-bold text-5xl'>
      <div className='mb-2 w-full h-full flex items-center justify-center text-center'>
        <Typewriter words={['Welcome to Tinychat!']} typeSpeed={70} />
      </div>
    </div>
  );
};
