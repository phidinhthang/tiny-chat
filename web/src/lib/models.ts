export type BaseUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
  lastOnlineAt?: string;
};

export type Conversation = {
  id: string;
  name: string | null;
  adminId: string | null;
  lastMessageId: string | null;
  lastMessageDisplay: {
    userId: string | null;
    userName: string | null;
    content: string | null;
    createdAt: string | null;
  };
  withs: Array<{
    userId: string;
    username: string;
    isOnline: boolean;
    lastOnlineAt: string;
    avatarUrl: string;
  }> | null;
  createdAt: string;
  isGroup: boolean;
};

export type Member = {
  conversationId: string;
  userId: string;
  lastReadAt: string | null;
  joinedAt: string;
  nick: string | null;
  avatar: string | null;
  isKicked: boolean;
  isBanned: boolean;
};

export type Pagination<T> = {
  items: T[];
  nextCursor: string | null;
  prevCursor: string | null;
};

export type Message = {
  id: string;
  authorId: string;
  conversationId: string;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string | null;
  reactions: Record<string, { createdAt: string; name: string }>;
  loading?: boolean;
  isImage: boolean;
};

export type LoginInput = {
  username: string;
  password: string;
};

export type RegisterInput = {
  username: string;
  password: string;
};

export type RefreshTokenInput = {
  refreshToken: string;
};

export type GifObject = {
  width: number;
  height: number;
  url: string;
};

export type CreateMessageInput = {
  conversation_id: string;
  content: string;
  is_image: boolean;
};

export type RefreshTokenResponse = {
  accessToken: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: BaseUser;
};
