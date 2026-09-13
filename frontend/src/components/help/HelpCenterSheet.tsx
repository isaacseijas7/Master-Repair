import { useLocation } from "react-router-dom";
import { CircleHelp, PlayCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getGuidesForPath } from "@/lib/tour/registry";
import { useTourRunner } from "@/lib/tour/useTourRunner";

interface HelpCenterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpCenterSheet({ open, onOpenChange }: HelpCenterSheetProps) {
  const location = useLocation();
  const { startTour } = useTourRunner();
  const guides = getGuidesForPath(location.pathname);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CircleHelp className="h-5 w-5 text-blue-600" />
            Centro de ayuda
          </SheetTitle>
          <SheetDescription>
            Guías paso a paso para la sección en la que estás.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          {guides.length === 0 ? (
            <p className="text-sm text-gray-500">
              Ayuda para esta sección próximamente.
            </p>
          ) : (
            guides.map((guide) => (
              <div key={guide.id} className="rounded-lg border border-gray-200 p-4">
                <p className="font-medium text-gray-900">{guide.title}</p>
                <p className="mt-1 text-sm text-gray-500">{guide.description}</p>
                <Button
                  size="sm"
                  className="mt-3 gap-2"
                  onClick={() => {
                    onOpenChange(false);
                    startTour(guide);
                  }}
                >
                  <PlayCircle className="h-4 w-4" />
                  Comenzar
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
