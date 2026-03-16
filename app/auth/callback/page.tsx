"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      // getSession handles the code-to-session exchange automatically 
      // in the browser client
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error loading session:", error.message);
        router.push("/login");
        return;
      }

      if (data.session) {
        router.push("/add-book");
      } else {
        // If no session is found, send them back to login
        router.push("/login");
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Finalizing login, please wait...</p>
    </div>
  );
}