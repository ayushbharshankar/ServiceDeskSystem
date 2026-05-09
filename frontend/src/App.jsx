import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'
import MainLayout from './components/MainLayout'
import Dashboard from './pages/Dashboard'
import Issues from './pages/Issues'
import IssuesRedirect from './pages/IssuesRedirect'
import IssueDetail from './pages/IssueDetail'
import Projects from './pages/Projects'
import Kanban from './pages/Kanban'
import KanbanRedirect from './pages/KanbanRedirect'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="issues" element={<IssuesRedirect />} />
          <Route path="issues/:projectId" element={<Issues />} />
          <Route path="issue/:issueId" element={<IssueDetail />} />
          <Route path="kanban" element={<KanbanRedirect />} />
          <Route path="kanban/:projectId" element={<Kanban />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
