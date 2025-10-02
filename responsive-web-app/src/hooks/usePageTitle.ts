import { useEffect, useRef } from 'react';

interface UsePageTitleOptions {
  suffix?: string;
  separator?: string;
  restoreOnUnmount?: boolean;
}

/**
 * Hook to manage document title
 * @param title - The page title to set
 * @param options - Configuration options
 */
export const usePageTitle = (
  title: string, 
  options: UsePageTitleOptions = {}
): void => {
  const {
    suffix = 'Business Management',
    separator = ' | ',
    restoreOnUnmount = true
  } = options;

  const prevTitleRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Store the previous title on first run
    if (prevTitleRef.current === undefined) {
      prevTitleRef.current = document?.title || '';
    }

    // Set the new title
    const newTitle = title ? `${title}${separator}${suffix}` : suffix;
    document.title = newTitle;

    // Cleanup function to restore previous title
    return () => {
      if (restoreOnUnmount && prevTitleRef.current !== undefined) {
        document.title = prevTitleRef.current;
      }
    };
  }, [title, suffix, separator, restoreOnUnmount]);
};

/**
 * Hook to manage document meta tags
 * @param meta - Object containing meta tag key-value pairs
 */
export const useDocumentMeta = (meta: Record<string, string>): void => {
  useEffect(() => {
    const metaElements: HTMLMetaElement[] = [];

    // Set meta tags
    Object.entries(meta).forEach(([name, content]) => {
      let metaElement = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      
      if (!metaElement) {
        metaElement = document.createElement('meta');
        metaElement.name = name;
        document.head.appendChild(metaElement);
        metaElements.push(metaElement);
      }
      
      metaElement.content = content;
    });

    // Cleanup function to remove created meta tags
    return () => {
      metaElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    };
  }, [meta]);
};

/**
 * Hook to manage browser history navigation
 */
export const useNavigationHistory = () => {
  const canGoBack = window.history.length > 1;

  const goBack = () => {
    if (canGoBack) {
      window.history.back();
    }
  };

  const goForward = () => {
    window.history.forward();
  };

  const go = (delta: number) => {
    window.history.go(delta);
  };

  return {
    canGoBack,
    goBack,
    goForward,
    go
  };
};

/**
 * Combined hook for page management
 * @param title - Page title
 * @param meta - Meta tags object
 * @param options - Title options
 */
export const usePage = (
  title: string,
  meta: Record<string, string> = {},
  options: UsePageTitleOptions = {}
) => {
  usePageTitle(title, options);
  useDocumentMeta(meta);
  
  const navigation = useNavigationHistory();
  
  return navigation;
};

export default usePageTitle;