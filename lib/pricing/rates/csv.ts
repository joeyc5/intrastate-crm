export function parseCsv(text: string): Record<string, string>[] {
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  const nonEmpty = rows.filter((r) => !(r.length === 1 && r[0] === ""));
  const header = nonEmpty.shift();
  if (!header) return [];
  return nonEmpty.map((cols) => {
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => { obj[h.trim()] = (cols[idx] ?? "").trim(); });
    return obj;
  });
}
