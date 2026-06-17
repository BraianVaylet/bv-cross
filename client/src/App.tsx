import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, PublicOnlyRoute } from './auth/AuthContext';
import { AppLayout } from './components/AppLayout';
import { EditExercise } from './pages/EditExercise';
import { ExerciseDetail } from './pages/ExerciseDetail';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { NewExercise } from './pages/NewExercise';
import { NotFound } from './pages/NotFound';
import { Recover } from './pages/Recover';
import { Register } from './pages/Register';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recover" element={<Recover />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/exercises/new" element={<NewExercise />} />
              <Route path="/exercises/:id" element={<ExerciseDetail />} />
              <Route path="/exercises/:id/edit" element={<EditExercise />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
