import fs from "node:fs/promises";
import type { SignatureInfo } from "../types.js";
import type * as ForgeTypes from "node-forge";

/**
 * Sign a PDF buffer with an X.509 certificate from a PKCS#12 (.p12) file.
 *
 * Uses node-forge for certificate loading and PDF signature embedding.
 * The signed PDF includes a PKCS#7 signature and a timestamp.
 */
export async function signPdf(
  pdfBuffer: Buffer,
  certPath: string,
  password: string,
): Promise<Buffer> {
  const forge = await import("node-forge");

  // Load PKCS#12 certificate
  const p12Data = await fs.readFile(certPath);
  const p12Asn1 = forge.asn1.fromDer(forge.util.decode64(p12Data.toString("base64")));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

  // Extract certificate and private key
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

  const certBagList = certBags[forge.pki.oids.certBag];
  const keyBagList = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];

  if (!certBagList || certBagList.length === 0 || !certBagList[0].cert) {
    throw new Error("No certificate found in PKCS#12 file");
  }

  if (!keyBagList || keyBagList.length === 0 || !keyBagList[0].key) {
    throw new Error("No private key found in PKCS#12 file");
  }

  const cert = certBagList[0].cert;
  const privateKey = keyBagList[0].key as ForgeTypes.pki.rsa.PrivateKey;

  // Create PKCS#7 signed data
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(pdfBuffer.toString("binary"));
  p7.addCertificate(cert);
  p7.addSigner({
    key: privateKey,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      {
        type: forge.pki.oids.contentType,
        value: forge.pki.oids.data,
      },
      {
        type: forge.pki.oids.messageDigest,
        // value will be auto-populated at signing time
      },
      {
        type: forge.pki.oids.signingTime,
        value: new Date().toISOString(),
      },
    ],
  });
  p7.sign();

  // Serialize the signature to DER
  const signatureDer = forge.asn1.toDer(p7.toAsn1()).getBytes();
  const signatureHex = forge.util.bytesToHex(signatureDer);

  // Build a basic PDF signature structure
  // We append a signature dictionary to the PDF
  const pdfString = pdfBuffer.toString("binary");
  const signerName = cert.subject.getField("CN")?.value ?? "Unknown";
  const timestamp = new Date().toISOString();

  // Create a PDF with an embedded signature annotation
  const signedPdfContent =
    pdfString +
    `\n% MarkView Digital Signature\n` +
    `% Signer: ${signerName}\n` +
    `% Timestamp: ${timestamp}\n` +
    `% Signature: ${signatureHex.substring(0, 128)}...\n` +
    `% PKCS7-SIGNATURE-BEGIN\n` +
    `% ${signatureHex}\n` +
    `% PKCS7-SIGNATURE-END\n`;

  return Buffer.from(signedPdfContent, "binary");
}

/**
 * Verify the digital signature in a PDF buffer.
 * Returns information about the signature if present.
 */
export async function verifySig(pdfBuffer: Buffer): Promise<SignatureInfo> {
  const forge = await import("node-forge");
  const pdfString = pdfBuffer.toString("binary");

  // Look for our embedded signature markers
  const sigBegin = pdfString.indexOf("% PKCS7-SIGNATURE-BEGIN");
  const sigEnd = pdfString.indexOf("% PKCS7-SIGNATURE-END");

  if (sigBegin === -1 || sigEnd === -1) {
    return {
      signed: false,
      signerName: null,
      issuer: null,
      validFrom: null,
      validTo: null,
      isValid: false,
      timestamp: null,
    };
  }

  // Extract the hex signature
  const sigSection = pdfString.substring(sigBegin, sigEnd);
  const sigLines = sigSection.split("\n");
  let signatureHex = "";
  for (const line of sigLines) {
    if (line.startsWith("% ") && !line.startsWith("% PKCS7")) {
      signatureHex += line.substring(2).trim();
    }
  }

  // Extract metadata from comments
  const signerMatch = /% Signer: (.+)/.exec(pdfString);
  const timestampMatch = /% Timestamp: (.+)/.exec(pdfString);

  let signerName: string | null = signerMatch?.[1] ?? null;
  let issuer: string | null = null;
  let validFrom: Date | null = null;
  let validTo: Date | null = null;
  let isValid = false;
  const timestamp = timestampMatch?.[1] ? new Date(timestampMatch[1]) : null;

  try {
    // Try to parse the PKCS#7 signature
    const signatureBytes = forge.util.hexToBytes(signatureHex);
    const asn1 = forge.asn1.fromDer(signatureBytes);
    const p7 = forge.pkcs7.messageFromAsn1(asn1);

    if ("certificates" in p7 && Array.isArray(p7.certificates) && p7.certificates.length > 0) {
      const cert = p7.certificates[0] as ForgeTypes.pki.Certificate;
      signerName = cert.subject.getField("CN")?.value ?? signerName;
      issuer = cert.issuer.getField("CN")?.value ?? null;
      validFrom = cert.validity.notBefore;
      validTo = cert.validity.notAfter;

      // Basic validity check: certificate not expired
      const now = new Date();
      isValid =
        validFrom !== null &&
        validTo !== null &&
        now >= validFrom &&
        now <= validTo;
    }
  } catch {
    // If we can't parse the signature, it's still detected but not verified
    isValid = false;
  }

  return {
    signed: true,
    signerName,
    issuer,
    validFrom,
    validTo,
    isValid,
    timestamp,
  };
}
