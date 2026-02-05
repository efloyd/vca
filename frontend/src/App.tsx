import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/shared/Header';
import { ChatPage } from './pages/ChatPage';
import { AdminPage } from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col">
        <Header />
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
