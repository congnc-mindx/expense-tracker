import { useEffect, useState } from "react";

/** Progressive disclosure shared by every potentially long collection. */
export default function useIncrementalList(rows, dependencies = [], batch = 10) {
  const [limit,setLimit]=useState(batch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>setLimit(batch),[batch,...dependencies]);
  return { visible: rows.slice(0,limit), remaining: Math.max(0,rows.length-limit), count: Math.min(limit,rows.length),
    loadMore:()=>setLimit(n=>n+batch), reset:()=>setLimit(batch), batch };
}
