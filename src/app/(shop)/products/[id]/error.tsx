"use client";

import { useRouter } from "next/navigation";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductError({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-forest-50 text-forest-700">
        <Leaf className="size-7" aria-hidden />
      </span>
      <h1 className="mt-5 text-xl font-bold text-charcoal">This harvest got misplaced</h1>
      <p className="mt-2 text-sm leading-relaxed text-graymute">
        The product you&apos;re looking for may have sold out for the day or the link is stale. Try again or browse today&apos;s fresh picks.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset} className="rounded-xl bg-forest-900 hover:bg-forest-800">
          Try again
        </Button>
        <Button variant="outline" onClick={() => router.push("/search")} className="rounded-xl border-forest-200 text-forest-800">
          Browse produce
        </Button>
      </div>
    </div>
  );
}
