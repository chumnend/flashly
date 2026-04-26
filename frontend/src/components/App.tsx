import { Outlet, ScrollRestoration } from 'react-router-dom';

import AuthProvider from '../providers/AuthProvider';

const App = () => {
  return (
    <AuthProvider>
      <ScrollRestoration />
      <main>
        <Outlet />
      </main>
    </AuthProvider>
  );
};
 
export default App;