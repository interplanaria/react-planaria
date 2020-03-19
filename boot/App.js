import React, { Component } from 'react'
export default class App extends Component {
  constructor(props) {
    super(props)
  }
  render() {
    return (
      <div>{`Number of txs: ${this.props.txs.length}`}</div>
    )
  }
}
