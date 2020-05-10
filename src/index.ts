import { RefObject, useState, useRef, useEffect, useCallback } from "react";

// FIXME: use correct URL
export const observerErr =
  "💡react-cool-dimensions: the browser doesn't support Resize Observer, please use polyfill: https://github.com/wellyshen/react-cool-dimensions#TBD";

interface Event {
  width?: number;
  height?: number;
  entry?: ResizeObserverEntry;
  observe?: () => void;
  unobserve?: () => void;
}
interface OnResize {
  (event?: Event): void;
}
interface Options {
  onResize?: OnResize;
}
interface Return {
  readonly width?: number;
  readonly height?: number;
  readonly entry?: ResizeObserverEntry;
  readonly observe: () => void;
  readonly unobserve: () => void;
}
interface State {
  width?: number;
  height?: number;
  entry?: ResizeObserverEntry;
}

const useDimensions = (
  ref: RefObject<HTMLElement>,
  { onResize }: Options = {}
): Return => {
  const [state, setState] = useState<State>({});
  const prevSizeRef = useRef<Omit<State, "entry">>({});
  const isObservingRef = useRef<boolean>(false);
  const observerRef = useRef<ResizeObserver>(null);
  const onResizeRef = useRef<OnResize>(null);

  useEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);

  const observe = useCallback((): void => {
    if (isObservingRef.current || !observerRef.current) return;

    observerRef.current.observe(ref.current);
    isObservingRef.current = true;
  }, [ref]);

  const unobserve = useCallback((): void => {
    if (!isObservingRef.current || !observerRef.current) return;

    observerRef.current.disconnect();
    isObservingRef.current = false;
  }, []);

  useEffect(() => {
    if (!ref || !ref.current) return (): void => null;

    if (!("ResizeObserver" in window) || !("ResizeObserverEntry" in window)) {
      console.error(observerErr);
      return (): void => null;
    }

    // eslint-disable-next-line compat/compat
    observerRef.current = new ResizeObserver(([entry]) => {
      const { contentBoxSize, contentRect } = entry;
      const width = contentBoxSize
        ? contentBoxSize.inlineSize
        : contentRect.width;
      const height = contentBoxSize
        ? contentBoxSize.blockSize
        : contentRect.height;

      if (
        width === prevSizeRef.current.width &&
        height === prevSizeRef.current.height
      )
        return;

      prevSizeRef.current = { width, height };

      if (onResizeRef.current)
        onResizeRef.current({ width, height, entry, observe, unobserve });

      setState({ width, height, entry });
    });

    observe();

    return (): void => {
      unobserve();
    };
  }, [ref, onResize, observe, unobserve]);

  return { ...state, observe, unobserve };
};

export default useDimensions;
