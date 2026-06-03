import Link from "next/link";
import { ar } from "@/lib/i18n/ar";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold text-barber-gold">{ar.notFound.title}</h1>
      <Link href="/" className="mt-4 inline-block text-gray-400 hover:text-barber-gold">
        {ar.notFound.home}
      </Link>
    </div>
  );
}
