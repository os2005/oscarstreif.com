"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { saveWikiEntryAction } from "./server/actions";
import type { WikiFileSummary, WikiGraphNode, WikiSnapshot } from "./server/wiki-store";

type LlmWikiWorkspaceProps = {
  openEntryInModal: boolean;
  snapshot: WikiSnapshot;
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 102.4) / 10} KB`;
  return `${Math.round(value / 1024 / 102.4) / 10} MB`;
}

function entryHref(file: Pick<WikiFileSummary, "kind" | "path">) {
  return `/private/llm-wiki?view=wiki&kind=${encodeURIComponent(file.kind)}&file=${encodeURIComponent(file.path)}`;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function resolveWikiPath(rawTarget: string, wikiPaths: Set<string>) {
  const cleanTarget = rawTarget.split("|")[0]?.split("#")[0]?.trim() ?? "";
  if (!cleanTarget || /^https?:\/\//i.test(cleanTarget)) return null;

  const normalized = cleanTarget.endsWith(".md") ? cleanTarget : `${cleanTarget}.md`;
  if (wikiPaths.has(normalized)) return normalized;

  const basename = normalized.split("/").at(-1)?.replace(/\.md$/, "").toLowerCase();
  return [...wikiPaths].find((path) => path.split("/").at(-1)?.replace(/\.md$/, "").toLowerCase() === basename) ?? null;
}

function EntryLink({
  entry,
  selected,
}: {
  entry: WikiFileSummary;
  selected: WikiSnapshot["selected"];
}) {
  const isActive = selected.kind === entry.kind && selected.path === entry.path;

  return (
    <Link
      className={cx(
        "block border-b border-white/8 px-3 py-3 transition last:border-b-0 hover:bg-white/6",
        isActive && "bg-white/10"
      )}
      href={entryHref(entry)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-paper">{entry.title}</p>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/34">
          {entry.kind}
        </span>
      </div>
      <p className="mt-1 truncate font-mono text-[10px] text-paper/38">{entry.path}</p>
      {entry.excerpt ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-paper/52">{entry.excerpt}</p> : null}
    </Link>
  );
}

function GroupedEntries({
  entries,
  selected,
  title,
}: {
  entries: WikiFileSummary[];
  selected: WikiSnapshot["selected"];
  title: string;
}) {
  const groups = entries.reduce<Record<string, WikiFileSummary[]>>((accumulator, entry) => {
    const group = entry.category || "root";
    accumulator[group] = accumulator[group] ? [...accumulator[group], entry] : [entry];
    return accumulator;
  }, {});

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper/52">{title}</h2>
        <span className="font-mono text-[10px] text-paper/34">{entries.length}</span>
      </div>
      <div className="overflow-hidden border border-paper/10 bg-black/20">
        {entries.length ? (
          Object.entries(groups).map(([group, groupEntries]) => (
            <div key={group}>
              <p className="border-b border-white/8 bg-white/[0.035] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/34">
                {group}
              </p>
              {groupEntries.map((entry) => (
                <EntryLink entry={entry} key={`${entry.kind}:${entry.path}`} selected={selected} />
              ))}
            </div>
          ))
        ) : (
          <p className="px-3 py-4 text-sm text-paper/48">Empty</p>
        )}
      </div>
    </div>
  );
}

function renderInline(text: string, wikiPaths: Set<string>): ReactNode[] {
  const parts = text.split(/(\[\[[^\]]+]]|\[[^\]]+]\([^)]+\)|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (!part) return null;

    const code = part.match(/^`([^`]+)`$/);
    if (code) {
      return (
        <code className="border border-paper/10 bg-white/8 px-1.5 py-0.5 font-mono text-[0.92em]" key={index}>
          {code[1]}
        </code>
      );
    }

    const wiki = part.match(/^\[\[([^\]]+)]]$/);
    if (wiki) {
      const [target, alias] = wiki[1].split("|");
      const cleanTarget = target.split("#")[0]?.trim() ?? "";
      const file = resolveWikiPath(cleanTarget, wikiPaths) ?? (cleanTarget.endsWith(".md") ? cleanTarget : `${cleanTarget}.md`);
      const label = alias?.trim() || cleanTarget;
      const exists = wikiPaths.has(file);

      return (
        <Link
          className={cx("border-b", exists ? "border-sky-300/40 text-sky-100" : "border-amber-300/40 text-amber-100")}
          href={`/private/llm-wiki?view=wiki&kind=wiki&file=${encodeURIComponent(file)}`}
          key={index}
        >
          {label}
        </Link>
      );
    }

    const markdownLink = part.match(/^\[([^\]]+)]\(([^)]+)\)$/);
    if (markdownLink) {
      const [, label, href] = markdownLink;
      const isExternal = /^https?:\/\//i.test(href);
      const wikiPath = resolveWikiPath(href, wikiPaths);

      if (isExternal) {
        return (
          <a className="border-b border-sky-300/40 text-sky-100" href={href} key={index} rel="noreferrer" target="_blank">
            {label}
          </a>
        );
      }

      if (wikiPath) {
        return (
          <Link
            className="border-b border-sky-300/40 text-sky-100"
            href={`/private/llm-wiki?view=wiki&kind=wiki&file=${encodeURIComponent(wikiPath)}`}
            key={index}
          >
            {label}
          </Link>
        );
      }
    }

    return part;
  });
}

