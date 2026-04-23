import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import styles from "./Menu.module.css";

export interface MenuItem {
  id: string;
  label: string;
  section?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export interface MenuProps {
  items: MenuItem[];
  trigger: (ctx: { open: boolean; toggle: () => void; ariaProps: { "aria-haspopup": "menu"; "aria-expanded": boolean } }) => ReactNode;
  align?: "left" | "right";
  menuLabel?: string;
}

export function Menu({ items, trigger, align = "left", menuLabel }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState<number>(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const enabled: number[] = [];
  items.forEach((it, i) => {
    if (!it.disabled) enabled.push(i);
  });

  useEffect(() => {
    if (!open) return;
    setFocused(enabled[0] ?? -1);
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, items.length]);

  const move = (delta: number) => {
    if (enabled.length === 0) return;
    const pos = enabled.indexOf(focused);
    const next = enabled[(pos + delta + enabled.length) % enabled.length]!;
    setFocused(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = items[focused];
      if (it && !it.disabled) {
        it.onSelect();
        setOpen(false);
      }
    }
  };

  const grouped: Array<{ section?: string; items: Array<{ item: MenuItem; index: number }> }> = [];
  items.forEach((item, index) => {
    const last = grouped[grouped.length - 1];
    if (last && last.section === item.section) last.items.push({ item, index });
    else grouped.push({ section: item.section, items: [{ item, index }] });
  });

  const toggle = () => setOpen((v) => !v);

  return (
    <div ref={rootRef} className={styles.root} onKeyDown={onKeyDown}>
      {trigger({ open, toggle, ariaProps: { "aria-haspopup": "menu", "aria-expanded": open } })}
      {open ? (
        <div className={`${styles.menu} ${align === "right" ? styles.alignRight : ""}`} role="menu" aria-label={menuLabel}>
          {grouped.map((g, gi) => (
            <div key={gi} className={styles.section}>
              {g.section ? <div className={styles.sectionHeader}>{g.section}</div> : null}
              {g.items.map(({ item, index }) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={`${styles.item} ${focused === index ? styles.itemFocused : ""}`}
                  disabled={item.disabled}
                  onMouseEnter={() => setFocused(index)}
                  onClick={() => {
                    item.onSelect();
                    setOpen(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
          {items.length === 0 ? <div className={styles.empty}>No items</div> : null}
        </div>
      ) : null}
    </div>
  );
}
