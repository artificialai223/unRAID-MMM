# MMM-unRAID

**MMM-unRAID** is a MagicMirror² module by [Henry Walter](https://github.com/artificialai223) that fetches live statistics from your unRAID server via its GraphQL API. All raw size values (`fsSize`, `fsFree`, and legacy `capacity.disks.*`) are returned in **KiB** (kibibytes). This module helps you display array health, temperature, state, and capacity with flexible, per-query formatting.

---

## 📦 Installation

\`\`\`bash
cd ~/MagicMirror/modules
git clone https://github.com/artificialai223/MMM-unRAID.git
cd MMM-unRAID
npm install
\`\`\`

---

## 🔧 Configuration

Add this block to your `config/config.js` under `modules:`:

\`\`\`js
{
  module: "unRAID-MMM",
  position: "lower_third",
  classes: "small bright",
  config: {
    title:           "unRAID Array Overview",
    endpoint:        "https://192.168.1.241",
    apiKey:          "<YOUR_API_KEY>",
    allowSelfSigned: true,
    refreshInterval: 60000,
    queries: [
      // Array Health
      {
        label:         "Array Health",
        expr:          "array { disks { status } }",
        formatter:     \`(d) => d.disks.every(x=>x.status==="DISK_OK") ? "HEALTHY" : "DAMAGED"\`,
        formatterHTML: false
      },
      // Array Temperature
      {
        label:         "Array Temperature",
        expr:          "array { disks { temp } }",
        formatter:     \`(d) => {
          const maxT = Math.max(...d.disks.map(x=>x.temp));
          if (maxT >= 60) return \\\`OVERHEATING (\${maxT}°C)\\\`;
          if (maxT >= 50) return \\\`HOT (\${maxT}°C)\\\`;
          return \\\`NOMINAL (\${maxT}°C)\\\`;
        }\`,
        formatterHTML: false
      },
      // Array State
      {
        label:         "Array State",
        expr:          "array { state }",
        formatter:     \`(d) => d.state\`,
        formatterHTML: false
      },
      // Capacity Used (auto‑scaled from KiB → MB/GB/TB)
      {
        label:         "Capacity Used",
        expr:          "array { disks { fsFree fsSize } }",
        formatter:     \`(d) => {
          // raw values in KiB
          const disks       = d.disks;
          const totalFreeMB = disks.reduce((s,x)=>s + x.fsFree/1024, 0);
          const totalSizeMB = disks.reduce((s,x)=>s + x.fsSize/1024, 0);
          const usedMB      = totalSizeMB - totalFreeMB;

          // pick best unit
          if (totalSizeMB >= 1024*1024) {
            return (usedMB/1024/1024).toFixed(1) + " TB";
          }
          if (totalSizeMB >= 1024) {
            return (usedMB/1024).toFixed(1) + " GB";
          }
          return usedMB.toFixed(1) + " MB";
        }\`,
        formatterHTML: false
      },
      // Disks Online
      {
        label:         "Disks Online",
        expr:          "array { disks { status } }",
        formatter:     \`(d) => {
          const arr = Array.isArray(d.disks) ? d.disks : [];
          const ok  = arr.filter(x=>x.status==="DISK_OK").length;
          return \\\`\${ok} / \${arr.length} disks online\\\`;
        }\`,
        formatterHTML: false
      }
    ]
  }
}
\`\`\`

---

## ⚙️ Config Options

| Option             | Type     | Required | Description                                                                  |
|--------------------|----------|----------|------------------------------------------------------------------------------|
| \`endpoint\`         | string   | ✅        | Base URL of your unRAID server (include \`https://\`)                         |
| \`apiKey\`           | string   | ✅        | Your API key (unRAID Settings → Management Access → API Keys)               |
| \`allowSelfSigned\`  | boolean  | ❌        | Set to \`true\` if using a self-signed SSL certificate                        |
| \`refreshInterval\`  | number   | ❌        | Poll interval in ms (default: 60000)                                         |
| \`queries\`          | array    | ✅        | Array of query objects (see below)                                           |

---

### 🧩 Query Object Fields

Each query object may include:

| Field           | Type     | Required | Description                                                                                                 |
|-----------------|----------|----------|-------------------------------------------------------------------------------------------------------------|
| \`label\`         | string   | ✅        | Prefix text for the output                                                                                  |
| \`expr\`          | string   | ✅        | GraphQL selection set (no surrounding \`query {}\`)                                                           |
| \`formatter\`     | string   | ✅        | JavaScript arrow function (as a string) that receives the raw data object and returns a formatted string   |
| \`formatterHTML\` | boolean  | ❌        | When \`true\`, the returned string is injected via \`innerHTML\` (allows tables/HTML).                          |

---

## 📋 Formatter Examples

- **Sizes in TB (KiB → MiB → GiB → TiB)**  
  \`\`\`js
  "(d) => (d.fsFree / 1024 / 1024 / 1024).toFixed(2) + ' TB'"
  \`\`\`
- **Sizes in GB (KiB → MiB → GiB)**  
  \`\`\`js
  "(d) => (d.fsFree / 1024 / 1024).toFixed(1) + ' GB'"
  \`\`\`
- **Explicit conversion (KiB → MB)**  
  \`\`\`js
  "(d) => (d.fsFree / 1024).toFixed(1) + ' MB'"
  \`\`\`
- **Count online disks**  
  \`\`\`js
  \`(d) => {
    const arr = Array.isArray(d.disks)? d.disks : [];
    return \\\`\${arr.filter(x=>x.status==='DISK_OK').length} / \${arr.length} online\\\`;
  }\`
  \`\`\`

---

## 🛠 Troubleshooting

- **“split of undefined” error**  
  - Ensure the module block has both \`module: 'unRAID-MMM'\` and \`position: '...'\`.  
  - Remove any trailing commas or stray braces in your \`config.js\`.  
- **Formatter errors**  
  - Confirm the raw value units are KiB and adjust \`/1024\` divisions accordingly.  
  - Check your arrow‑function syntax; any backtick mismatches will break the parser.

---

## 📜 License

MIT License  
Made with ❤️ by [Henry Walter](https://github.com/artificialai223)  
