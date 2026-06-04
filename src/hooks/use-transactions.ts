import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { fetchTx, type Transaction } from "@/lib/goldbook";
import { supabase } from "@/lib/supabase";

export function useTransactions() {
  const { userId } = useAuth();
  const [tx, setTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setTx([]); setLoading(false); return; }

    setLoading(true);
    fetchTx(userId).then((data) => { setTx(data); setLoading(false); });

    const channel = supabase
      .channel(`tx-${userId}-${Math.random()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
        () => { fetchTx(userId).then(setTx); },
      )
      .subscribe();

    // Fallback: listen ke event manual dari insertTx/removeTx/patchTx
    const onUpdate = () => { fetchTx(userId).then(setTx); };
    window.addEventListener("goldbook:update", onUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("goldbook:update", onUpdate);
    };
  }, [userId]);

  return { tx, loading };
}
