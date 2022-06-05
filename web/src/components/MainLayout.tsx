interface MainLayoutProps {
  children: React.ReactNode;
  leftPanel?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  leftPanel,
}) => {
  return (
    <div className='h-screen max-h-screen'>
      <div className='flex flex-auto h-full'>
        {leftPanel ? (
          <div className='max-w-[340px] flex-auto min-w-[70px] h-full overflow-y-auto overflow-x-hidden flex-shrink-1'>
            {leftPanel}
          </div>
        ) : null}
        <div className='h-full basis-[400px] flex-auto overflow-y-auto flex-shrink-0'>
          {children}
        </div>
      </div>
    </div>
  );
};
