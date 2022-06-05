import { Route, Routes } from 'react-router-dom';
import { ChatBox } from './modules/chat/ChatBox';
import { LoginPage } from './modules/landing/LoginPage';
import { RegisterPage } from './modules/landing/RegisterPage';
import { IndexPage } from './modules/main/IndexPage';
import { WelcomeScreen } from './modules/main/WelcomeScreen';

export const Routers = () => {
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/' element={<IndexPage />}>
        <Route path='/' element={<WelcomeScreen />} />
        <Route path='/c/:conversationId' element={<ChatBox />} />
      </Route>
    </Routes>
  );
};
