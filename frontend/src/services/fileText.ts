const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "csv",
  "tsv",
  "json",
  "jsonl",
  "xml",
  "html",
  "htm",
  "css",
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "java",
  "c",
  "cpp",
  "cs",
  "r",
  "sql",
  "yaml",
  "yml",
  "log",
]);

type ZipEntry = {
  name: string;
  method: number;
  compressed: Uint8Array;
};

export async function extractTextFromFile(file: File): Promise<string> {
  const extension = getExtension(file.name);
  const mimeType = file.type.toLowerCase();

  if (TEXT_EXTENSIONS.has(extension) || mimeType.startsWith("text/")) {
    return cleanExtractedText(await file.text(), extension);
  }

  if (extension === "docx" || extension === "pptx" || extension === "xlsx") {
    return extractOpenXmlText(await file.arrayBuffer(), extension);
  }

  if (extension === "pdf" || mimeType === "application/pdf") {
    const text = await extractBestEffortPdfText(await file.arrayBuffer());
    if (isReadableExtractedText(text)) return text;
    throw new Error("This PDF does not expose readable text in the browser. Try exporting it as .txt or .docx, or paste the text directly.");
  }

  throw new Error("Unsupported file type. Try .txt, .md, .csv, .json, .html, .docx, .pptx, .xlsx, or a text-based code file.");
}

function getExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() || "";
}

function cleanExtractedText(text: string, extension: string) {
  if (extension === "html" || extension === "htm" || extension === "xml") {
    return stripMarkup(text);
  }
  if (extension === "json" || extension === "jsonl") {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }
  return normalizeWhitespace(text);
}

async function extractOpenXmlText(buffer: ArrayBuffer, extension: "docx" | "pptx" | "xlsx") {
  const entries = await readZipEntries(buffer);
  const xmlFiles = await Promise.all(
    entries
      .filter((entry) => isUsefulOpenXmlEntry(entry.name, extension))
      .map(async (entry) => ({ name: entry.name, text: decodeUtf8(await inflateZipEntry(entry)) }))
  );

  const ordered = xmlFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const text = ordered.map((file) => openXmlToText(file.text)).filter(Boolean).join("\n\n");
  if (!text.trim()) {
    throw new Error(`No readable text was found in this .${extension} file.`);
  }
  return text;
}

function isUsefulOpenXmlEntry(name: string, extension: "docx" | "pptx" | "xlsx") {
  if (!name.endsWith(".xml")) return false;
  if (extension === "docx") {
    return /^word\/(document|footnotes|endnotes|header\d+|footer\d+)\.xml$/.test(name);
  }
  if (extension === "pptx") {
    return /^ppt\/slides\/slide\d+\.xml$/.test(name) || /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(name);
  }
  return name === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet\d+\.xml$/.test(name);
}

function openXmlToText(xml: string) {
  return stripMarkup(
    xml
      .replace(/<\/(?:w:p|a:p|row)>/g, "\n")
      .replace(/<\/(?:w:tr|a:tbl|sheetData)>/g, "\n")
      .replace(/<w:tab\/>/g, "\t")
      .replace(/<a:br\/>/g, "\n")
  );
}

function stripMarkup(value: string) {
  return normalizeWhitespace(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  );
}

