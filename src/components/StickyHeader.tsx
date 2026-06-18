interface StickyHeaderProps {
  scrolled: boolean;
  selectedName: string | null;
  onScrollToTree: () => void;
  onScrollToAbout: () => void;
}

export const StickyHeader = ({ scrolled, selectedName, onScrollToTree, onScrollToAbout }: StickyHeaderProps) => {
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
      </nav>

      <div className="sticky-header-right">
        {scrolled && (
          <>
            <span className="sticky-section">Lineage Archive</span>
            {selectedName && (
              <>
                <span className="sticky-sep" aria-hidden="true">&#x203A;</span>
                <span className="sticky-member">{selectedName}</span>
              </>
            )}
          </>
        )}
      </div>
    </header>
  );
};
