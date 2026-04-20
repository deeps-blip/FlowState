import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home      from './pages/Home';
import Dashboard    from './pages/Dashboard';
import Sandbox      from './pages/Sandbox';
import Templates    from './pages/Templates';
import Repository   from './pages/Repository';
import Integrations from './pages/Integrations';
import NotFound     from './pages/NotFound';

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/"             element={<Home />}         />
      <Route path="/dashboard"    element={<Dashboard />}    />
      <Route path="/sandbox"      element={<Sandbox />}      />
      <Route path="/templates"    element={<Templates />}    />
      <Route path="/repository"   element={<Repository />}   />
      <Route path="/integrations" element={<Integrations />} />
      <Route path="*"             element={<NotFound />}     />
    </Routes>
  </BrowserRouter>
);

export default App;
