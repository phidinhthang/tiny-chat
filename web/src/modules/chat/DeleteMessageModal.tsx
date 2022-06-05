import React from 'react';
import { useTransition } from 'transition-hook';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { Message } from '../../lib/models';
import { useDeleteMessageModalStore } from './useDeleteMessageModalStore';

interface DeleteMessageModalProps {
  onConfirm: ({ message }: { message: Message }) => void;
  onCancel?: () => void;
}

export const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  const { message, setMessage } = useDeleteMessageModalStore();
  const modalTrans = useTransition(!!message, 500);
  const modalRef = React.useRef<HTMLDivElement>(null);
  useOnClickOutside(modalRef, () => {
    setMessage(null);
  });

  return modalTrans.shouldMount ? (
    <>
      <div
        tabIndex={-1}
        aria-hidden='true'
        className={`overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full h-full flex items-center justify-center transition-all duration-500 ${
          modalTrans.stage === 'enter' ? 'bg-black/80' : 'bg-black/0'
        }`}
      >
        <div
          className='relative p-4 w-full max-w-md h-full md:h-auto'
          ref={modalRef}
        >
          <div
            className={`relative bg-white rounded-lg shadow dark:bg-gray-700 transition-all duration-500 ${
              modalTrans.stage === 'enter'
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-50'
            }`}
          >
            <div className='flex justify-between items-start p-4 pb-3 rounded-t'>
              <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
                Delete Message
              </h3>
            </div>
            <div className='p-4 pt-0'>
              <p className='text-gray-500'>
                Are you sure you want to delete this message?
              </p>
            </div>
            <div className='flex items-center justify-end p-4 space-x-2 rounded-b rounded-b-lg bg-gray-100'>
              <button
                data-modal-toggle='defaultModal'
                type='button'
                className='text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600'
                onClick={() => {
                  setMessage(null);
                  onCancel?.();
                }}
              >
                Cancel
              </button>
              <button
                data-modal-toggle='defaultModal'
                type='button'
                className='text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800'
                onClick={() => {
                  onConfirm({ message: message! });
                  setMessage(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : (
    <div />
  );
};
