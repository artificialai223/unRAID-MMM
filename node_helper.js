// modules/unRAID-MMM/node_helper.js
const NodeHelper = require("node_helper")
const https = require("https")
const fetch = require("node-fetch")

module.exports = NodeHelper.create({
  start() {
    console.log("[unRAID-MMM] Node helper started")
    this.interval = null
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "UNRAID_CONFIG") {
      this.config = payload
      this._scheduleFetch()
    }
  },

  _scheduleFetch() {
    if (this.interval) {
      clearInterval(this.interval)
    }
    // Initial fetch
    this.fetchAndSend()
    // Recurrent polls
    this.interval = setInterval(
      () => this.fetchAndSend(),
      this.config.refreshInterval || 60000
    )
  },

  async fetchAndSend() {
    try {
      const data = await this._getUnraidData()
      this.sendSocketNotification("UNRAID_DATA", data)
    } catch (err) {
      console.error("[unRAID-MMM] Error fetching data:", err)
      this.sendSocketNotification("UNRAID_DATA", { error: err.message })
    }
  },

  async _getUnraidData() {
    // Normalize endpoint & build GraphQL URL
    const base = this.config.endpoint.replace(/\/+$/, "")
    const url = this.config.graphqlEndpoint || `${base}/graphql`

    // HTTPS agent for self-signed certs
    const agent = new https.Agent({
      rejectUnauthorized: !this.config.allowSelfSigned
    })

    // Build aliased queries
    const bodyFields = this.config.queries
      .map((q, i) => `q${i}: ${q.expr}`)
      .join("\n")
    const query = `query {\n${bodyFields}\n}`

    // Fetch
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey
      },
      body: JSON.stringify({ query }),
      agent
    })

    if (!resp.ok) {
      throw new Error(`GraphQL request failed: ${resp.status} ${resp.statusText}`)
    }

    const json = await resp.json()
    if (json.errors) {
      throw new Error("GraphQL errors: " + JSON.stringify(json.errors))
    }

    // Apply formatters
    const output = {}
    this.config.queries.forEach((q, i) => {
      const raw = json.data[`q${i}`]
      if (q.formatter && typeof q.formatter === "string") {
        try {
          const fn = new Function("data", `return (${q.formatter})(data)`)
          output[q.label] = fn(raw)
        } catch (e) {
          output[q.label] = `Formatter error: ${e.message}`
        }
      } else {
        output[q.label] = raw
      }
    })

    return output
  }
})
