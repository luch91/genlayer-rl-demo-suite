"use client";

/*
 * Persistent chrome: one header band holding the brand mark, the global
 * Replay / Live toggle, and the active domain's contract chip, with a single
 * row of domain tabs beneath. The active domain is read from the pathname, so
 * the shell stays mounted while the content below switches. The view (episode,
 * learning, verification, live) is reached from inside the domain screen, not
 * from a second tab row here.
 */

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { DOMAIN_IDS } from "@/lib/manifest";
import { useManifests, useMode } from "@/lib/store";
import { ContractChip } from "./ContractChip";

function parsePath(pathname: string): { domain: string } {
  const parts = pathname.split("/").filter(Boolean);
  return { domain: parts[0] ?? "" };
}

function BrandMark() {
  return (
    <Image
      src="/genlayer-rl-logo.png"
      width="32"
      height="32"
      alt="RL Demo Suite logo"
      className="brand-svg"
    />
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { domain: activeDomain } = parsePath(pathname);
  const manifests = useManifests();
  const [mode, setMode] = useMode();

  const labelFor = (id: string): string => {
    const found = manifests?.find((r) => r.id === id);
    return found && found.ok ? found.manifest.domain.plain_name : id;
  };

  const currentDomain = DOMAIN_IDS.includes(activeDomain as never)
    ? activeDomain
    : DOMAIN_IDS[0];

  const activeManifest = manifests?.find((r) => r.id === currentDomain);
  const contract = activeManifest && activeManifest.ok ? activeManifest.manifest.contract : null;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="header-band">
            <div className="brand">
              <BrandMark />
              <div className="brand-text">
                <span className="brand-mark">RL Demo Suite</span>
                <span className="brand-sub">agents learning judgment on GenLayer</span>
              </div>
              <a
                className="chip-icon"
                href="/genlayer-rl-logo.png"
                download="genlayer-rl-demo-suite-logo.png"
              >
                Download logo
              </a>
            </div>

            <div className="mode-cluster">
              <div className="mode-toggle" role="group" aria-label="Data source">
                <button
                  type="button"
                  className="mode-btn"
                  aria-pressed={mode === "replay"}
                  onClick={() => setMode("replay")}
                >
                  Replay
                </button>
                <button
                  type="button"
                  className="mode-btn"
                  aria-pressed={mode === "live"}
                  onClick={() => setMode("live")}
                >
                  Live
                </button>
              </div>
              <p className="mode-help">
                Replay is a saved recording. Live reads the agent right now.
              </p>
            </div>

            {contract && <ContractChip address={contract.address} />}
          </div>

          <nav className="tabs tabs-domains" aria-label="Domains">
            <Link
              href="/"
              className="tab tab-home"
              aria-current={activeDomain === "" ? "page" : undefined}
            >
              All agents
            </Link>
            {DOMAIN_IDS.map((id) => (
              <Link
                key={id}
                href={`/${id}/episode/`}
                className="tab"
                aria-current={id === activeDomain ? "page" : undefined}
              >
                {labelFor(id)}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="wrap" id="main">
        {children}
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <span>
            A pure reader of each agent&apos;s published manifest. The reward function is immutable
            on-chain; the agent optimizes it and cannot rewrite it.
          </span>
          <a href="https://github.com/luch91-org" target="_blank" rel="noreferrer">
            source and the four agent repositories
          </a>
        </div>
      </footer>
    </>
  );
}
