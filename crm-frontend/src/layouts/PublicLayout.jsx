import { Outlet } from 'react-router-dom'

/**
 * PublicLayout - Used for landing page and other public pages
 * Remains completely unchanged from original design
 * No sidebar, no theme system, no authenticated features
 */
const PublicLayout = () => {
  return <Outlet />
}

export default PublicLayout
