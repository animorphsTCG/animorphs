
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Layouts
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import VisitorDemoBattle from './pages/VisitorDemoBattle';
import Admin from './pages/Admin';
import AuthCallback from './pages/AuthCallback';

// Auth protection
import { ProtectedRoute } from './modules/auth';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'register',
        element: <Register />
      },
      {
        path: 'profile',
        element: <ProtectedRoute><Profile /></ProtectedRoute>
      },
      {
        path: 'dashboard',
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>
      },
      {
        path: 'visitor-demo-battle',
        element: <VisitorDemoBattle />
      },
      {
        path: 'admin',
        element: <ProtectedRoute adminOnly={true}><Admin /></ProtectedRoute>
      },
      {
        path: 'auth/callback',
        element: <AuthCallback />
      }
    ]
  }
]);

export default function Routes() {
  return <RouterProvider router={router} />;
}
