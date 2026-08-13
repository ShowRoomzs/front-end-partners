import React from "react"
import ErrorPage from "./ErrorPage"

type Props = { children: React.ReactNode }

export default class ErrorBoundary extends React.Component<Props, { hasError: boolean; error?: Error }>{
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: unknown) {
    // TODO: send to monitoring
    // console.error(error, info)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage error={this.state.error} />
    }

    return this.props.children
  }
}
