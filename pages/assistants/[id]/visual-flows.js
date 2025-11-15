import React from "react";
import { useRouter } from "next/router";
import VisualFlowEditor from "../../../components/VisualFlowEditor";

export default function VisualFlowsPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id) {
    return <div className="p-4 text-gray-600">Loading…</div>;
  }

  return (
    <div className="h-screen bg-[#141A21]">
      <div className="h-full flex flex-col">
        <div className="flex-1">
          <VisualFlowEditor assistantId={id} router={router} />
        </div>
      </div>
    </div>
  );
}
