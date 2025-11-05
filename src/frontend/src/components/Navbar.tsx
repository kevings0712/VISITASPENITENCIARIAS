import { useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <header className="navbar">
      <div className="navbar-brand">VisiControl</div>
      <div className="navbar-actions">
        <button
          className="btn btn-outline"
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
