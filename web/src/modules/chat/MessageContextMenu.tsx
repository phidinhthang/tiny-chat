import React from 'react';
import { createContext, useContext } from 'react';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { Message } from '../../lib/models';

type ContextMenuState =
  | {
      top: number;
      left: number;
      rightHandSide?: boolean;
      message: Message;
    }
  | undefined;

export const ContextMenuContext = createContext<{
  contextMenu: ContextMenuState;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState>>;
}>({
  contextMenu: undefined,
  setContextMenu: () => {},
});

export const ContextMenuContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [contextMenu, setContextMenu] =
    React.useState<ContextMenuState>(undefined);
  return (
    <ContextMenuContext.Provider value={{ contextMenu, setContextMenu }}>
      {children}
    </ContextMenuContext.Provider>
  );
};

export const useContextMenuContext = () => useContext(ContextMenuContext);

export const MessageContextMenu = () => {
  const { contextMenu, setContextMenu } = useContextMenuContext();
  const menuContextRef = React.useRef<HTMLDivElement>(null);
  useOnClickOutside(menuContextRef, () => {
    setContextMenu(undefined);
  });

  if (typeof contextMenu === 'undefined') {
    return <></>;
  }
  return (
    <div
      ref={menuContextRef}
      style={{
        position: 'fixed',
        top: contextMenu.top,
        left: contextMenu.left,
      }}
    >
      😃
    </div>
  );
};
