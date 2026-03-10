import React, { useState } from "react";
import type { TocEntry } from "@teammind/markview-engine/browser";

interface SidebarProps {
  toc: TocEntry[];
}

export function Sidebar({ toc }: SidebarProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);

  const handleClick = (id: string): void => {
    const element = document.getElementById(id);
    if (element) {
      const scrollContainer = document.querySelector(".main-panel");
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const offset = elementRect.top - containerRect.top + scrollContainer.scrollTop;
        scrollContainer.scrollTo({ top: offset, behavior: "smooth" });
      }
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div className="sidebar-header">
        <span className="sidebar-title">Contents</span>
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((prev) => !prev)}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "\u25B6" : "\u25C0"}
        </button>
      </div>
      {!collapsed && (
        <nav className="sidebar-nav">
          {toc.length === 0 ? (
            <p className="sidebar-empty">No headings found</p>
          ) : (
            <ul className="toc-list">
              {toc.map((entry) => (
                <li
                  key={entry.id}
                  className={`toc-item toc-level-${entry.level}`}
                >
                  <button
                    className="toc-link"
                    onClick={() => handleClick(entry.id)}
                  >
                    {entry.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      )}
    </aside>
  );
}
