import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeDisplayProps {
  value: string;
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
}

export default function BarcodeDisplay({
  value,
  format = "CODE128",
  width = 2,
  height = 100,
  displayValue = true,
  className = "",
}: BarcodeDisplayProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format: format,
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: 14,
          margin: 10,
        });
      } catch (error) {
        console.error("Error generating barcode:", error);
      }
    }
  }, [value, format, width, height, displayValue]);

  return (
    <div className={`flex justify-center ${className}`}>
      <svg ref={barcodeRef}></svg>
    </div>
  );
}
