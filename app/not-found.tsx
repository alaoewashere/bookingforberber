import Link from "next/link";
import { ar } from "@/lib/i18n/ar";

export default function NotFound() {
  return (
    <div className="px-2 py-12 text-center sm:py-16">
      <h1 className="y2k-heading">{ar.notFound.title}</h1>
      <Link href="/" className="y2k-btn-primary mt-6 inline-flex">
        {ar.notFound.home}
      </Link>
    </div>
  );
}
