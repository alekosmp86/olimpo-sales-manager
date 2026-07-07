import { useEffect, useRef } from "react";

interface UsePinchToZoomOptions {
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
}

/**
 * Custom hook to enable pinch-to-zoom multi-touch gestures on a target element.
 * Updates the zoom level proportionally relative to the touch-start state.
 */
export function usePinchToZoom(
  elementRef: React.RefObject<HTMLElement | null>,
  { zoomLevel, onZoomChange, minZoom = 0.5, maxZoom = 2.0 }: UsePinchToZoomOptions
) {
  const zoomLevelRef = useRef(zoomLevel);
  const onZoomChangeRef = useRef(onZoomChange);

  // Keep references fresh to avoid tear-down and re-registration of listeners
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let initialDist = 0;
    let initialZoom = 1.0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialZoom = zoomLevelRef.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDist > 0) {
        // Prevent default browser zoom/pinch behavior
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / initialDist;
        const targetZoom = Math.min(maxZoom, Math.max(minZoom, initialZoom * factor));
        onZoomChangeRef.current(Number(targetZoom.toFixed(2)));
      }
    };

    const handleTouchEnd = () => {
      initialDist = 0;
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [elementRef, minZoom, maxZoom]);
}
