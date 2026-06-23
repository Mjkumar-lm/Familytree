import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { ContactSection } from "./components/ContactSection";
import { CountUpStat } from "./components/CountUpStat";
import { FamilyTree } from "./components/FamilyTree";
import { HeroSection } from "./components/HeroSection";
import { Login, type AuthUser } from "./components/Login";
import { MemberDetails } from "./components/MemberDetails";
import { StickyHeader } from "./components/StickyHeader";
import { Toolbar } from "./components/Toolbar";
import type { FamilyMember, MemberDraft } from "./types";
import { loadMembers, loadMembersFromCloud, resetMembers, saveMembers } from "./utils/storage";
import {
  buildTree,
  collectDescendantIds,
  createMemberId,
  filterMembersBySearch,
  findMember,
  validateMembers,
} from "./utils/tree";

type PendingAction =
  | { type: "delete"; member: FamilyMember; descendantCount: number }
  | { type: "reset" }
  | null;

const AUTH_KEY = "familytree.auth";

const loadAuthUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (parsed?.role === "admin" || parsed?.role === "user") return parsed;
    return null;
  } catch {
    return null;
  }
};

export const App = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => loadAuthUser());
  const [showLogin, setShowLogin] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>(() => loadMembers());
  const [selectedId, setSelectedId] = useState<string | null>(() => members[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [expandedGeneration, setExpandedGeneration] = useState<number>(1);
  const [status, setStatus] = useState("Your family tree is saved in this browser.");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [showHeader, setShowHeader] = useState(false);
  const archiveRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);

  useEffect(() => {
    saveMembers(members);
  }, [members]);

  useEffect(() => {
    if (authUser) localStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
    else localStorage.removeItem(AUTH_KEY);
  }, [authUser]);

  const handleLogout = () => {
    setAuthUser(null);
    window.scrollTo({ top: 0 });
  };

  // Hydrate from Supabase on mount (overwrites the localStorage cache shown during boot).
  useEffect(() => {
    let cancelled = false;
    loadMembersFromCloud().then((cloud) => {
      if (cancelled || !cloud || cloud.length === 0) return;
      setMembers(cloud);
      setSelectedId((prev) => prev ?? cloud[0]?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Show sticky header once the hero scrolls out of view
  useEffect(() => {
    const HERO_HEIGHT = window.innerHeight * 0.5;

    const check = () => {
      const scrolled = window.scrollY || document.documentElement.scrollTop;
      setShowHeader(scrolled > HERO_HEIGHT);
    };

    check();
    document.addEventListener("scroll", check, { passive: true });
    window.addEventListener("scroll", check, { passive: true });

    // Also use IntersectionObserver as a secondary trigger
    const hero = document.querySelector(".hero") as HTMLElement | null;
    let observer: IntersectionObserver | null = null;
    if (hero) {
      observer = new IntersectionObserver(
        ([entry]) => setShowHeader(!entry.isIntersecting),
        { threshold: 0.05 },
      );
      observer.observe(hero);
    }

    return () => {
      document.removeEventListener("scroll", check);
      window.removeEventListener("scroll", check);
      observer?.disconnect();
    };
  }, []);

  // Scroll-reveal: watch [data-reveal] elements and add .is-revealed when they enter viewport
  useEffect(() => {
    const revealInView = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-revealed)").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 40 && rect.bottom > 0) {
          el.classList.add("is-revealed");
        }
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));

    // Fallback scroll listener for environments where IntersectionObserver misses programmatic scrolls
    document.addEventListener("scroll", revealInView, { passive: true });
    window.addEventListener("scroll", revealInView, { passive: true });
    revealInView(); // check immediately in case already in view

    return () => {
      observer.disconnect();
      document.removeEventListener("scroll", revealInView);
      window.removeEventListener("scroll", revealInView);
    };
  }, []);

  const selectedMember = useMemo(() => findMember(members, selectedId), [members, selectedId]);
  const visibleMembers = useMemo(() => filterMembersBySearch(members, query), [members, query]);
  const tree = useMemo(() => buildTree(visibleMembers), [visibleMembers]);
  const archiveStats = useMemo(() => {
    const directLineCount = members.filter((member) => member.relationship === "Son").length;
    const generations = members.map((member) => member.generation);
    const firstGeneration = Math.min(...generations);
    const lastGeneration = Math.max(...generations);

    return {
      directLineCount,
      firstGeneration,
      lastGeneration,
      selectedGeneration: selectedMember?.generation ?? null,
    };
  }, [members, selectedMember]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setStatus("Member selected.");
  };

  const handleToggleCollapse = (id: string, wasCollapsed: boolean) => {
    const member = members.find((m) => m.id === id);
    if (!member) return;

    // Intent-driven so it stays idempotent under React StrictMode's double-invocation:
    // a click that wanted to expand always lands at >= gen+1, a click that wanted to
    // collapse always lands at exactly gen.
    if (wasCollapsed) {
      setExpandedGeneration((current) => Math.max(current, member.generation + 1));
    } else {
      setExpandedGeneration(member.generation);
    }
  };

  const handleSaveMember = (id: string, draft: MemberDraft) => {
    setMembers((current) =>
      current.map((member) => (member.id === id ? { ...member, ...draft } : member)),
    );
    setStatus(`${draft.name} was updated.`);
  };

  const handleAddMember = (parentId: string, draft: MemberDraft) => {
    const newMember: FamilyMember = {
      id: createMemberId(draft.name),
      parentId,
      ...draft,
    };

    setMembers((current) => [...current, newMember]);
    setSelectedId(newMember.id);
    setStatus(`${draft.name} was added.`);
  };

  // Insert a new father above the current root: the new member becomes the root
  // (generation 1) and every existing member shifts down one generation.
  const handleAddFather = (name: string) => {
    const fatherId = createMemberId(name);
    setMembers((current) => {
      const root = current.find((m) => !m.parentId);
      if (!root) return current;
      const father: FamilyMember = {
        id: fatherId,
        name,
        parentId: null,
        relationship: "Son",
        generation: 1,
        notes: "",
        birth: "",
        death: "",
      };
      const shifted = current.map((m) => ({
        ...m,
        generation: m.generation + 1,
        parentId: m.id === root.id ? fatherId : m.parentId,
      }));
      return [father, ...shifted];
    });
    setSelectedId(fatherId);
    setExpandedGeneration((g) => g + 1);
    setStatus(`${name} was added as the new top ancestor.`);
  };

  const requestDelete = (member: FamilyMember) => {
    const descendantCount = collectDescendantIds(members, member.id).length;
    setPendingAction({ type: "delete", member, descendantCount });
  };

  const handleDeleteConfirmed = (member: FamilyMember) => {
    const idsToDelete = new Set([member.id, ...collectDescendantIds(members, member.id)]);
    setMembers((current) => current.filter((item) => !idsToDelete.has(item.id)));
    setSelectedId((current) => {
      if (current && !idsToDelete.has(current)) {
        return current;
      }
      return member.parentId ?? members.find((item) => !idsToDelete.has(item.id))?.id ?? null;
    });
    setStatus(`${member.name} and ${idsToDelete.size - 1} descendant(s) were removed.`);
  };

  const handleResetConfirmed = () => {
    const restored = resetMembers();
    setMembers(restored);
    setSelectedId(restored[0]?.id ?? null);
    setExpandedGeneration(1);
    setQuery("");
    setStatus("Original hierarchy restored.");
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const imported = validateMembers(JSON.parse(text));
      setMembers(imported);
      setSelectedId(imported[0]?.id ?? null);
      setExpandedGeneration(1);
      setStatus("Imported family tree successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import this file.");
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(members, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "family-tree-archive.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Exported current family tree as JSON.");
  };

  const confirmPendingAction = () => {
    if (pendingAction?.type === "delete") {
      handleDeleteConfirmed(pendingAction.member);
    }
    if (pendingAction?.type === "reset") {
      handleResetConfirmed();
    }
    setPendingAction(null);
  };

  const scrollToArchive = () => {
    archiveRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTree = () => {
    treeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isAdmin = authUser?.role === "admin";

  return (
    <main className="app-shell">
      <StickyHeader
        scrolled={showHeader}
        selectedName={selectedMember?.name ?? null}
        onScrollToTree={scrollToTree}
        onScrollToAbout={scrollToAbout}
        onScrollToContact={scrollToContact}
        user={authUser}
        onLogout={handleLogout}
        onAdminLogin={() => setShowLogin(true)}
      />
      {showLogin && !authUser && (
        <Login
          onLogin={(u) => { setAuthUser(u); setShowLogin(false); }}
          onClose={() => setShowLogin(false)}
        />
      )}
      <HeroSection onScrollDown={scrollToArchive} />
      <div ref={archiveRef} className="archive-section">
      <section ref={treeRef} className={`workspace ${isAdmin ? "" : "workspace--solo"}`} aria-label="Family tree workspace" data-reveal>
        <FamilyTree
          expandedGeneration={expandedGeneration}
          members={tree}
          selectedId={selectedId}
          onSelect={handleSelect}
          onToggleCollapse={handleToggleCollapse}
          onSetExpandedGeneration={setExpandedGeneration}
        />

        {isAdmin && (
          <MemberDetails
            key={selectedMember?.id ?? "empty"}
            member={selectedMember}
            onAdd={handleAddMember}
            onAddFather={handleAddFather}
            onDelete={requestDelete}
            onSave={handleSaveMember}
          />
        )}
      </section>

      </div>

      <section ref={aboutRef} className="about-section" aria-label="About">
        <div className="about-inner">
          <div className="about-mandala" aria-hidden="true" data-reveal>
            <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
              <circle cx="60" cy="60" r="38" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
              <circle cx="60" cy="60" r="20" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              {Array.from({ length: 8 }).map((_, i) => {
                const a = (i * 45 * Math.PI) / 180;
                return <line key={i} x1={60 + 20 * Math.cos(a)} y1={60 + 20 * Math.sin(a)} x2={60 + 54 * Math.cos(a)} y2={60 + 54 * Math.sin(a)} stroke="currentColor" strokeWidth="0.5" opacity="0.2" />;
              })}
              <text x="60" y="68" textAnchor="middle" fontSize="22" fontFamily="Cinzel Decorative, serif" fill="currentColor" opacity="0.6">&#x0950;</text>
            </svg>
          </div>

          <p className="about-eyebrow" data-reveal style={{ transitionDelay: "0.1s" }}>Our Heritage</p>
          <h2 className="about-title" data-reveal style={{ transitionDelay: "0.2s" }}>About the Keshwania Lineage</h2>
          <div className="about-divider" aria-hidden="true" data-reveal style={{ transitionDelay: "0.3s" }}><span /><span className="about-divider-dot" /><span /></div>

          <p className="about-body" data-reveal style={{ transitionDelay: "0.4s" }}>
            The Keshwania family lineage spans <strong>twenty-two generations</strong>, tracing its roots back to the
            revered ancestor <strong>Jhanj Dev</strong>. This living record preserves the names, relationships, and
            connections of each generation — from the earliest known forebears to the present day.
          </p>
          <p className="about-body" data-reveal style={{ transitionDelay: "0.55s" }}>
            Each generation carried the torch of family identity forward, and this archive exists to ensure that
            no name is forgotten. It is a tribute to ancestry, memory, and the bonds that define a family across centuries.
          </p>

          <div className="about-stats">
            <CountUpStat target={22} label="Generations" delay={0} />
            <div className="about-stat-sep" aria-hidden="true" />
            <CountUpStat target={35} label="Members Recorded" delay={200} />
            <div className="about-stat-sep" aria-hidden="true" />
            <CountUpStat target="∞" label="Legacy" delay={400} />
          </div>

          <p className="about-footer" data-reveal style={{ transitionDelay: "0.7s" }}>
            &#x0936;&#x094D;&#x0930;&#x0940; &#x0915;&#x0947;&#x0936;&#x094D;&#x0935;&#x093E;&#x0928;&#x093F;&#x092F;&#x093E; &#x0935;&#x0902;&#x0936; &mdash; Preserved for generations to come.
          </p>
        </div>
      </section>

      <section ref={contactRef}>
        <ContactSection />
      </section>

      {pendingAction && (
        <ConfirmDialog
          title={pendingAction.type === "reset" ? "Reset family tree?" : "Delete member?"}
          message={
            pendingAction.type === "reset"
              ? "This will replace your local edits with the original hierarchy."
              : `${pendingAction.member.name} will be removed${pendingAction.descendantCount
                ? ` with ${pendingAction.descendantCount} descendant(s)`
                : ""
              }.`
          }
          confirmLabel={pendingAction.type === "reset" ? "Reset" : "Delete"}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmPendingAction}
        />
      )}
    </main>
  );
};
