Module.register("unRAID-MMM", {
  defaults: {
    title: null,
    refreshInterval: 60000,
    endpoint: null,
    apiKey: null,
    allowSelfSigned: false,
    graphqlEndpoint: null,
    queries: []
  },

  getStyles() {
    return ["unRAID-MMM.css"]
  },

  start() {
    console.log("[unRAID-MMM] start()")
    // Validate config
    if (!this.config.endpoint || !this.config.apiKey || this.config.queries.length === 0) {
      this.error = "Missing endpoint, apiKey, or queries in config."
      return
    }
    // Our own state variables
    this.unraidData = null // null => loading
    this.error = null

    // Send config to node_helper
    this.sendSocketNotification("UNRAID_CONFIG", this.config)
  },

  socketNotificationReceived(notification, payload) {
    if (notification !== "UNRAID_DATA") return

    console.log("[unRAID-MMM] UNRAID_DATA →", payload)

    if (payload.error) {
      this.error = payload.error
      this.unraidData = null
    } else {
      this.error = null
      this.unraidData = payload
    }

    // Defer until wrapper is inserted
    setTimeout(() => this.updateDom(), 0)
  },

  getDom() {
    const wrapper = document.createElement("div")
    wrapper.className = "unraid-mmm-wrapper"

    // 1) FULL CUSTOM BODY
    if (this.config.customBody) {
      wrapper.innerHTML = this.config.customBody
      return wrapper
    }

    // 2) Module Title
    if (this.config.showTitle) {
      const title = document.createElement("div")
      title.className = "unraid-mmm-title"
      title.innerText = this.config.title
      wrapper.appendChild(title)
    }

    // 3) Loading / errors / data as before
    if (this.error) {
      const err = document.createElement("div")
      err.className = "unraid-mmm-error"
      err.innerText = `Error: ${this.error}`
      wrapper.appendChild(err)
      return wrapper
    }
    if (this.unraidData === null) {
      const loading = document.createElement("div")
      loading.className = "unraid-mmm-loading"
      loading.innerText = "Loading unRAID data…"
      wrapper.appendChild(loading)
      return wrapper
    }

    // 4) Render each query row
    this.config.queries.forEach((q) => {
      const row = document.createElement("div")
      row.className = "unraid-mmm-row"

      // 1) Optional label
      if (q.showLabel !== false && q.label) {
        const lbl = document.createElement("span")
        lbl.className = "unraid-mmm-label"
        lbl.innerText = q.label + ": "
        row.appendChild(lbl)
      }

      // 2) Formatter must run in node_helper so this.unraidData[q.label] already holds the formatted string
      const formatted = this.unraidData[q.label]

      // 3) Render as HTML or plain text
      const valEl = document.createElement("span")
      valEl.className = "unraid-mmm-value"
      if (formatted === undefined) {
        valEl.innerText = "[no data]"
      } else if (q.formatterHTML) {
        valEl.innerHTML = formatted
      } else {
        valEl.innerText = formatted
      }

      row.appendChild(valEl)
      wrapper.appendChild(row)
    })

    return wrapper
  }
})