function MarkdownPreview({ content, wikiPaths }: { content: string; wikiPaths: Set<string> }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let codeLines: string[] | null = null;

  function flushParagraph(keyPrefix: string) {
    if (!paragraph.length) return;
    blocks.push(
      <p className="max-w-3xl text-sm leading-7 text-paper/72" key={`${keyPrefix}-${blocks.length}`}>
        {renderInline(paragraph.join(" "), wikiPaths)}
      </p>
    );
    paragraph = [];
  }

  function flushList(keyPrefix: string) {
    if (!list.length) return;
    blocks.push(
      <ul className="max-w-3xl list-disc space-y-2 pl-5 text-sm leading-7 text-paper/72" key={`${keyPrefix}-${blocks.length}`}>
        {list.map((item, index) => (
          <li key={index}>{renderInline(item, wikiPaths)}</li>
        ))}
      </ul>
    );
    list = [];
  }

  for (const [index, line] of lines.entries()) {
    if (line.startsWith("```")) {
      if (codeLines !== null) {
        blocks.push(
          <pre className="overflow-x-auto border border-paper/10 bg-black/40 p-4 text-xs leading-6 text-paper/72" key={`code-${index}`}>
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = null;
      } else {
        flushParagraph("paragraph");
        flushList("list");
        codeLines = [];
      }
      continue;
    }

    if (codeLines !== null) {
      codeLines.push(line);
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph("paragraph");
      flushList("list");
      const level = heading[1].length;
      const className =
        level === 1
          ? "font-display text-4xl leading-tight text-paper"
          : level === 2
            ? "pt-4 font-display text-2xl leading-tight text-paper"
            : "pt-2 font-mono text-xs uppercase tracking-[0.18em] text-paper/58";
      const content = renderInline(heading[2], wikiPaths);
      blocks.push(
        level === 1 ? (
          <h2 className={className} key={`heading-${index}`}>
            {content}
          </h2>
        ) : level === 2 ? (
          <h3 className={className} key={`heading-${index}`}>
            {content}
          </h3>
        ) : (
          <h4 className={className} key={`heading-${index}`}>
            {content}
          </h4>
        )
      );
      continue;
    }

    const listItem = line.match(/^\s*[-*]\s+(.+)$/);
    if (listItem) {
      flushParagraph("paragraph");
      list.push(listItem[1]);
      continue;
    }

    if (/^\s*$/.test(line)) {
      flushParagraph("paragraph");
      flushList("list");
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph("paragraph-final");
  flushList("list-final");

  if (codeLines !== null) {
    blocks.push(
      <pre className="overflow-x-auto border border-paper/10 bg-black/40 p-4 text-xs leading-6 text-paper/72" key="code-final">
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
  }

  return <div className="space-y-5">{blocks}</div>;
}

function SearchResults({ results }: { results: WikiFileSummary[] }) {
  if (!results.length) {
    return <p className="border border-paper/10 bg-black/20 px-3 py-4 text-sm text-paper/48">No matches</p>;
  }

  return (
    <div className="overflow-hidden border border-paper/10 bg-black/20">
      {results.map((result) => (
        <Link className="block border-b border-white/8 px-3 py-3 last:border-b-0 hover:bg-white/6" href={entryHref(result)} key={`${result.kind}:${result.path}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm text-paper">{result.title}</p>
            <span className="font-mono text-[10px] text-paper/34">{result.matchCount} hits</span>
          </div>
          <p className="mt-1 truncate font-mono text-[10px] text-paper/36">{result.path}</p>
          {result.matches?.length ? (
            <div className="mt-2 space-y-1">
              {result.matches.map((match) => (
                <p className="truncate text-xs text-paper/52" key={`${result.path}:${match.line}`}>
                  {match.line}: {match.text}
                </p>
              ))}
            </div>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function shortNodeLabel(value: string) {
  return value.length > 24 ? `${value.slice(0, 21)}...` : value;
}

type ForceNode = WikiGraphNode & {
  height: number;
  radius: number;
  width: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type GraphInteraction =
  | {
      mode: "node";
      nodePath: string;
      pointerId: number;
      moved: boolean;
      startClientX: number;
      startClientY: number;
    }
  | {
      mode: "pan";
      pointerId: number;
      startClientX: number;
      startClientY: number;
      startPanX: number;
      startPanY: number;
    };

const FORCE_GRAPH_WIDTH = 1120;
const FORCE_GRAPH_HEIGHT = 720;

function createInitialForceNodes(snapshot: WikiSnapshot): ForceNode[] {
  const centerX = FORCE_GRAPH_WIDTH / 2;
  const centerY = FORCE_GRAPH_HEIGHT / 2;
  const maxInbound = Math.max(1, snapshot.graph.maxInbound);

  return snapshot.graph.nodes.map((node, index) => {
    const seed = hashString(node.path);
    const angle =
      (index / Math.max(1, snapshot.graph.nodes.length)) * Math.PI * 2 + (seed % 360) * (Math.PI / 1440);
    const relevance = node.inbound / maxInbound;
    const nodeWidth = 130 + Math.round(relevance * 76);
    const nodeHeight = 50 + Math.round(relevance * 22);
    const radius = Math.max(nodeWidth, nodeHeight) * 0.58;
    const distance = 120 + (seed % 240);

    return {
      ...node,
      height: nodeHeight,
      radius,
      width: nodeWidth,
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
      vx: Math.sin(angle) * 1.2,
      vy: Math.cos(angle) * 1.2,
    };
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ForceDirectedGraph({ snapshot }: { snapshot: WikiSnapshot }) {
  const router = useRouter();
  const selectedPath = snapshot.selected.kind === "wiki" ? snapshot.selected.path : null;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const alphaRef = useRef(1);
  const interactionRef = useRef<GraphInteraction | null>(null);
  const suppressClickRef = useRef<{ nodePath: string; until: number } | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [nodes, setNodes] = useState<ForceNode[]>(() => createInitialForceNodes(snapshot));
  const nodesRef = useRef<ForceNode[]>(nodes);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef(pan);
  const [selectedInfoPath, setSelectedInfoPath] = useState<string | null>(
    snapshot.selected.kind === "wiki" ? snapshot.selected.path : null
  );
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(zoom);
  const maxInbound = Math.max(1, snapshot.graph.maxInbound);
  const edgePaths = useMemo(() => snapshot.graph.edges, [snapshot.graph.edges]);
  const fileByPath = useMemo(() => new Map(snapshot.files.map((file) => [file.path, file])), [snapshot.files]);
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.path, node])), [nodes]);
  const selectedInfo = selectedInfoPath ? fileByPath.get(selectedInfoPath) ?? null : null;
  const portalTarget = typeof document === "undefined" ? null : document.body;
  const layoutEdges = useMemo(
    () =>
      edgePaths
        .map((edge) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          return from && to ? { from, to } : null;
        })
        .filter((edge): edge is { from: ForceNode; to: ForceNode } => edge !== null),
    [edgePaths, nodeMap]
  );

  useEffect(() => {
    const nextNodes = createInitialForceNodes(snapshot);
    nodesRef.current = nextNodes;
    alphaRef.current = 1;
    const timeout = window.setTimeout(() => {
      setNodes(nextNodes);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [snapshot]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    if (!isMaximized) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMaximized]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const edgeList = snapshot.graph.edges;
    const maxInboundForPhysics = Math.max(1, snapshot.graph.maxInbound);

    function tick() {
      const currentNodes = nodesRef.current.map((node) => ({ ...node }));
      const currentNodeMap = new Map(currentNodes.map((node) => [node.path, node]));
      const graphEdges = edgeList
        .map((edge) => {
          const from = currentNodeMap.get(edge.from);
          const to = currentNodeMap.get(edge.to);
          return from && to ? { from, to } : null;
        })
        .filter((edge): edge is { from: ForceNode; to: ForceNode } => edge !== null);
      const alpha = alphaRef.current;
      const draggedPath = interactionRef.current?.mode === "node" ? interactionRef.current.nodePath : null;

      for (let leftIndex = 0; leftIndex < currentNodes.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < currentNodes.length; rightIndex += 1) {
          const left = currentNodes[leftIndex];
          const right = currentNodes[rightIndex];
          let dx = right.x - left.x;
          let dy = right.y - left.y;
          let distanceSquared = dx * dx + dy * dy;

          if (distanceSquared < 0.01) {
            dx = 0.2;
            dy = 0.2;
            distanceSquared = 0.08;
          }

          const distance = Math.sqrt(distanceSquared);
          const force = Math.min(8, (9800 * alpha) / distanceSquared);
          const nx = dx / distance;
          const ny = dy / distance;
          const leftPinned = left.path === draggedPath;
          const rightPinned = right.path === draggedPath;

          if (!leftPinned) {
            left.vx -= nx * force;
            left.vy -= ny * force;
          }

          if (!rightPinned) {
            right.vx += nx * force;
            right.vy += ny * force;
          }

          const minDistance = left.radius + right.radius + 22;
          if (distance < minDistance) {
            const push = (minDistance - distance) * 0.035 * alpha;

            if (!leftPinned) {
              left.vx -= nx * push;
              left.vy -= ny * push;
            }

            if (!rightPinned) {
              right.vx += nx * push;
              right.vy += ny * push;
            }
          }
        }
      }

      for (const edge of graphEdges) {
        const dx = edge.to.x - edge.from.x;
        const dy = edge.to.y - edge.from.y;
        const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const desiredDistance = 150 + (edge.from.outbound + edge.to.inbound) * 4;
        const force = (distance - desiredDistance) * 0.025 * alpha;
        const nx = dx / distance;
        const ny = dy / distance;

        if (edge.from.path !== draggedPath) {
          edge.from.vx += nx * force;
          edge.from.vy += ny * force;
        }

        if (edge.to.path !== draggedPath) {
          edge.to.vx -= nx * force;
          edge.to.vy -= ny * force;
        }
      }

      for (const node of currentNodes) {
        if (node.path === draggedPath) {
          node.vx = 0;
          node.vy = 0;
          continue;
        }

        const relevancePull = 0.004 + (node.inbound / maxInboundForPhysics) * 0.006;
        node.vx += (FORCE_GRAPH_WIDTH / 2 - node.x) * relevancePull * alpha;
        node.vy += (FORCE_GRAPH_HEIGHT / 2 - node.y) * relevancePull * alpha;
        node.vx *= 0.83;
        node.vy *= 0.83;
        node.x = clamp(node.x + node.vx, node.width / 2 + 18, FORCE_GRAPH_WIDTH - node.width / 2 - 18);
        node.y = clamp(node.y + node.vy, node.height / 2 + 18, FORCE_GRAPH_HEIGHT - node.height / 2 - 18);
      }

      nodesRef.current = currentNodes;
      setNodes(currentNodes);
      alphaRef.current = interactionRef.current?.mode === "node" ? 0.72 : Math.max(0.035, alpha * 0.985);
      animationRef.current = window.requestAnimationFrame(tick);
    }

    animationRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [snapshot.graph.edges, snapshot.graph.maxInbound]);

  function toGraphPoint(clientX: number, clientY: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    const svgX = ((clientX - rect.left) / rect.width) * FORCE_GRAPH_WIDTH;
    const svgY = ((clientY - rect.top) / rect.height) * FORCE_GRAPH_HEIGHT;

    return {
      x: isMaximized ? (svgX - panRef.current.x) / zoomRef.current : svgX,
      y: isMaximized ? (svgY - panRef.current.y) / zoomRef.current : svgY,
    };
  }

  function setGraphZoom(nextZoom: number, anchor?: { x: number; y: number }) {
    const clampedZoom = clamp(nextZoom, 0.45, 2.8);

    if (anchor) {
      const graphPoint = {
        x: (anchor.x - panRef.current.x) / zoomRef.current,
        y: (anchor.y - panRef.current.y) / zoomRef.current,
      };
      const nextPan = {
        x: anchor.x - graphPoint.x * clampedZoom,
        y: anchor.y - graphPoint.y * clampedZoom,
      };

      panRef.current = nextPan;
      setPan(nextPan);
    }

    zoomRef.current = clampedZoom;
    setZoom(clampedZoom);
  }

  function openGraphPopup() {
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setSelectedInfoPath(selectedPath ?? snapshot.graph.nodes[0]?.path ?? null);
    setIsMaximized(true);
    alphaRef.current = 0.95;
  }

  function closeGraphPopup() {
    interactionRef.current = null;
    setIsMaximized(false);
  }

  function handleNodePointerDown(event: React.PointerEvent<SVGGElement>, nodePath: string) {
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      mode: "node",
      nodePath,
      pointerId: event.pointerId,
      moved: false,
      startClientX: event.clientX,
      startClientY: event.clientY,
    };
    alphaRef.current = 0.95;
  }

  function handleSvgPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (!isMaximized || event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      mode: "pan",
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPanX: panRef.current.x,
      startPanY: panRef.current.y,
    };
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;

    if (interaction.mode === "pan") {
      const rect = event.currentTarget.getBoundingClientRect();
      const nextPan = {
        x: interaction.startPanX + ((event.clientX - interaction.startClientX) / rect.width) * FORCE_GRAPH_WIDTH,
        y: interaction.startPanY + ((event.clientY - interaction.startClientY) / rect.height) * FORCE_GRAPH_HEIGHT,
      };

      panRef.current = nextPan;
      setPan(nextPan);
      return;
    }

    const movedDistance = Math.hypot(event.clientX - interaction.startClientX, event.clientY - interaction.startClientY);
    if (movedDistance > 4) {
      interaction.moved = true;
    }

    const point = toGraphPoint(event.clientX, event.clientY);
    nodesRef.current = nodesRef.current.map((node) =>
      node.path === interaction.nodePath
        ? {
            ...node,
            vx: 0,
            vy: 0,
            x: clamp(point.x, node.width / 2 + 18, FORCE_GRAPH_WIDTH - node.width / 2 - 18),
            y: clamp(point.y, node.height / 2 + 18, FORCE_GRAPH_HEIGHT - node.height / 2 - 18),
          }
        : node
    );
    setNodes(nodesRef.current);
  }

  function handlePointerUp(event: React.PointerEvent<SVGSVGElement>) {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;

    if (interaction.mode === "node" && interaction.moved) {
      suppressClickRef.current = {
        nodePath: interaction.nodePath,
        until: event.timeStamp + 250,
      };
    }

    interactionRef.current = null;
    alphaRef.current = 0.42;
  }

  function handleNodeClick(event: React.MouseEvent<SVGGElement>, nodePath: string) {
    const suppressClick = suppressClickRef.current;
    if (suppressClick?.nodePath === nodePath && suppressClick.until > event.timeStamp) {
      event.preventDefault();
      return;
    }

    if (isMaximized) {
      setSelectedInfoPath(nodePath);
      return;
    }

    router.push(`/private/llm-wiki?view=wiki&kind=wiki&file=${encodeURIComponent(nodePath)}`);
  }

  function handleGraphWheel(event: React.WheelEvent<SVGSVGElement>) {
    if (!isMaximized) return;

    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const anchor = {
      x: ((event.clientX - rect.left) / rect.width) * FORCE_GRAPH_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * FORCE_GRAPH_HEIGHT,
    };
    const direction = event.deltaY > 0 ? -1 : 1;
    const nextZoom = zoomRef.current * (1 + direction * 0.025);
    setGraphZoom(nextZoom, anchor);
  }

  function renderMaximizeButton(kind: "open" | "close") {
    const isCloseButton = kind === "close";

    return (
      <button
        aria-label={isCloseButton ? "Close graph popup" : "Maximize graph"}
        className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center border border-paper/18 bg-black/55 text-paper/80 shadow-[0_12px_34px_rgba(0,0,0,0.28)] transition hover:border-sky-200/45 hover:bg-sky-200/10 hover:text-paper"
        onClick={isCloseButton ? closeGraphPopup : openGraphPopup}
        title={isCloseButton ? "Close" : "Maximize"}
        type="button"
      >
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
          {isCloseButton ? (
            <>
              <path d="M9 3v6H3" stroke="currentColor" strokeLinecap="square" strokeWidth="1.8" />
              <path d="M15 21v-6h6" stroke="currentColor" strokeLinecap="square" strokeWidth="1.8" />
              <path d="M15 3v6h6" stroke="currentColor" strokeLinecap="square" strokeWidth="1.8" />
              <path d="M9 21v-6H3" stroke="currentColor" strokeLinecap="square" strokeWidth="1.8" />
            </>
          ) : (
            <>
              <path d="M4 10V4h6" stroke="currentColor" strokeLinecap="square" strokeWidth="1.8" />
              <path d="M14 4h6v6" stroke="currentColor" strokeLinecap="square" strokeWidth="1.8" />
              <path d="M20 14v6h-6" stroke="currentColor" strokeLinecap="square" strokeWidth="1.8" />
              <path d="M10 20H4v-6" stroke="currentColor" strokeLinecap="square" strokeWidth="1.8" />
            </>
          )}
        </svg>
      </button>
    );
  }

  function renderGraphSvg(isPopup: boolean) {
    const activePath = isPopup ? selectedInfoPath : selectedPath;

    return (
      <svg
        aria-label="LLM Wiki force-directed link graph"
        className={cx("block h-full w-full touch-none select-none", isPopup && "cursor-move")}
        onPointerDown={isPopup ? handleSvgPointerDown : undefined}
        onPointerMove={isPopup ? handlePointerMove : undefined}
        onPointerUp={isPopup ? handlePointerUp : undefined}
        onWheel={isPopup ? handleGraphWheel : undefined}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        ref={isPopup ? svgRef : undefined}
        viewBox={`0 0 ${FORCE_GRAPH_WIDTH} ${FORCE_GRAPH_HEIGHT}`}
      >
        <defs>
          <marker id={isPopup ? "wiki-graph-arrow-popup" : "wiki-graph-arrow"} markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
            <path d="M0,0 L8,4 L0,8 Z" fill="rgba(247,245,240,0.35)" />
          </marker>
        </defs>
        <rect fill="rgba(0,0,0,0.16)" height={FORCE_GRAPH_HEIGHT} width={FORCE_GRAPH_WIDTH} x="0" y="0" />
        <g transform={isPopup ? `translate(${pan.x} ${pan.y}) scale(${zoom})` : undefined}>
          {layoutEdges.map((edge) => {
            const isRelated = activePath === edge.from.path || activePath === edge.to.path;

            return (
              <line
                key={`${isPopup ? "popup" : "inline"}:${edge.from.path}->${edge.to.path}`}
                markerEnd={`url(#${isPopup ? "wiki-graph-arrow-popup" : "wiki-graph-arrow"})`}
                stroke={isRelated ? "rgba(125,211,252,0.62)" : "rgba(247,245,240,0.18)"}
                strokeWidth={isRelated ? 2.2 : 1.2}
                x1={edge.from.x}
                x2={edge.to.x}
                y1={edge.from.y}
                y2={edge.to.y}
              />
            );
          })}
          {nodes.map((node) => {
            const relevance = node.inbound / maxInbound;
            const isActive = activePath === node.path;
            const fill = isActive
              ? "rgba(247,245,240,0.92)"
              : relevance > 0.7
                ? "rgba(125,211,252,0.18)"
                : "rgba(247,245,240,0.075)";
            const stroke = isActive
              ? "rgba(247,245,240,0.95)"
              : relevance > 0.7
                ? "rgba(125,211,252,0.56)"
                : "rgba(247,245,240,0.18)";
            const textFill = isActive ? "rgba(8,8,8,0.94)" : "rgba(247,245,240,0.86)";
            const mutedFill = isActive ? "rgba(8,8,8,0.58)" : "rgba(247,245,240,0.42)";

            return (
              <g
                className={cx(isPopup ? "cursor-grab active:cursor-grabbing" : "cursor-pointer", "transition hover:opacity-90")}
                key={`${isPopup ? "popup" : "inline"}:${node.path}`}
                onClick={(event) => handleNodeClick(event, node.path)}
                onPointerDown={isPopup ? (event) => handleNodePointerDown(event, node.path) : undefined}
              >
                <rect
                  fill={fill}
                  height={node.height}
                  rx="8"
                  stroke={stroke}
                  strokeWidth={isActive ? 2 : 1}
                  width={node.width}
                  x={node.x - node.width / 2}
                  y={node.y - node.height / 2}
                />
                <text
                  fill={textFill}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                  x={node.x}
                  y={node.y - 4}
                >
                  {shortNodeLabel(node.title)}
                </text>
                <text
                  fill={mutedFill}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
                  fontSize="9"
                  textAnchor="middle"
                  x={node.x}
                  y={node.y + 13}
                >
                  {node.inbound} in / {node.outbound} out
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    );
  }

  function renderInfoPanel() {
    return (
      <aside className="hidden w-[360px] shrink-0 border-l border-paper/10 bg-ink/96 p-5 md:block">
        {selectedInfo ? (
          <div className="flex h-full flex-col">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/38">Selected Page</p>
            <h3 className="mt-3 font-display text-3xl leading-tight text-paper">{selectedInfo.title}</h3>
            <p className="mt-2 break-all font-mono text-[10px] text-paper/36">{selectedInfo.path}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="border border-paper/10 bg-white/[0.04] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/34">Inbound</p>
                <p className="mt-1 text-xl text-paper">{nodeMap.get(selectedInfo.path)?.inbound ?? 0}</p>
              </div>
              <div className="border border-paper/10 bg-white/[0.04] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/34">Outbound</p>
                <p className="mt-1 text-xl text-paper">{nodeMap.get(selectedInfo.path)?.outbound ?? 0}</p>
              </div>
            </div>
            <div className="mt-5 min-h-0 flex-1 overflow-y-auto border border-paper/10 bg-black/24 p-4">
              <p className="text-sm leading-7 text-paper/72">{selectedInfo.excerpt || "No summary available yet."}</p>
            </div>
            <a
              className="mt-4 block border border-paper/16 bg-paper px-4 py-3 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-ink transition hover:bg-white"
              href={`/private/llm-wiki?view=wiki&kind=wiki&file=${encodeURIComponent(selectedInfo.path)}`}
              rel="noreferrer"
              target="_blank"
            >
              View
            </a>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-center text-sm leading-7 text-paper/52">
            Select a box in the graph.
          </div>
        )}
      </aside>
    );
  }

  return (
    <>
      <section className="relative border border-paper/10 bg-white/[0.04]">
        {renderMaximizeButton("open")}
        <div className="border-b border-paper/10 bg-black/18 px-4 py-3 pr-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/38">Force Graph</p>
            <h2 className="mt-1 font-display text-2xl leading-tight text-paper">Link Network</h2>
          </div>
        </div>
        <div className="h-[430px] overflow-hidden bg-black/22 md:h-[540px]">{renderGraphSvg(false)}</div>
      </section>

      {isMaximized && portalTarget
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex flex-col bg-ink text-paper">
              {renderMaximizeButton("close")}
              <div className="border-b border-paper/10 bg-black/32 px-5 py-4 pr-16">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/38">Force Graph Popup</p>
                <h2 className="mt-1 font-display text-3xl leading-tight text-paper">Link Network</h2>
              </div>
              <div className="flex min-h-0 flex-1 bg-black/22">
                <div className="min-w-0 flex-1 overflow-hidden">{renderGraphSvg(true)}</div>
                {renderInfoPanel()}
              </div>
            </div>,
            portalTarget
          )
        : null}
    </>
  );
}

function getNodeBoxClass(node: WikiGraphNode, maxInbound: number) {
  const isHub = maxInbound > 0 && node.inbound === maxInbound;
  const isStrong = node.inbound >= 3;

  return cx(
    "border bg-black/24 p-3 transition hover:border-sky-200/50 hover:bg-sky-200/8",
    isHub ? "border-sky-200/40 md:col-span-2" : "border-paper/10",
    isStrong && !isHub && "md:col-span-2"
  );
}

function KnowledgeWeb({ snapshot }: { snapshot: WikiSnapshot }) {
  const selectedPath = snapshot.selected.kind === "wiki" ? snapshot.selected.path : null;
  const edgesBySource = useMemo(() => {
    return snapshot.graph.edges.reduce<Record<string, string[]>>((accumulator, edge) => {
      accumulator[edge.from] = accumulator[edge.from] ? [...accumulator[edge.from], edge.to] : [edge.to];
      return accumulator;
    }, {});
  }, [snapshot.graph.edges]);
  const nodeByPath = useMemo(() => {
    return new Map(snapshot.graph.nodes.map((node) => [node.path, node]));
  }, [snapshot.graph.nodes]);

  return (
    <section className="border border-paper/10 bg-white/[0.04]">
      <div className="flex flex-col gap-2 border-b border-paper/10 bg-black/18 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/38">Relevance Boxes</p>
          <h2 className="mt-1 font-display text-2xl leading-tight text-paper">Seiten nach Relevanz</h2>
        </div>
        <div className="flex gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/42">
          <span>{snapshot.graph.nodes.length} Seiten</span>
          <span>{snapshot.graph.edges.length} Links</span>
        </div>
      </div>
      <div className="grid auto-rows-fr gap-3 p-3 md:grid-cols-3 xl:grid-cols-4">
        {snapshot.graph.nodes.map((node) => {
          const outgoing = edgesBySource[node.path] ?? [];
          const isActive = selectedPath === node.path;
          const scale = snapshot.graph.maxInbound > 0 ? node.inbound / snapshot.graph.maxInbound : 0;
          const minHeight = 118 + Math.round(scale * 52);

          return (
            <Link
              className={cx(getNodeBoxClass(node, snapshot.graph.maxInbound), isActive && "ring-1 ring-paper/60")}
              href={`/private/llm-wiki?view=wiki&kind=wiki&file=${encodeURIComponent(node.path)}`}
              key={node.path}
              style={{ minHeight }}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-paper">{node.title}</p>
                    <p className="mt-1 truncate font-mono text-[10px] text-paper/34">{node.path}</p>
                  </div>
                  <span className="shrink-0 border border-paper/10 bg-white/6 px-2 py-1 font-mono text-[10px] text-paper/58">
                    {node.inbound}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {outgoing.slice(0, 4).map((target) => (
                    <span
                      className="max-w-full truncate border border-paper/10 bg-black/24 px-2 py-1 font-mono text-[9px] text-paper/42"
                      key={`${node.path}-${target}`}
                    >
                      {nodeByPath.get(target)?.title ?? target}
                    </span>
                  ))}
                  {outgoing.length > 4 ? (
                    <span className="border border-paper/10 bg-black/24 px-2 py-1 font-mono text-[9px] text-paper/42">
                      +{outgoing.length - 4}
                    </span>
                  ) : null}
                </div>
                <div className="mt-auto pt-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/36">
                    {node.inbound} eingehend / {node.outbound} ausgehend
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SelectedEntryDialog({
  open,
  query,
  selected,
  wikiPaths,
}: {
  open: boolean;
  query: string;
  selected: WikiSnapshot["selected"];
  wikiPaths: Set<string>;
}) {
  const router = useRouter();
  const portalTarget = typeof document === "undefined" ? null : document.body;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function closeDialog() {
    const params = new URLSearchParams();
    params.set("view", "wiki");
    if (query) params.set("q", query);
    router.push(`/private/llm-wiki?${params.toString()}`);
  }

  if (!open || !portalTarget) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex bg-black/72 p-2 backdrop-blur-sm md:p-5" role="dialog" aria-modal="true">
      <div className="mx-auto flex max-h-full w-full max-w-6xl flex-col border border-paper/16 bg-ink shadow-2xl">
        <div className="flex flex-col gap-3 border-b border-paper/10 bg-black/28 px-4 py-4 md:flex-row md:items-start md:justify-between md:px-5">
          <div className="min-w-0">
            <p className="break-all font-mono text-[10px] uppercase tracking-[0.18em] text-paper/42">
              {selected.kind} / {selected.path}
            </p>
            <h2 className="mt-2 break-words font-display text-3xl leading-tight text-paper md:text-4xl">
              {selected.title}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="border border-paper/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/48">
              {formatBytes(selected.content.length)}
            </span>
            <button
              className="border border-paper/16 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/72 transition hover:bg-white/6 hover:text-paper"
              onClick={closeDialog}
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <MarkdownPreview content={selected.content} wikiPaths={wikiPaths} />

            {selected.canEdit && selected.kind !== "raw" ? (
              <details className="border border-paper/10 bg-black/20">
                <summary className="cursor-pointer px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-paper/58">
                  Edit Markdown
                </summary>
                <form action={saveWikiEntryAction} className="border-t border-paper/10 p-4">
                  <input name="kind" type="hidden" value={selected.kind} />
                  <input name="filePath" type="hidden" value={selected.path} />
                  <textarea
                    className="min-h-[50dvh] w-full resize-y border border-paper/12 bg-black/40 px-4 py-3 font-mono text-xs leading-6 text-paper outline-none focus:border-paper/36"
                    defaultValue={selected.content}
                    name="content"
                  />
                  <button
                    className="mt-3 border border-paper/16 bg-paper px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink transition hover:bg-white"
                    type="submit"
                  >
                    Save Markdown
                  </button>
                </form>
              </details>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    portalTarget
  );
}

export function LlmWikiWorkspace({ openEntryInModal, snapshot }: LlmWikiWorkspaceProps) {
  const wikiPaths = new Set(snapshot.files.map((file) => file.path));
  const selected = snapshot.selected;

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 pb-12 pt-6 md:px-8">
      <div className="mb-4 flex flex-col gap-4 border border-paper/10 bg-white/[0.045] p-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper/42">Private Tool</p>
          <h1 className="mt-2 font-display text-4xl leading-none text-paper md:text-5xl">LLM Wiki</h1>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex border border-paper/12 bg-black/24 p-1">
            <Link
              className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-paper/62 transition hover:bg-white/6 hover:text-paper"
              href="/private/llm-wiki"
            >
              Ingest
            </Link>
            <Link className="bg-paper px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink" href="/private/llm-wiki?view=wiki">
              View Wiki
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2 text-right">
            <div className="border border-paper/10 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/36">Wiki</p>
              <p className="mt-1 text-lg text-paper">{snapshot.stats.wikiCount}</p>
            </div>
            <div className="border border-paper/10 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/36">Raw</p>
              <p className="mt-1 text-lg text-paper">{snapshot.stats.rawCount}</p>
            </div>
            <div className="border border-paper/10 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/36">Updated</p>
              <p className="mt-1 text-xs text-paper/70">{formatDate(snapshot.stats.lastUpdated)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(360px,520px)_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="border border-paper/10 bg-white/[0.04]">
            <div className="border-b border-paper/10 bg-black/18 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/38">Browse</p>
              <h2 className="mt-1 font-display text-2xl leading-tight text-paper">Pages</h2>
            </div>
            <div className="space-y-4 p-3 md:p-4">
              <form action="/private/llm-wiki" className="space-y-2">
                <input name="view" type="hidden" value="wiki" />
                <label className="block font-mono text-[11px] uppercase tracking-[0.2em] text-paper/52" htmlFor="wiki-search">
                  Search
                </label>
                <div className="flex gap-2">
                  <input
                    className="min-w-0 flex-1 border border-paper/12 bg-black/35 px-3 py-2 text-sm text-paper outline-none focus:border-paper/36"
                    defaultValue={snapshot.query}
                    id="wiki-search"
                    name="q"
                    type="search"
                  />
                  <button
                    className="border border-paper/16 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-paper hover:bg-white/6"
                    type="submit"
                  >
                    Go
                  </button>
                </div>
              </form>

              <div className="grid grid-cols-3 gap-2">
                <Link
                  className="border border-paper/10 bg-black/20 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-paper/68 hover:bg-white/6"
                  href="/private/llm-wiki?view=wiki&kind=wiki&file=index.md"
                >
                  Index
                </Link>
                <Link
                  className="border border-paper/10 bg-black/20 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-paper/68 hover:bg-white/6"
                  href="/private/llm-wiki?view=wiki&kind=wiki&file=log.md"
                >
                  Log
                </Link>
                <Link
                  className="border border-paper/10 bg-black/20 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-paper/68 hover:bg-white/6"
                  href="/private/llm-wiki?view=wiki&kind=schema&file=schema.md"
                >
                  Schema
                </Link>
              </div>

              {snapshot.query ? (
                <div>
                  <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/52">Results</h2>
                  <SearchResults results={snapshot.searchResults} />
                </div>
              ) : null}
            </div>
          </div>

          <GroupedEntries entries={snapshot.files} selected={selected} title="Wiki Pages" />
          <GroupedEntries entries={snapshot.rawFiles} selected={selected} title="Raw Sources" />
        </section>

        <main className="min-w-0 space-y-4">
          <ForceDirectedGraph snapshot={snapshot} />
          <KnowledgeWeb snapshot={snapshot} />
        </main>
      </div>

      <SelectedEntryDialog open={openEntryInModal} query={snapshot.query} selected={selected} wikiPaths={wikiPaths} />
    </section>
  );
}
