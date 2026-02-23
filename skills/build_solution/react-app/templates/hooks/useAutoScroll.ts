import { useRef, useCallback, useEffect } from 'react';

interface UseAutoScrollOptions {
  behavior?: ScrollBehavior;
  threshold?: number;
  enabled?: boolean;
}

export function useAutoScroll<T extends HTMLElement>({
  behavior = 'smooth',
  threshold = 50,
  enabled = true,
}: UseAutoScrollOptions = {}) {
  const scrollRef = useRef<T>(null);
  const isAtBottomRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  }, [behavior]);

  const checkIsAtBottom = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < threshold;
      return isAtBottomRef.current;
    }
    return true;
  }, [threshold]);

  const handleScroll = useCallback(() => {
    checkIsAtBottom();
  }, [checkIsAtBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToBottomIfAtBottom = useCallback(() => {
    if (enabled && isAtBottomRef.current) {
      scrollToBottom();
    }
  }, [enabled, scrollToBottom]);

  return {
    scrollRef,
    scrollToBottom,
    scrollToBottomIfAtBottom,
    isAtBottom: () => isAtBottomRef.current,
  };
}