function normalizeWhitespace(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function readZipEntries(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const entries: ZipEntry[] = [];
  let offset = 0;

  while (offset + 30 < bytes.length) {
    const signature = readUint32(bytes, offset);
    if (signature !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const method = readUint16(bytes, offset + 8);
    const compressedSize = readUint32(bytes, offset + 18);
    const fileNameLength = readUint16(bytes, offset + 26);
    const extraLength = readUint16(bytes, offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + fileNameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > bytes.length) break;

    const name = decodeUtf8(bytes.slice(nameStart, nameStart + fileNameLength));
    if (!name.endsWith("/")) {
      entries.push({
        name,
        method,
        compressed: bytes.slice(dataStart, dataEnd),
      });
    }
    offset = dataEnd;
  }

  return entries;
}

async function inflateZipEntry(entry: ZipEntry) {
  if (entry.method === 0) return entry.compressed;
  if (entry.method !== 8) {
    throw new Error(`Unsupported compression method in ${entry.name}.`);
  }

  const inflated = await inflateBytes(entry.compressed, ["deflate-raw"]);
  if (!inflated) throw new Error("This browser cannot extract Office files. Try a text export or paste the content directly.");
  return inflated;
}

async function extractBestEffortPdfText(buffer: ArrayBuffer) {
  const latin = Array.from(new Uint8Array(buffer), (byte) => String.fromCharCode(byte)).join("");
  const streamText = await extractTextFromPdfStreams(latin);
  const withoutCompressedStreams = latin.replace(/stream[\s\S]*?endstream/g, " ");
  const directText = extractPdfTextOperators(withoutCompressedStreams);
  return normalizeWhitespace([streamText, directText].filter(Boolean).join("\n\n"));
}

async function extractTextFromPdfStreams(pdfText: string) {
  const parts: string[] = [];
  const streamPattern = /(<<[\s\S]*?>>)\s*stream\r?\n?([\s\S]*?)\r?\n?endstream/g;
  const streams = Array.from(pdfText.matchAll(streamPattern));

  for (const [, dictionary, streamBody] of streams) {
    if (!/\/FlateDecode\b/.test(dictionary)) continue;

    const bytes = Uint8Array.from(streamBody, (char) => char.charCodeAt(0) & 0xff);
    const inflated = await inflatePdfStream(bytes).catch(() => null);
    if (!inflated) continue;

    const text = extractPdfTextOperators(decodeUtf8(inflated));
    if (text) parts.push(text);
  }

  return parts.join("\n\n");
}

async function inflatePdfStream(bytes: Uint8Array) {
  return inflateBytes(bytes, ["deflate", "deflate-raw"]);
}

async function inflateBytes(bytes: Uint8Array, formats: string[]) {
  const Decompression = (globalThis as typeof globalThis & { DecompressionStream?: new (format: string) => TransformStream }).DecompressionStream;
  if (!Decompression) return null;

  for (const format of formats) {
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new Decompression(format));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {
      // Try the next deflate flavor.
    }
  }
  return null;
}

function extractPdfTextOperators(value: string) {
  const textBlocks = Array.from(value.matchAll(/BT([\s\S]*?)ET/g), ([, block]) => block);
  const source = textBlocks.length ? textBlocks.join("\n") : value;
  const chunks: string[] = [];

  for (const [, literal] of source.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)) {
    chunks.push(decodePdfLiteral(literal));
  }

  for (const [, arrayBody] of source.matchAll(/\[([\s\S]*?)\]\s*TJ/g)) {
    const literals = Array.from(arrayBody.matchAll(/\((?:\\.|[^\\)])*\)/g), ([literal]) => decodePdfLiteral(literal));
    const hexStrings = Array.from(arrayBody.matchAll(/<([0-9A-Fa-f\s]+)>/g), ([, hex]) => decodePdfHex(hex));
    chunks.push([...literals, ...hexStrings].join(""));
  }

  for (const [, hex] of source.matchAll(/<([0-9A-Fa-f\s]+)>\s*Tj/g)) {
    chunks.push(decodePdfHex(hex));
  }

  return normalizeWhitespace(chunks.join(" "));
}

function decodePdfLiteral(value: string) {
  return value
    .slice(1, -1)
    .replace(/\\([nrtbf()\\])/g, (_, char) => ({ n: "\n", r: "\r", t: "\t", b: "", f: "", "(": "(", ")": ")", "\\": "\\" }[char] || char))
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
}

function decodePdfHex(value: string) {
  const hex = value.replace(/\s+/g, "");
  const bytes = new Uint8Array(Math.floor(hex.length / 2));
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return decodeUtf8(bytes).replace(/\0/g, "");
}

function isReadableExtractedText(text: string) {
  const value = text.trim();
  if (value.length < 80) return false;
  if (/\b(?:endobj|xref|trailer|ReportLab|FlateDecode|obj)\b/i.test(value)) return false;

  const lettersAndNumbers = (value.match(/[A-Za-z0-9]/g) || []).length;
  const suspiciousSymbols = (value.match(/[{}<>[\]\\^~`|]/g) || []).length;
  const replacementChars = (value.match(/\uFFFD/g) || []).length;
  const readableRatio = lettersAndNumbers / Math.max(value.length, 1);
  const symbolRatio = suspiciousSymbols / Math.max(value.length, 1);

  return readableRatio > 0.45 && symbolRatio < 0.08 && replacementChars < 3;
}

function decodeUtf8(bytes: Uint8Array) {
  return new TextDecoder("utf-8").decode(bytes);
}

function readUint16(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUint32(bytes: Uint8Array, offset: number) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}
