import { LogIn, LogOut } from "lucide-react";
import type { AuthUser } from "./Login";

interface StickyHeaderProps {
  scrolled: boolean;
  selectedName: string | null;
  onScrollToTree: () => void;
  onScrollToAbout: () => void;
  onScrollToContact: () => void;
  user: AuthUser | null;
  onLogout: () => void;
  onAdminLogin: () => void;
}

export const StickyHeader = ({
  scrolled,
  selectedName,
  onScrollToTree,
  onScrollToAbout,
  onScrollToContact,
  user,
  onLogout,
  onAdminLogin,
}: StickyHeaderProps) => {
  return (
    <header className={`sticky-header sticky-header--visible ${scrolled ? "sticky-header--scrolled" : ""}`}>
      <div className="sticky-header-left">
        <span className="sticky-om" aria-hidden="true">&#x0950;</span>
        <span className="sticky-brand">Keshwani's</span>
      </div>

      <nav className="sticky-header-center" aria-label="Page navigation">
        <button type="button" className="sticky-nav-btn" onClick={onScrollToTree}>
          Family Tree
        </button>
        <button type="button" className="sticky-nav-btn" onClick={onScrollToAbout}>
          About
        </button>
        <button type="button" className="sticky-nav-btn" onClick={onScrollToContact}>
          Contact
        </button>
      </nav>

      <div className="sticky-header-right">
        {scrolled && selectedName && user && (
          <>
            <span className="sticky-member">{selectedName}</span>
            <span className="sticky-sep" aria-hidden="true">&#x203A;</span>
          </>
        )}
        {user ? (
          <>
            <span className={`sticky-role sticky-role--${user.role}`}>{user.name}</span>
            <button type="button" className="sticky-logout" onClick={onLogout} title="Sign out">
              <LogOut size={14} />
            </button>
          </>
        ) : (
          <button type="button" className="sticky-login-btn" onClick={onAdminLogin} title="Admin sign in">
            <LogIn size={14} /> Admin Login
          </button>
        )}
      </div>
    </header>
  );
};
