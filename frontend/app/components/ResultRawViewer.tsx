import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

type ResultRawViewerProps = {
  json: any;
  className?: string;
  [key: string]: any;
};
  
export default function ResultRawViewer({ json, className, ...props }: ResultRawViewerProps) {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline" />}>Voir l'original</DrawerTrigger>
      <DrawerContent
        className={className ?? "my-4 w-[min(96vw,1200px)] max-w-6xl rounded-l-3xl border border-sky-100 bg-white shadow-2xl shadow-sky-100/70"}
        style={{
          ["--drawer-content-width" as string]: "min(96vw, 1200px)",
          ...props.style,
        }}
        {...props}
      >
        <DrawerHeader className="border-b border-sky-100 bg-linear-to-r from-sky-50 to-white px-6 py-5">
          <DrawerTitle className="text-lg font-semibold text-slate-900">Résultat brut</DrawerTitle>
          <DrawerDescription className="text-sm text-slate-600">
            Données brutes renvoyées par l’API, affichées dans un format lisible.
          </DrawerDescription>
        </DrawerHeader>

        {json ? (
          <pre className="flex-1 overflow-auto bg-white px-6 py-5 text-[11px] leading-6 text-slate-700">
            {JSON.stringify(json, null, 2)}
          </pre>
        ) : (
          <p className="px-6 py-8 text-sm text-slate-500">Aucune donnée disponible.</p>
        )}

        <DrawerFooter className="border-t border-sky-100 bg-sky-50/60 px-6 py-4">
          <DrawerClose render={<Button className="bg-sky-600 text-white hover:bg-sky-700">Fermer</Button>} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}