import { GiftPhoto } from "@/components/wishlist/GiftPhoto";
import { GiftPrice } from "@/components/wishlist/GiftPrice";
import { firstImage } from "@/lib/gift-prefill";
import type { ProductData } from "@/lib/types";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: ProductData;
  className?: string;
};

/**
 * Preview of a scraped product shown next to the owner's add-gift form.
 */
export default function ProductCard({ product, className }: ProductCardProps) {
  const image = firstImage(product);
  const availability =
    product.availability === null || product.availability === undefined
      ? "Disponibilité inconnue"
      : product.availability
        ? "En stock"
        : "Indisponible";

  return (
    <article
      aria-label="Aperçu du produit analysé"
      className={cn("grid gap-4 bg-white p-4 shadow-soft sm:grid-cols-[7rem_1fr]", className)}
    >
      <div className="w-28">
        <GiftPhoto src={image || null} alt={product.title ?? "Produit"} restGrey={false} />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <p className="micro text-ink-soft">{product.brand ?? "Marque inconnue"}</p>
        <h4 className="display text-xl leading-tight">{product.title ?? "Produit sans titre"}</h4>
        <GiftPrice
          price={product.price}
          oldPrice={product.old_price}
          currency={product.currency ?? "EUR"}
        />
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs text-ink-soft">
          <dt className="micro">Disponibilité</dt>
          <dd>
            {availability}
            {product.stock ? ` · ${product.stock}` : ""}
          </dd>
          {product.category ? (
            <>
              <dt className="micro">Catégorie</dt>
              <dd className="truncate">{product.category}</dd>
            </>
          ) : null}
          {product.sku ? (
            <>
              <dt className="micro">Référence</dt>
              <dd className="truncate">{product.sku}</dd>
            </>
          ) : null}
        </dl>
      </div>
    </article>
  );
}
