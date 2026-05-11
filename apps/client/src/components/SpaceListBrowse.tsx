"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Search } from "lucide-react";
import SpaceCard from "./SpaceCard";
import SpaceCategories from "./SpaceCategories";
import SpaceFilter from "./SpaceFilter";
import type { SpaceWithCategory, PaginationData } from "./SpaceList";
import type { BrowseSelection, BrowseTaxonomy } from "@/lib/taxonomy";

interface SpaceListBrowseProps {
  initialSpaces: SpaceWithCategory[];
  initialPagination: PaginationData;
  initialApiParams: string;
  taxonomy: BrowseTaxonomy;
  browseSelection: BrowseSelection;
}

const STORAGE_KEY_PREFIX = "spacefly_browse_";

export default function SpaceListBrowse({
  initialSpaces,
  initialPagination,
  initialApiParams,
  taxonomy,
  browseSelection,
}: SpaceListBrowseProps) {
  const searchParams = useSearchParams();
  const t = useTranslations("spaces");

  const [spaces, setSpaces] = useState(initialSpaces);
  const [page, setPage] = useState(initialPagination.page);
  const [total, setTotal] = useState(initialPagination.total);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialPagination.page < initialPagination.totalPages
  );

  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevParamsRef = useRef(searchParams.toString());
  const isLoadingRef = useRef(false);
  const apiParamsRef = useRef(initialApiParams);

  // Cache key based on current search params
  const cacheKey = STORAGE_KEY_PREFIX + searchParams.toString();

  // Restore from sessionStorage on mount (back-button support)
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const {
          spaces: cachedSpaces,
          page: cachedPage,
          total: cachedTotal,
          scrollY,
        } = JSON.parse(cached);
        if (cachedSpaces?.length > initialSpaces.length) {
          setSpaces(cachedSpaces);
          setPage(cachedPage);
          setTotal(cachedTotal);
          setHasMore(cachedSpaces.length < cachedTotal);
          // Restore scroll position after render
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollY || 0);
          });
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []); // Only on mount

  // Save to sessionStorage when spaces change
  useEffect(() => {
    if (spaces.length > 0) {
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            spaces,
            page,
            total,
            scrollY: window.scrollY,
          })
        );
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [spaces, page, total, cacheKey]);

  // Reset when search params change (filter applied)
  useEffect(() => {
    const currentParams = searchParams.toString();
    if (prevParamsRef.current !== currentParams) {
      prevParamsRef.current = currentParams;
      apiParamsRef.current = initialApiParams;
      // Server component will re-render with new initialSpaces
      setSpaces(initialSpaces);
      setPage(initialPagination.page);
      setTotal(initialPagination.total);
      setHasMore(initialPagination.page < initialPagination.totalPages);
    }
  }, [searchParams, initialSpaces, initialPagination, initialApiParams]);

  // Fetch next page using resolved API params (not raw browser searchParams)
  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const params = new URLSearchParams(apiParamsRef.current);
      params.set("page", String(nextPage));
      params.set("limit", "20");

      const url = `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const newSpaces = data.spaces || [];

      setSpaces((prev) => {
        // Deduplicate by id
        const existingIds = new Set(prev.map((s) => s.id));
        const unique = newSpaces.filter(
          (s: SpaceWithCategory) => !existingIds.has(s.id)
        );
        return [...prev, ...unique];
      });
      setPage(nextPage);
      setTotal(data.pagination?.total ?? total);
      setHasMore(nextPage < (data.pagination?.totalPages ?? 0));
    } catch (err) {
      console.error("Error loading more spaces:", err);
    } finally {
      isLoadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [hasMore, page, total]);

  // IntersectionObserver on sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  // Save scroll position before unload (for back-button)
  useEffect(() => {
    const handleScroll = () => {
      if (spaces.length > 0) {
        try {
          const existing = sessionStorage.getItem(cacheKey);
          if (existing) {
            const parsed = JSON.parse(existing);
            parsed.scrollY = window.scrollY;
            sessionStorage.setItem(cacheKey, JSON.stringify(parsed));
          }
        } catch {
          // Ignore
        }
      }
    };

    // Debounce scroll saving
    let timer: ReturnType<typeof setTimeout>;
    const debouncedScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(handleScroll, 200);
    };

    window.addEventListener("scroll", debouncedScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", debouncedScroll);
    };
  }, [spaces, cacheKey]);

  const shown = spaces.length;

  return (
    <>
      <SpaceCategories selection={browseSelection} taxonomy={taxonomy} />
      <SpaceFilter />

      {/* Results count */}
      {total > 0 && (
        <p className="text-sm text-muted mb-4">
          {t("showingResults", { shown, total })}
        </p>
      )}

      {spaces.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-subtle flex items-center justify-center">
            <Search className="w-8 h-8 text-muted" />
          </div>
          <p className="text-muted text-lg">{t("noSpacesFound")}</p>
          <p className="text-muted mt-2">{t("tryAdjusting")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>

          {/* Loading spinner */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-8 gap-2 text-muted">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">{t("loadingMore")}</span>
            </div>
          )}

          {/* End of results */}
          {!hasMore && spaces.length > 0 && (
            <p className="text-center text-sm text-muted py-8">
              {t("noMoreResults")}
            </p>
          )}

          {/* Sentinel for IntersectionObserver */}
          {hasMore && <div ref={sentinelRef} className="h-1" />}
        </>
      )}
    </>
  );
}
