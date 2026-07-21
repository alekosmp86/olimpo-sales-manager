"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface AutoDirectionResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showUpward: boolean;
  toggleOpen: () => void;
  closeDropdown: () => void;
  updateDirection: () => void;
}

/**
 * Custom hook that manages dropdown open state and automatically calculates
 * whether to render upward or downward based on viewport position.
 */
export function useAutoDirection(thresholdHeight: number = 180): AutoDirectionResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showUpward, setShowUpward] = useState(false);

  const updateDirection = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setShowUpward(spaceBelow < thresholdHeight);
    }
  }, [thresholdHeight]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updateDirection();

    const handleWindowChange = () => {
      updateDirection();
    };

    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
    };
  }, [isOpen, updateDirection]);

  const toggleOpen = useCallback(() => {
    if (!isOpen) {
      updateDirection();
    }
    setIsOpen((previousOpenState) => !previousOpenState);
  }, [isOpen, updateDirection]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    containerRef,
    isOpen,
    setIsOpen,
    showUpward,
    toggleOpen,
    closeDropdown,
    updateDirection,
  };
}
