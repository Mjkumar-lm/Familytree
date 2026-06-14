import { Download, GitBranch, RotateCcw, Search, Sparkles, Upload, Users } from "lucide-react";
import { useRef } from "react";

interface ArchiveStats {
  directLineCount: number;
  firstGeneration: number;
  lastGeneration: number;
  selectedGeneration: number | null;
}

interface ToolbarProps {
  query: string;
  status: string;
  stats: ArchiveStats;
  totalMembers: number;
  visibleMembers: number;
  onQueryChange: (query: string) => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onReset: () => void;
}

export const Toolbar = ({
  query,
  status,
  stats,
  totalMembers,
  visibleMembers,
  onQueryChange,
  onImport,
  onExport,
  onReset,
}: ToolbarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="toolbar">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">
          <GitBranch size={24} />
        </div>
        <div>
          <p className="eyebrow">Generation Archive</p>
          <h1>Lineage Archive</h1>
          <p className="brand-copy">Twenty-five generations preserved in one editable family record.</p>
        </div>
      </div>

      <div className="command-center">
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            aria-label="Search members"
            value={query}
            placeholder="Search names, generations, relations"
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>

        <div className="toolbar-actions" aria-label="Tree actions">
          <button
            type="button"
            className="icon-button"
            title="Import JSON"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={18} aria-hidden="true" />
            <span>Import</span>
          </button>
          <input
            ref={inputRef}
            className="hidden-input"
            type="file"
            accept="application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onImport(file);
              }
              event.currentTarget.value = "";
            }}
          />
          <button type="button" className="icon-button" title="Export JSON" onClick={onExport}>
            <Download size={18} aria-hidden="true" />
            <span>Export</span>
          </button>
          <button type="button" className="icon-button danger-soft" title="Reset tree" onClick={onReset}>
            <RotateCcw size={18} aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="archive-stats" aria-label="Archive summary">
        <div className="stat-card">
          <Users size={18} aria-hidden="true" />
          <span>Total</span>
          <strong>{totalMembers}</strong>
        </div>
        <div className="stat-card">
          <Search size={18} aria-hidden="true" />
          <span>Visible</span>
          <strong>{visibleMembers}</strong>
        </div>
        <div className="stat-card">
          <Sparkles size={18} aria-hidden="true" />
          <span>Direct line</span>
          <strong>{stats.directLineCount}</strong>
        </div>
        <div className="stat-card">
          <GitBranch size={18} aria-hidden="true" />
          <span>Generations</span>
          <strong>
            {stats.firstGeneration}-{stats.lastGeneration}
          </strong>
        </div>
      </div>

      <div className="status-line" role="status">
        <strong>{stats.selectedGeneration ? `Generation ${stats.selectedGeneration}` : "Archive"}</strong>
        <span>{status}</span>
      </div>
    </header>
  );
};
