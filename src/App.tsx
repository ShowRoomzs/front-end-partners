import { useRoutes } from 'react-router-dom'
import { routes } from '@/common/router'

export default function App() {
  const element = useRoutes(routes)
  return element
}
