import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Star } from "lucide-react";
import PageHeader from "../components/PageHeader";
import PartCard from "../components/parts/PartCard";
import { getFavorites } from "../lib/favorites";

export default function FavoritesPage() {
  const [favoriteIds, setFavoriteIds] = useState(() => getFavorites());

  // Keep in sync when favorites change (e.g. toggled on Parts page)
  useEffect(() => {
    const handler = () => setFavoriteIds(getFavorites());
    window.addEventListener('favorites-changed', handler);
    return () => window.removeEventListener('favorites-changed', handler);
  }, []);

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ["parts"],
    queryFn: () => base44.entities.Part.list("-created_date", 2000),
    initialData: [],
  });

  const favoriteParts = parts.filter(p => favoriteIds.includes(p.id));

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <PageHeader title="Favorites" subtitle="Your saved parts">
        <div className="bg-white/20 rounded-full px-3 py-1 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-white fill-white" />
          <span className="text-white text-xs font-semibold">{favoriteParts.length}</span>
        </div>
      </PageHeader>

      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="text-center text-gray-400 py-16 text-sm">Loading...</div>
        ) : favoriteParts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Star className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-700 mb-1">No favourites yet</p>
            <p className="text-sm text-gray-400">
              Tap the star icon on any part in the Parts Finder to save it here for quick access on the job.
            </p>
          </div>
        ) : (
          <div className="px-4 py-3 space-y-3">
            {favoriteParts.map(part => (
              <PartCard key={part.id} part={part} allParts={parts} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}