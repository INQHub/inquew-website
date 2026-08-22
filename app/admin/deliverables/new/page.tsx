import { DeliverableForm } from "@/components/admin/deliverable-form";

export default function NewDeliverablePage() {
  return (
    <div className="max-w-[720px]">
      <h1 className="text-[28px] font-bold">New deliverable</h1>
      <div className="mt-6">
        <DeliverableForm />
      </div>
    </div>
  );
}
