import { useCallback, useEffect, useRef, useState } from "react";

interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface PanZoomOptions {
  minScale?: number;
  maxScale?: number;
  zoomSpeed?: number;
  edgePadding?: number;
}

export const usePanZoom = ({
  minScale = 0.3,
  maxScale = 3,
  zoomSpeed = 0.0015,
  edgePadding = 120,
}: PanZoomOptions = {}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);

  const stateRef = useRef({
    panStart: { x: 0, y: 0, tx: 0, ty: 0 },
    pinchStart: { dist: 0, scale: 1, midX: 0, midY: 0, tx: 0, ty: 0 },
    activeTouches: 0,
  });

  const clampScale = (s: number) => Math.min(maxScale, Math.max(minScale, s));

  // Clamp pan so the content always overlaps the viewport by at least edgePadding px
  const clampPan = useCallback(
    (x: number, y: number, scale: number) => {
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return { x, y };

      const cw = container.clientWidth;
      const ch = container.clientHeight;
      // Natural (untransformed) size of the content
      const naturalW = content.offsetWidth;
      const naturalH = content.offsetHeight;
      const scaledW = naturalW * scale;
      const scaledH = naturalH * scale;

      // Horizontal: content is flex-centered when x=0, so range is symmetric
      const maxX = Math.max(0, scaledW / 2 + cw / 2 - edgePadding);
      // Vertical: content starts at top (y=0). It can be pushed down by (ch - edgePadding)
      // and pulled up so only edgePadding remains visible at the bottom.
      const minY = Math.min(0, -(scaledH - edgePadding));
      const maxY = Math.max(0, ch - edgePadding);

      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(minY, y)),
      };
    },
    [edgePadding],
  );

  const zoomAt = useCallback(
    (clientX: number, clientY: number, deltaScale: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setTransform((t) => {
        const newScale = clampScale(t.scale * deltaScale);
        const actualDelta = newScale / t.scale;
        const px = clientX - rect.left;
        const py = clientY - rect.top;
        const nx = px - (px - t.x) * actualDelta;
        const ny = py - (py - t.y) * actualDelta;
        const clamped = clampPan(nx, ny, newScale);
        return { scale: newScale, ...clamped };
      });
    },
    [minScale, maxScale, clampPan],
  );

  const reset = useCallback(() => setTransform({ x: 0, y: 0, scale: 1 }), []);

  const zoomIn = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.2);
  }, [zoomAt]);

  const zoomOut = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / 1.2);
  }, [zoomAt]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      // Ctrl/⌘ + wheel = zoom (always consume).
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = Math.exp(-e.deltaY * zoomSpeed);
        zoomAt(e.clientX, e.clientY, delta);
      }
      // If no modifier key, do nothing! This allows standard mouse wheels 
      // and trackpad two-finger scrolls to scroll the entire web page natively.
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("button, a, input, select, textarea")) return;
      e.preventDefault();
      setIsPanning(true);
      stateRef.current.panStart = {
        x: e.clientX,
        y: e.clientY,
        tx: transform.x,
        ty: transform.y,
      };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      const { panStart } = stateRef.current;
      setTransform((t) => {
        const nx = panStart.tx + (e.clientX - panStart.x);
        const ny = panStart.ty + (e.clientY - panStart.y);
        return { ...t, ...clampPan(nx, ny, t.scale) };
      });
    };

    const onMouseUp = () => setIsPanning(false);

    const dist = (a: Touch, b: Touch) =>
      Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

    const onTouchStart = (e: TouchEvent) => {
      stateRef.current.activeTouches = e.touches.length;
      if (e.touches.length === 1) {
        const t0 = e.touches[0];
        stateRef.current.panStart = {
          x: t0.clientX,
          y: t0.clientY,
          tx: transform.x,
          ty: transform.y,
        };
      } else if (e.touches.length === 2) {
        const [t0, t1] = [e.touches[0], e.touches[1]];
        stateRef.current.pinchStart = {
          dist: dist(t0, t1),
          scale: transform.scale,
          midX: (t0.clientX + t1.clientX) / 2,
          midY: (t0.clientY + t1.clientY) / 2,
          tx: transform.x,
          ty: transform.y,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && stateRef.current.activeTouches === 1) {
        e.preventDefault();
        const t0 = e.touches[0];
        const { panStart } = stateRef.current;
        setTransform((t) => {
          const nx = panStart.tx + (t0.clientX - panStart.x);
          const ny = panStart.ty + (t0.clientY - panStart.y);
          return { ...t, ...clampPan(nx, ny, t.scale) };
        });
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const [t0, t1] = [e.touches[0], e.touches[1]];
        const newDist = dist(t0, t1);
        const { pinchStart } = stateRef.current;
        const containerEl = containerRef.current;
        if (!containerEl || pinchStart.dist === 0) return;
        const rect = containerEl.getBoundingClientRect();
        const newScale = clampScale(
          (pinchStart.scale * newDist) / pinchStart.dist,
        );
        const actualDelta = newScale / pinchStart.scale;
        const px = pinchStart.midX - rect.left;
        const py = pinchStart.midY - rect.top;
        const nx = px - (px - pinchStart.tx) * actualDelta;
        const ny = py - (py - pinchStart.ty) * actualDelta;
        const clamped = clampPan(nx, ny, newScale);
        setTransform({ scale: newScale, ...clamped });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      stateRef.current.activeTouches = e.touches.length;
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);

    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [isPanning, transform.x, transform.y, transform.scale, zoomAt, clampPan, minScale, maxScale, zoomSpeed]);

  // When content size changes (generations expand/collapse), re-clamp current position
  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      setTransform((t) => ({ ...t, ...clampPan(t.x, t.y, t.scale) }));
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, [clampPan]);

  const panToElement = useCallback(
    (elementId: string) => {
      // Use a short delay so the DOM has time to render the new nodes and ResizeObserver updates clampPan bounds
      setTimeout(() => {
        const container = containerRef.current;
        const content = contentRef.current;
        if (!container || !content) return;

        const el = document.getElementById(elementId);
        if (!el) return;

        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        content.style.transition = "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)";

        setTransform((t) => {
          // Current center of the element on screen
          const elCenterX = elRect.left + elRect.width / 2;
          // Target horizontal center of the viewport
          const targetX = containerRect.left + containerRect.width / 2;
          // How much we need to shift the screen horizontally to align them
          const deltaX = targetX - elCenterX;

          // Target vertical position (20% down from the top of the viewport)
          const elTop = elRect.top;
          const targetY = containerRect.top + containerRect.height * 0.2;
          // How much we need to shift vertically
          const deltaY = targetY - elTop;

          return { scale: t.scale, ...clampPan(t.x + deltaX, t.y + deltaY, t.scale) };
        });

        setTimeout(() => {
          if (contentRef.current) {
            contentRef.current.style.transition = "";
          }
        }, 500);
      }, 60);
    },
    [clampPan],
  );

  return {
    containerRef,
    contentRef,
    transform,
    isPanning,
    zoomIn,
    zoomOut,
    reset,
    panToElement,
  };
};
