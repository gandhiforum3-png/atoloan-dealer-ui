import './Header.css'

function Header({ user, onLogout }) {
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <header className="app-header">
      <div className="app-header-actions">
        <div className="app-header-user">
          <span className="app-header-avatar" aria-hidden="true">
            {initials}
          </span>
          <div>
            <p className="app-header-user-name">{user.name}</p>
            <p className="app-header-user-org">{user.dealership_name}</p>
          </div>
        </div>
        <button type="button" className="icon-button" aria-label="Log out" onClick={onLogout}>
          <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
        </button>
      </div>
    </header>
  )
}

export default Header
