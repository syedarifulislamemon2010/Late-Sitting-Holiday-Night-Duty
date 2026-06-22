import { useState, useEffect, useCallback } from "react";

interface FetchConfig {
  url: string;
  key: string;
}

export function usePageData<T extends Record<string, any>>(
  configs: FetchConfig[]
) {
  const [data, setData] = useState<Partial<T>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        configs.map((c) => fetch(c.url).then((r) => r.json()))
      );
      const mapped = configs.reduce((acc, config, i) => {
        acc[config.key as keyof T] = results[i];
        return acc;
      }, {} as Partial<T>);
      setData(mapped);
    } catch {
      setError("ডেটা লোড করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
    }
  }, [configs]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, isLoading, error, refetch: fetchAll };
}
