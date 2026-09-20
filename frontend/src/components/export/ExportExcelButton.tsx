import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExportExcelButtonProps {
  onExport: () => Promise<void>;
  disabled?: boolean;
  successMessage: string;
}

export function ExportExcelButton({
  onExport,
  disabled,
  successMessage,
}: ExportExcelButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleClick = async () => {
    setIsExporting(true);
    try {
      await onExport();
      toast.success(successMessage);
    } catch (error) {
      toast.error("Error al generar el archivo Excel");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={handleClick}
      disabled={disabled || isExporting}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="w-4 h-4" />
      )}
      Exportar Excel
    </Button>
  );
}
