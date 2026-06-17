import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { policyApi } from "@/lib/services";
import { Loader2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/policies/$type")({
  head: ({ params }) => {
    const formattedTitle = (params.type || "")
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return {
      meta: [
        { title: `${formattedTitle} — Aashansh` },
        { name: "description", content: `Read the official ${formattedTitle} of Aashansh e-commerce platform.` }
      ]
    };
  },
  component: PolicyPage,
});

function PolicyPage() {
  const { type } = Route.useParams();
  
  const { data: policy, isLoading, error } = useQuery({
    queryKey: ["policy", type],
    queryFn: () => policyApi.get(type),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-background text-center px-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-slate-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Policy Not Available</h1>
        <p className="text-slate-500 text-sm max-w-md">
          This policy is currently not available.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 md:py-16">
      <div className="container-page max-w-3xl">
        <header className="mb-8 pb-6 border-b border-slate-200">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            {policy.title}
          </h1>
          <p className="text-slate-500 text-xs md:text-sm">
            Last Updated: {new Date(policy.updatedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </header>
        
        <style>{`
          .policy-content-viewer a {
            color: #6366f1;
            text-decoration: underline;
          }
          .policy-content-viewer ul {
            list-style-type: disc;
            padding-left: 1.5rem;
            margin: 1rem 0;
          }
          .policy-content-viewer ol {
            list-style-type: decimal;
            padding-left: 1.5rem;
            margin: 1rem 0;
          }
          .policy-content-viewer li {
            display: list-item;
            margin: 0.5rem 0;
          }
          .policy-content-viewer h1 {
            font-size: 2rem;
            font-weight: 800;
            margin: 1.5rem 0 0.75rem 0;
          }
          .policy-content-viewer h2 {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 1.25rem 0 0.5rem 0;
          }
          .policy-content-viewer h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 1rem 0 0.5rem 0;
          }
          .policy-content-viewer p {
            margin: 0.75rem 0;
            line-height: 1.7;
          }
        `}</style>

        <article 
          className="prose prose-slate max-w-none text-slate-700 policy-content-viewer leading-relaxed select-text"
          dangerouslySetInnerHTML={{ __html: policy.content }}
        />
      </div>
    </div>
  );
}
