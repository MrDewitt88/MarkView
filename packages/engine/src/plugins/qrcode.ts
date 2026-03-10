import QRCode from "qrcode";

/**
 * Generate an SVG QR code for the given URL.
 * Returns a self-contained SVG string.
 */
export async function generateQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 1,
    width: 80,
    errorCorrectionLevel: "M",
  });
}
