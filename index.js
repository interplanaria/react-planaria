import React, { Component } from 'react'
import ndjsonStream from "can-ndjson-stream"
export default class Planaria extends Component {
  constructor(props) {
    super(props)
    let { app, query, limit, listen, crawl, token } = props
    if (!app) {
      console.warn('### no appp has been injected')
      app = null
    }
    if (!query) {
      console.warn('### no query injected. using default query')
      query = {
        q: {
          find: { 
            "out.s2": "19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut", 
          },
          sort: { "blk.i": -1 },
        }
      }
    }
    if (!limit) {
      console.warn('### no specified transaction limit. defaulting to 1000')
      limit = 1e3
    }
    this.query = query
    this.query.q.limit = limit
    this.limit = limit
    this.token = token
    this.app = app
    this.doListen = listen
    this.doCrawl = crawl
    this.state = {
      txs: [],
      auth: false,
      status: 'verifying',
      authenticated: false,
      crawled: false,
      stopped: false,
      loading: 0,
      // utils
      getTokenHover: 0.7,
      submitTokenHover: 0.7,
      submitTokenForm: '',
    }
  }
  componentDidMount() {
    this.verify()
  }
  transition(type, status) {
    switch (type) {
      case 'verifying': 
        if (status) {
          if (this.doCrawl) this.crawl()
          else if (this.doListen) {
            this.listen()
            this.run()
          } else {
            this.run()
          }
          
        } else {
          this.authenticate()
        }
        break
      case 'authenticating':
        if (status) {
          if (this.doCrawl) this.crawl()
          else if (this.doListen) {
            this.listen()
            this.run()
          } else {
            this.run()
          }
        } else {
          this.verify()
        }
        break
      case 'crawling': 
        if (this.doListen) this.listen()
        this.run()
        break
      default:
        this.verify()
        break
    }
  }
  async verify() {
    console.log('### verifying token')
    this.setState(state => {
      state.status = 'verifying'
      return state
    })
    let { cookie } = document
    const regex = /token=(.[^;]*)/ig
    const match = regex.exec(cookie)
    let value
    if (match) {
      value = match[1]
    }
    this.check(value)
  }
  async authenticate() {
    console.log('### authenticating')
    this.setState(state => {
      state.status = 'authenticating'
      return state
    })
  }
  async check(token) {
    console.log('### checking token', token)
    const query = {
      q: {
        find: {},
        limit: 0
      }
    }
    const req = {
      method: 'POST',
      headers: {
        'Token': token,
        'Content-type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(query)
    }
    await delay()
    const response = await fetch(`https://txo.bitbus.network/block`, req)
    switch (response.status) {
      case 403:
        console.warn('### token failed. check https://token.planaria.network', token)
        this.transition('verifying', false)
        break
      case 200:
        console.log('### token verified')
        this.token = token
        this.transition('verifying', true)
        break
      default:
        this.transition('verifying', false)
        break
    }
  }
  async submit(e) {
    console.log('### submitting token')
    if(e.keyCode == 13 && e.shiftKey == false) {
      const token = e.target.value
      document.cookie = `token=${token}`
      console.log('### saved token as cookie', token)
      this.verify()
    }
  }
  async crawl() {
    console.log('### crawling')
    this.setState(state => {
      state.status = 'crawling'
      return state
    })
    const response = await fetch(
      `https://txo.bitbus.network/block`, 
      {
        method: 'POST',
        headers: {
          'Token': this.token,
          'Content-type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(this.query)
      })
    const reader = ndjsonStream(response.body).getReader()
    let results = []
    let result
    while (!result || !result.done) {
      result = await reader.read()
      if (!result.done) {
        results.push(result.value)
        this.setState(state => {
          state.loading = state.loading + 1
          return ({ state })
        })
      } else break
    }
    this.setState(state => {
      state.txs = results
      return state
    })
    this.transition('crawling', true)
  }
  async listen() {
    console.log('### listening')
    delete this.query.q.limit
    const b64 = Buffer.from(JSON.stringify(this.query)).toString("base64")
    const evtSource = new EventSource(`https://txo.bitsocket.network/s/${b64}`)
    evtSource.onmessage = e => {
      const data = JSON.parse(e.data)
      if (!this.state.stopped) {
        this.setState(state => {
          const txs = state.txs.concat(data.data)
          state.txs = txs
          return ({ state })
        }) 
      }
    }
  }
  toggle() {
    console.log('### toggling sse endpoint')
    this.setState(state => {
      state.stopped = !state.stopped
      return state
    })
  }
  run() {
    this.setState(state => {
      state.status = 'running'
      return state
    })
  }
  setLimit(limit) {
    this.limit = limit
  }
  setQuery(query) {
    this.query = query
  }
  setToken(token) {
    document.cookie = `token=${token}`
    console.log('### save token to cookie', token)
    this.verify()
  }
  render() {
    let content
    switch (this.state.status) {
      case 'verifying':
        content = (
          <div style={styles.info}>
            {loader()}
            <div style={styles.msg}>{`verifying token...`}</div>
          </div>
        )
        break
      case 'authenticating':
        content = (
          <form style={styles.info  }>
            <textarea 
              onKeyDown={this.submit.bind(this)}
              style={styles.text} 
              minLength={253}
              placeholder="enter your planaria auth token (token.planaria.network)" 
              autoFocus={true}
              onChange={(e) => {
                e.preventDefault()
                const token = e.target.value
                this.setState(state => {
                  state.submitTokenForm = token
                  return state
                })
              }}
            />
            <div>
              <button
                style={
                  Object.assign(
                    { 
                      color: 'white', 
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      opacity: this.state.getTokenHover,
                    }, 
                    styles.link
                  )
                }
                onClick={() => window.open('https://token.planaria.network', '_blank')}
                onMouseEnter={() => {
                  this.setState(state => {
                    state.getTokenHover = 1
                    return state
                  })
                }}
                onMouseLeave={() => {
                  this.setState(state => {
                    this.state.getTokenHover = 0.7
                    return state
                  })
                }}
                >
                GET TOKEN
              </button>
              <button 
                style={Object.assign({ opacity: this.state.submitTokenHover }, styles.link)}
                onClick={() => this.submit({ 
                  keyCode: 13, 
                  shiftKey: false, 
                  target: { value: this.state.submitTokenForm} 
                })}
                onMouseEnter={() => {
                  this.setState(state => {
                    state.submitTokenHover = 1
                    return state
                  })
                }}
                onMouseLeave={() => {
                  this.setState(state => {
                    this.state.submitTokenHover = 0.7
                    return state
                  })
                }} 
                >
                SUBMIT
              </button>
            </div>
          </form>
        )
        break
      case 'crawling':
        content = (
          <div>
            <progress style={{ width: '500' }} max={this.limit} value={this.state.loading}></progress>
            <div style={styles.msg}>{`${this.state.loading} txs out of ${this.limit} loaded`}</div>
          </div>
        )
        break
      case 'running':
        return <this.app txs={this.state.txs} stopped={this.state.stopped} toggle={this.toggle.bind(this)}/>
      default:
        content = <div>error</div>
        break
    }
    return (
      <div style={styles.container}>
        <div style={styles.modal}>
          <img 
            style={{ width: '80px', margin: 20 }} 
            src="https://x.bitfs.network/8adaf2eabeef15866052722809b218d10f963094289e136387e7a1a337416762.out.0.3" 
          />
          {content}
        </div>
      </div>
    )
  }
}
const styles = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: 600,
    height: 300,
    borderRadius: 5,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    strokeDashArray: '10, 20'
  },
  msg: {
    fontFamily: 'roboto',
    margin: 5,
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: true
  },
  link: {
    width: 100,
    textAlign: 'center',
    textDecoration: 'none',
    borderRadius: 5,
    fontFamily: 'roboto',
    margin: 15,
    padding: 5,
  },
  text: { 
    height: '65', 
    width: '500', 
    wordBreak: 'break-all', 
    backgroundColor: 'rgba(0,0,0,0.06)', 
    padding: 10, 
    fontSize: 12, 
    borderColor: 'rgba(0,0,0,0,0)',
    border: 'none',
    outline: 'none',
  },
}
const loader = () => {
  return (
    <svg width="45" height="45" viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" stroke="rgba(0, 0, 0, 0.9)">
      <g fill="none" fillRule="evenodd" transform="translate(1 1)" strokeWidth="2">
        <circle cx="22" cy="22" r="6" strokeOpacity="0">
          <animate attributeName="r"
            begin="1.5s" dur="3s"
            values="6;22"
            calcMode="linear"
            repeatCount="indefinite" />
          <animate attributeName="stroke-opacity"
            begin="1.5s" dur="3s"
            values="1;0" calcMode="linear"
            repeatCount="indefinite" />
          <animate attributeName="stroke-width"
            begin="1.5s" dur="3s"
            values="2;0" calcMode="linear"
            repeatCount="indefinite" />
        </circle>
        <circle cx="22" cy="22" r="6" strokeOpacity="0">
          <animate attributeName="r"
            begin="3s" dur="3s"
            values="6;22"
            calcMode="linear"
            repeatCount="indefinite" />
          <animate attributeName="stroke-opacity"
            begin="3s" dur="3s"
            values="1;0" calcMode="linear"
            repeatCount="indefinite" />
          <animate attributeName="stroke-width"
            begin="3s" dur="3s"
            values="2;0" calcMode="linear"
            repeatCount="indefinite" />
        </circle>
        <circle cx="22" cy="22" r="8">
          <animate attributeName="r"
            begin="0s" dur="1.5s"
            values="6;1;2;3;4;5;6"
            calcMode="linear"
            repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  )
}
const delay = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, 1000)
  })
}