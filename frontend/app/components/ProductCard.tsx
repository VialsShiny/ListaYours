import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type ProductCardProps = {
  json: any;
  className?: string;
  [key: string]: any;
}

export default function ProductCard({ json, className, ...props }: ProductCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{json.title}</CardTitle>
        <CardDescription>{json.description}</CardDescription>
        <CardAction>{json.discount}</CardAction>
      </CardHeader>
      <CardContent>
        <img src={json.images[0]} alt={json.title} className="mt-2 rounded-lg object-contain size-56" />
        <strong className="text-xl">{json.price}</strong>
        {json.old_price && <span className="line-through text-sm text-muted-foreground">{json.old_price}</span>}
      </CardContent>
      <CardFooter>
        {json.variants.size && json.variants.size.map((size: string) => (
          <span key={size} className="mr-2 w-16 rounded-full border border-slate-300 px-2 py-1 text-sm text-slate-700">{size}</span>
        ))}
      </CardFooter>
    </Card>
  )
}