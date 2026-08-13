import React from "react"
import ErrorPage from "./ErrorPage"

type Props = { children: React.ReactNode }

export default class ErrorBoundary extends React.Component<
  Props,
  { hasError: boolean; error?: Error }
> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO: 모니터링 도구 연동. 그 전까지는 콘솔에 남긴다 —
    // 배포 환경에서 화면만 보고는 어떤 컴포넌트가 터졌는지 알 수 없다.
    console.error("[ErrorBoundary]", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage error={this.state.error} />
    }

    return this.props.children
  }
}
