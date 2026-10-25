import Link from "next/link";
import { CaseStudyForm } from "@/components/admin/case-study-form";

export default function NewCaseStudyPage() {
  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/case-studies" className="text-[13.5px] font-semibold text-green">
          ← All case studies
        </Link>
        <h1 className="mt-2 text-[32px] font-bold">New case study</h1>
      </div>
      <CaseStudyForm />
    </div>
  );
}
