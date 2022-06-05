import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useTransition } from 'transition-hook';
import { ConversationItem } from './ConversationItem';
import { MainLayout } from '../../components/MainLayout';
import { UserItem } from './UserItem';
import { useTypeSafeQuery } from '../../hooks/useTypeSafeQuery';
import { Avatar } from '../../components/Avatar';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import React, { useContext } from 'react';
import { OutlineLogoutIcon } from '../../icons/OutlineLogoutIcon';
import { useTokenStore } from '../../lib/useTokenStore';
import { useDropzone } from 'react-dropzone';
import { useCreateMessage } from '../chat/useCreateMessage';
import { useQueryClient } from 'react-query';
import { WebSocketContext } from '../ws/WebSocketProvider';

let VITE_API_URL = import.meta.env.VITE_API_URL;

export const IndexPage = () => {
  const { data: me } = useTypeSafeQuery('me');
  const { data: users } = useTypeSafeQuery('users');
  const { data: conversations } = useTypeSafeQuery('conversations');
  const conversationId = useParams().conversationId;
  const createMessage = useCreateMessage();
  const navigate = useNavigate();
  const [isOpen, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuTrans = useTransition(isOpen, 300);
  const [timestamp, setTimestamp] = React.useState<number>();
  const [apiKey, setApiKey] = React.useState<string>();
  const [signature, setSignature] = React.useState<string>();
  const queryClient = useQueryClient();
  const { socket, setSocket } = useContext(WebSocketContext);

  React.useEffect(() => {
    fetch(`${VITE_API_URL}/image/signed-signature`)
      .then((res) => res.json())
      .then((data) => {
        setTimestamp(data.timestamp);
        setApiKey(data.apiKey);
        setSignature(data.signature);
      });
  }, []);

  useOnClickOutside(menuRef, () => {
    setOpen(false);
  });
  let filteredUsers = users
    ?.filter((u) => {
      return !conversations?.some((c) => {
        return c.withs?.some((w) => w.userId === u?.id);
      });
    })
    .filter((u) => u.id !== me?.id);

  const {
    getRootProps,
    getInputProps,
    isDragAccept,
    isDragActive,
    isDragReject,
  } = useDropzone({
    noClick: true,
    onDrop: (files) => {
      if (!conversationId) return;
      const file = files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey!);
      formData.append('folder', 'tinychat');
      formData.append('timestamp', timestamp!.toString());
      formData.append('signature', signature!);

      fetch('https://api.cloudinary.com/v1_1/dx1jwn9cz/image/upload', {
        method: 'POST',
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('updated ', data);
          createMessage([
            {
              conversation_id: conversationId,
              content: data.secure_url,
              is_image: true,
            },
          ]);
        });
    },
    accept: {
      'image/*': [],
    },
  });

  return (
    <div {...getRootProps()} id='shaking-container'>
      <input {...getInputProps()} />
      {isDragActive && conversationId ? (
        <div className='fixed top-0 left-0 right-0 bottom-0 bg-black/80 z-[100] flex items-center justify-center'>
          <div
            className={`w-[288px] h-[144px] rounded-lg p-4 bg-blue-600 relative ${
              isDragAccept ? 'bg-blue-600' : ''
            } ${isDragReject ? 'bg-red-600' : ''}`}
          >
            <div className='border-2 border-dashed w-full h-full border-white rounded-md flex items-end justify-center'>
              <div className='absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2'>
                <img src='/files.png' />
              </div>
              {isDragAccept ? (
                <p className='mb-3 text-white font-semibold'>
                  Drop file to upload
                </p>
              ) : null}
              {isDragReject ? (
                <p className='mb-3 text-white font-semibold'>
                  Only accept image file
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      <MainLayout
        leftPanel={
          <div className='bg-white h-full border-r min-w-[64px] bg-[#F5F7FB] '>
            <div className='border-b border-gray-300 flex h-16 px-3 items-center'>
              <div className='relative' ref={menuRef}>
                <div
                  className='cursor-pointer'
                  onClick={() => setOpen((open) => !open)}
                >
                  <Avatar
                    size='sm'
                    src={me?.avatarUrl as any}
                    username={me?.username}
                    isOnline={me?.isOnline}
                  />
                </div>
                {menuTrans.shouldMount ? (
                  <div
                    className={`absolute top-full left-0 w-14 sm:w-64 bg-white rounded-lg z-10 duration-300 transition-all ${
                      menuTrans.stage === 'enter'
                        ? 'opacity-1 scale-100'
                        : 'opacity-0 scale-95'
                    }`}
                  >
                    <ul className='p-2'>
                      <li
                        className='py-2 px-3 bg-gray-50 hover:bg-gray-100 cursor-pointer rounded-md flex gap-3 items-center'
                        onClick={() => {
                          queryClient.removeQueries();
                          useTokenStore.getState().setTokens({
                            accessToken: '',
                            refreshToken: '',
                          });
                          navigate('/login');
                          socket?.close();
                          setSocket(null);
                        }}
                      >
                        <OutlineLogoutIcon />
                        <span className='hidden sm:inline-block'>logout</span>
                      </li>
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
            <div className='p-2'>
              {conversations?.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                />
              ))}
              {filteredUsers?.map((user) => (
                <UserItem user={user} key={user.id} />
              ))}
            </div>
          </div>
        }
      >
        <Outlet />
      </MainLayout>
    </div>
  );
};
