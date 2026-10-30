import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Home } from './pages/home/Home';
import { Explore } from './pages/explore/Explore';
import { Albums } from './pages/albums/Albums';
import { Artists } from './pages/artists/Artists';
import { Genres } from './pages/genres/Genres';
import { Playlists } from './pages/playlists/Playlists';
import { Favorites } from './pages/favorites/Favorites';
import { History } from './pages/history/History';
import { MostPlayed } from './pages/history/MostPlayed';
import { PlaylistDetails } from './pages/playlists/PlaylistDetails';
import { Queue } from './pages/queue/Queue';
import { Search } from './pages/search/Search';
import { AlbumDetails } from './pages/albums/AlbumDetails';
import { ArtistDetails } from './pages/artists/ArtistDetails';
import { GenreDetails } from './pages/genres/GenreDetails';
import { Settings } from './pages/settings/Settings';
import { YouTube } from './pages/youtube/YouTube';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PlaceholderPage } from './components/ui/PlaceholderPage';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoaderPreview } from './pages/preview/LoaderPreview';
import { Friends } from './pages/friends/Friends';

export const router = createBrowserRouter([
  { path: '/loader-preview', element: <LoaderPreview /> },
  {
    path: '/',
    element: <AppShell><Navigate to="/home" replace /></AppShell>,
  },
  {
    path: '/home',
    element: <AppShell><Home /></AppShell>,
  },
  {
    path: '/explore',
    element: <AppShell><Explore /></AppShell>,
  },
  { path: '/albums', element: <AppShell><Albums /></AppShell> },
  { path: '/album/:id', element: <AppShell><AlbumDetails /></AppShell> },
  { path: '/artists', element: <AppShell><Artists /></AppShell> },
  { path: '/artist/:id', element: <AppShell><ArtistDetails /></AppShell> },
  { path: '/genres', element: <AppShell><Genres /></AppShell> },
  { path: '/genre/:id', element: <AppShell><GenreDetails /></AppShell> },
  { path: '/playlists', element: <AppShell><Playlists /></AppShell> },
  { path: '/playlist/:id', element: <AppShell><PlaylistDetails /></AppShell> },
  { path: '/friends', element: <AppShell><Friends /></AppShell> },
  { path: '/friends/invite/:token', element: <AppShell><Friends /></AppShell> },
  { path: '/favorites', element: <AppShell><Favorites /></AppShell> },
  { path: '/history', element: <AppShell><History /></AppShell> },
  { path: '/most-played', element: <AppShell><MostPlayed /></AppShell> },
  { path: '/queue', element: <AppShell><Queue /></AppShell> },
  { path: '/youtube', element: <AppShell><YouTube /></AppShell> },
  { path: '/settings', element: <AppShell><Settings /></AppShell> },
  { path: '/search', element: <AppShell><Search /></AppShell> },
  
  // Real Cinematic Auth Routes
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  
  // Admin routes architecture
  { 
    path: '/admin', 
    element: <AdminLayout><AdminDashboard /></AdminLayout> 
  },
  { 
    path: '/admin/songs', 
    element: <AdminLayout><PlaceholderPage title="Manage Songs" /></AdminLayout> 
  },
  { 
    path: '/admin/albums', 
    element: <AdminLayout><PlaceholderPage title="Manage Albums" /></AdminLayout> 
  },
  { 
    path: '/admin/artists', 
    element: <AdminLayout><PlaceholderPage title="Manage Artists" /></AdminLayout> 
  },
  { 
    path: '/admin/users', 
    element: <AdminLayout><PlaceholderPage title="Manage Users" /></AdminLayout> 
  },
]);
