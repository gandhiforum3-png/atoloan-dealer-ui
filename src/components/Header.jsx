import './Header.css'

function Header({ user }) {
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <header className="app-header">
      <div className="app-header-search">
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <input type="text" placeholder="Search applications..." aria-label="Search applications" />
      </div>

      <div className="app-header-actions">
        <button type="button" className="icon-button" aria-label="Notifications">
          <i className="fa-solid fa-bell" aria-hidden="true"></i>
        </button>
        <div className="app-header-user">
          <span className="app-header-avatar" aria-hidden="true">
            {initials}
          </span>
          <div>
            <p className="app-header-user-name">{user.name}</p>
            <p className="app-header-user-org">{user.org}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
