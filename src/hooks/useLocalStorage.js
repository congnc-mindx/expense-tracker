import { useState, useEffect, useCallback } from "react";

export function useLocalStorage(key, initialValue) {
  const read = useCallback(() => {
    const raw = window.localStorage.getItem(key);
    return raw === null ? initialValue : JSON.parse(raw);
  }, [key, initialValue]);
  const [state, setState] = useState(() => {
    try {
      return { value: read(), error: "" };
    } catch {
      return {
        value: initialValue,
        error:
          "Không đọc được dữ liệu đã lưu. Hãy sao lưu dữ liệu trước khi tiếp tục.",
      };
    }
  });
  const setValue = useCallback(
    (value) => {
      // Đọc bản mới nhất; chỉ cập nhật UI sau khi ghi thành công.
      const previous = read();
      const next = typeof value === "function" ? value(previous) : value;
      window.localStorage.setItem(key, JSON.stringify(next));
      setState({ value: next, error: "" });
      return next;
    },
    [key, read],
  );
  useEffect(() => {
    const sync = (event) => {
      if (event.key !== key && event.key !== null) return;
      try {
        setState({ value: read(), error: "" });
      } catch {
        setState((previous) => ({
          ...previous,
          error: "Không đọc được dữ liệu cập nhật từ tab khác.",
        }));
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [key, read]);
  return [state.value, setValue, state.error];
}
