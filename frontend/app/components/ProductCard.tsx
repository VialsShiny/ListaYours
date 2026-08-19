import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type ProductCardProps = {
  json: any;
  className?: string;
  [key: string]: any;
}

const formatPrice = (value: number, currency?: string) => {
  const safeCurrency = currency || "EUR"
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: safeCurrency,
  }).format(value)
}

export default function ProductCard({ json, className, ...props }: ProductCardProps) {
  const product = json ?? {}
  const imageUrl = product.images?.[0] ?? "https://placehold.co/600x600/f8fafc/0f172a?text=Image"
  const price = Number(product.price ?? 0)
  const oldPrice = Number(product.old_price ?? 0)
  const isAvailable = Boolean(product.availability)
  const rating = Number(product.reviews?.rating_average ?? 0)
  const reviewCount = Number(product.reviews?.review_count ?? 0)
  const characteristics = Object.entries(product.characteristics ?? {}).slice(0, 4)
  const colors = product.variants?.color ?? []
  const variants = [
    ...(product.variants?.size ?? []),
    ...(product.variants?.style ?? []),
  ]

  return (
    <Card
      className={[
        "overflow-hidden rounded-[28px] border border-sky-100 bg-white shadow-[0_20px_50px_rgba(14,116,144,0.08)]",
        className,
      ].join(" ")}
      {...props}
    >
      <CardHeader className="gap-3 border-b border-sky-100 bg-linear-to-r from-sky-50 via-white to-sky-50 px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-600">
              {product.brand ?? "Marque"}
            </p>
            <CardTitle className="text-xl font-semibold leading-snug text-slate-900">
              {product.title ?? "Produit"}
            </CardTitle>
          </div>

          {product.discount ? (
            <CardAction className="rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm shadow-rose-200">
              {product.discount}
            </CardAction>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardDescription className="text-sm text-slate-600">
            {product.category ?? "Null"}
          </CardDescription>

          <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            <span>★</span>
            <span>{rating ? rating.toFixed(1) : "N/A"}</span>
            <span className="text-amber-500">({reviewCount})</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="gap-5 px-5 py-5">
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="w-full overflow-hidden rounded-2xl border border-sky-100 bg-sky-50 p-3 lg:w-[38%]">
            <img
              src={imageUrl}
              alt={product.title ?? "Produit"}
              className="h-64 w-full rounded-xl object-contain md:h-72"
            />
          </div>

          <div className="flex w-full flex-col justify-between gap-4 lg:w-[62%]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                    isAvailable
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-rose-200 bg-rose-50 text-rose-700",
                  ].join(" ")}
                >
                  {isAvailable ? "En stock" : "Rupture de stock"}
                </span>
                {product.stock ? (
                  <span className="text-xs uppercase tracking-[0.12em] text-slate-400">{product.stock}</span>
                ) : null}
              </div>

              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  {formatPrice(price, product.currency)}
                </span>
                {oldPrice > 0 && oldPrice > price ? (
                  <span className="pb-1 text-sm text-slate-400 line-through">
                    {formatPrice(oldPrice, product.currency)}
                  </span>
                ) : null}
              </div>

              <p className="text-sm leading-6 text-slate-600">
                {product.description ?? "Description du produit indisponible."}
              </p>
            </div>

            {characteristics.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {characteristics.map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{key}</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{String(value)}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>

      {(colors.length > 0 || variants.length > 0) ? (
        <div className="border-t border-sky-100 bg-sky-50/60 px-5 py-4">
          {colors.length > 0 ? (
            <div className="mb-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Couleurs
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color: string) => (
                  <span
                    key={color}
                    className="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-xs font-medium text-sky-700"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {variants.length > 0 ? (
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Variantes
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <span
                    key={variant}
                    className="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-xs font-medium text-sky-700"
                  >
                    {variant}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <CardFooter className="flex items-center justify-between border-t border-sky-100 bg-white px-5 py-4">
        <div className="text-xs text-slate-500">
          {product.sku ? `SKU: ${product.sku}` : "SKU non disponible"}
        </div>

        <a
          href={product.product_url ?? product.canonical_url ?? product.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
        >
          Voir le produit
        </a>
      </CardFooter>
    </Card>
  )
}