"use client";

import { useRouter } from "next/navigation";
import AdminLogin from "@/components/AdminLogin";

export default function AdminGate() {
  const router = useRouter();

  return (
    <AdminLogin
      onSuccess={() => {
        router.refresh();
      }}
    />
  );
}
