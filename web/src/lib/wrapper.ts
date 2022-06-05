import { Fetcher } from './fetcher';
import {
  BaseUser,
  RegisterInput,
  LoginInput,
  AuthResponse,
  RefreshTokenInput,
  RefreshTokenResponse,
  Conversation,
  Member,
  Pagination,
  Message,
  CreateMessageInput,
  GifObject,
} from './models';

export const wrap = (fetcher: Fetcher) => ({
  query: {
    me: (): Promise<BaseUser> => fetcher.query('/me'),
    users: (): Promise<BaseUser[]> => fetcher.query('/user/list'),
    conversationByRecipient: (recipientId: string): Promise<Conversation> =>
      fetcher.query(`/conversation/recipient/${recipientId}`),
    conversations: (): Promise<Conversation[]> =>
      fetcher.query('/conversation/list'),
    conversation: (conversationId: string): Promise<Conversation> =>
      fetcher.query(`/conversation/${conversationId}`),
    conversationMembers: (conversationId: string): Promise<Member[]> =>
      fetcher.query(`/conversation/${conversationId}/members`),
    conversationUsers: (conversationId: string): Promise<BaseUser[]> =>
      fetcher.query(`/conversation/${conversationId}/users`),
    messages: (
      conversationId: string,
      options: { before?: string; after?: string; limit?: string }
    ): Promise<Pagination<Message>> =>
      fetcher.query(
        `/message/conversation/${conversationId}/list?${new URLSearchParams(
          options
        )}`
      ),
    searchGif: (query: string): Promise<GifObject[]> =>
      fetcher.query(`/giphy/search?q=${query}`),
  },
  mutation: {
    login: (input: LoginInput): Promise<AuthResponse> =>
      fetcher.mutate('/login', { body: JSON.stringify(input) }),
    register: (input: RegisterInput): Promise<AuthResponse> =>
      fetcher.mutate('/register', { body: JSON.stringify(input) }),
    refreshToken: (input: RefreshTokenInput): Promise<RefreshTokenResponse> =>
      fetcher.mutate('/refresh-token', { body: JSON.stringify(input) }),
    createMessage: (input: CreateMessageInput): Promise<Message> =>
      fetcher.mutate('/message/create', { body: JSON.stringify(input) }),
    deleteMessage: (data: {
      messageId: string;
      conversationId: string;
    }): Promise<boolean> =>
      fetcher.mutate(
        `/message/${data.messageId}/conversation/${data.conversationId}`,
        {
          method: 'DELETE',
        }
      ),
    createReaction: (data: {
      messageId: string;
      conversationId: string;
      emojiName: string;
    }): Promise<boolean> =>
      fetcher.mutate(
        `/message/${data.messageId}/conversation/${data.conversationId}/reaction/${data.emojiName}`,
        { method: 'PUT' }
      ),
    deleteReaction: (data: {
      messageId: string;
      conversationId: string;
      emojiName: string;
    }): Promise<boolean> =>
      fetcher.mutate(
        `/message/${data.messageId}/conversation/${data.conversationId}/reaction/${data.emojiName}`,
        { method: 'DELETE' }
      ),
  },
});
