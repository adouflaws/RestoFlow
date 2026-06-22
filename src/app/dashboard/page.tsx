import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: link } = await supabase
    .from("restaurant_users")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (link?.restaurant_id) {
    redirect(`/${link.restaurant_id}/commandes`);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f8f9fa] px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
          <svg
            className="h-7 w-7 text-orange-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">
          Aucun restaurant configuré
        </h1>
        <p className="text-[14px] leading-relaxed text-gray-500">
          Votre compte n&apos;est associé à aucun restaurant.
          <br />
          Contactez l&apos;administrateur pour être ajouté.
        </p>
      </div>
    </div>
  );
}
