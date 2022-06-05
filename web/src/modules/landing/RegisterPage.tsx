import { useTokenStore } from '../../lib/useTokenStore';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTypeSafeMutation } from '../../hooks/useTypeSafeMutation';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { toErrorMap } from '../../lib/toErrorMap';
import { useTypeSafeUpdateQuery } from '../../hooks/useTypeSafeUpdateQuery';
import { useQueryClient } from 'react-query';

export const RegisterPage = () => {
  const setTokens = useTokenStore((s) => s.setTokens);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const {
    mutate: register,
    error,
    isLoading,
  } = useTypeSafeMutation('register');
  const updateQuery = useTypeSafeUpdateQuery();
  const errors = toErrorMap(error as any);
  const queryClient = useQueryClient();

  return (
    <div className='w-screen h-screen flex items-center justify-center flex-col'>
      <form
        className='w-full px-4 max-w-[480px] mx-auto'
        onSubmit={(e) => {
          e.preventDefault();
          register([{ username, password }], {
            onSuccess: (data) => {
              queryClient.removeQueries();
              setTokens({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
              });
              updateQuery('me', (x) => {
                return data.user;
              });
              navigate('/');
            },
          });
        }}
      >
        <div className={`${errors.username ? 'mb-1' : 'mb-6'}`}>
          <div>
            <label
              htmlFor='username'
              className='block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300'
            >
              Your username
            </label>
            <Input
              type='text'
              name='username'
              placeholder={'Your username...'}
              value={username}
              disabled={isLoading}
              onChange={(e) => setUsername(e.target.value)}
            />
            {errors.username?.map((e, idx) => (
              <p
                className='mt-1 text-sm text-red-600 dark:text-red-500'
                key={idx}
              >
                {e}
              </p>
            ))}
          </div>
        </div>
        <div className={`${errors.password ? 'mb-0' : 'mb-3'}`}>
          <label
            htmlFor='password'
            className='block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300'
          >
            Your password
          </label>
          <Input
            type='password'
            name='password'
            placeholder={'Your password...'}
            value={password}
            disabled={isLoading}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password?.map((e, idx) => (
            <p
              className='mt-1 text-sm text-red-600 dark:text-red-500'
              key={idx}
            >
              {e}
            </p>
          ))}
        </div>
        <div className='mb-3'>
          have an account ?
          <Link to='/login' className='underline'>
            login
          </Link>
        </div>
        <Button
          type='submit'
          fullWidth
          loading={isLoading}
          disabled={isLoading}
        >
          Register
        </Button>
      </form>
    </div>
  );
};
