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
      className={cn("panel grid gap-4 p-4 sm:grid-cols-[7rem_1fr]", className)}
    >
      <div className="w-28 overflow-hidden rounded-control">
        <GiftPhoto src={image || null} alt={product.title ?? "Produit"} />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <p className="eyebrow">{product.brand ?? "Marque inconnue"}</p>
        <h4 className="title-card">{product.title ?? "Produit sans titre"}</h4>
        <GiftPrice
          price={product.price}
          oldPrice={product.old_price}
          currency={product.currency ?? "EUR"}
        />
        <dl className="text-footnote mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-ink-soft">
          <dt className="font-semibold">Disponibilité</dt>
          <dd>
            {availability}
            {product.stock ? ` · ${product.stock}` : ""}
          </dd>
          {product.category ? (
            <>
              <dt className="font-semibold">Catégorie</dt>
              <dd className="truncate">{product.category}</dd>
            </>
          ) : null}
          {product.sku ? (
            <>
              <dt className="font-semibold">Référence</dt>
              <dd className="truncate">{product.sku}</dd>
            </>
          ) : null}
        </dl>
      </div>
    </article>
  );
}
