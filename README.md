# MMM-unRAID

**MMM-unRAID** is a MagicMirror² module by [Henry Walter](https://github.com/artificialai223) that displays live system statistics from your unRAID server using its GraphQL API.

It allows you to create flexible queries, customize formatting (including HTML output), and display disk, array, or system-level statistics right on your MagicMirror interface.

---

## 📦 Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/artificialai223/MMM-unRAID.git
cd MMM-unRAID
npm install
```

---

## 🔧 Configuration

Here's an example entry for your `config/config.js`:

```js
{
  module: "unRAID-MMM",
  position: "lower_third",
  config: {
    title: "unRAID Statistics", // Optional overall title
    endpoint: "https://nas.local",
    apiKey: "your_api_key_here",
    allowSelfSigned: true,
    refreshInterval: 60000,
    queries: [
      {
        label: "Free Space",
        showLabel: true,
        expr: "array { capacity { disks { free } } }",
        formatter: "(data) => (data.capacity.disks.free / 1024 / 1024).toFixed(2) + ' TB'",
        formatterHTML: false
      },
      {
        label: "Disk Usage",
        showLabel: false,
        expr: `
          array {
            disks {
              name
              fsFree
              fsSize
              temp
              status
            }
          }
        `,
        formatter: `(data) => {
          let html = '<table class="unraid-mmm-table">';
          html += '<tr><th>Disk</th><th>Free</th><th>Total</th><th>Temp</th><th>Status</th></tr>';
          data.disks.forEach(d => {
            html += '<tr>' +
              '<td>' + d.name + '</td>' +
              '<td>' + (d.fsFree / 1024 / 1024).toFixed(1) + ' TB</td>' +
              '<td>' + (d.fsSize / 1024 / 1024).toFixed(1) + ' TB</td>' +
              '<td>' + d.temp + '°C</td>' +
              '<td>' + d.status + '</td>' +
              '</tr>';
          });
          html += '</table>';
          return html;
        }`,
        formatterHTML: true
      }
    ]
  }
}
```

---

## ⚙️ Config Options

| Option              | Type     | Required | Description                                                                 |
|---------------------|----------|----------|-----------------------------------------------------------------------------|
| `endpoint`          | string   | ✅       | Base URL of your unRAID server including `https://`                        |
| `apiKey`            | string   | ✅       | API key from unRAID dashboard settings                                     |
| `allowSelfSigned`   | boolean  | ❌       | Accept self-signed certs (set to `true` if using local/SSL certs)          |
| `refreshInterval`   | number   | ❌       | Time in ms between polling updates (default: 60000 = 1 minute)             |
| `title`             | string   | ❌       | Optional title shown at top of module                                      |
| `queries`           | array    | ✅       | Array of query config objects (see below)                                  |

---

### 🧩 Query Object Options

Each query defines one rendered section of the module.

| Field            | Type     | Required | Description                                                                 |
|------------------|----------|----------|-----------------------------------------------------------------------------|
| `label`          | string   | ✅       | Label shown before the result                                               |
| `showLabel`      | boolean  | ❌       | Show or hide the label (default: `true`)                                    |
| `expr`           | string   | ✅       | GraphQL selection set (without `query {}` wrapper)                          |
| `formatter`      | string   | ✅       | A stringified JavaScript function that returns a string from query data     |
| `formatterHTML`  | boolean  | ❌       | If `true`, output is treated as raw HTML instead of plain text              |

---

## 🛠 Formatter Examples

Convert bytes to GB:

```js
"(d) => (d.capacity.disks.free / 1024 / 1024).toFixed(1) + ' GB'"
```

Display as HTML table:

```js
`(data) => {
  let html = '<table><tr><th>Disk</th><th>Temp</th></tr>';
  data.disks.forEach(d => {
    html += '<tr><td>' + d.name + '</td><td>' + d.temp + '°C</td></tr>';
  });
  html += '</table>';
  return html;
}`
```

Hide label, show only custom HTML:

```js
{
  label: "Hidden",
  showLabel: false,
  formatterHTML: true,
  expr: "...",
  formatter: "(data) => '<div>My custom block</div>'"
}
```

---

## 🧪 Troubleshooting

- ❌ Nothing renders?
  - Check browser dev console (`F12`) → look for `[unRAID-MMM]` logs
  - Confirm unRAID endpoint and API key
  - Ensure your queries are valid GraphQL syntax

- ❗ GraphQL 400 errors?
  - Use only the selection set in `expr` (no `query { ... }` wrapper)

---

## 📜 License

MIT License

Made with ❤️ by [Henry Walter](https://github.com/artificialai223)
