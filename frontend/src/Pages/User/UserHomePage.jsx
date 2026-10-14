import ShopPage from './ShopPage'

// Preserve the existing authenticated route while making it the customer catalogue.
function UserHomePage({ theme, onToggleTheme }) {
  return <ShopPage theme={theme} onToggleTheme={onToggleTheme} />
}

export default UserHomePage
