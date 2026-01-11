import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, children, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children)

    return (
      <div
        ref={ref}
        className={cn("inline-flex", className)}
        role="group"
        {...props}
      >
        {childrenArray.map((child, index) => {
          if (!React.isValidElement(child)) return child

          const isFirst = index === 0
          const isLast = index === childrenArray.length - 1
          const isMiddle = !isFirst && !isLast

          return React.cloneElement(child, {
            className: cn(
              (child.props as { className?: string }).className,
              isFirst && "rounded-r-none",
              isLast && "rounded-l-none border-l-0",
              isMiddle && "rounded-none border-l-0"
            ),
          } as Partial<typeof child.props>)
        })}
      </div>
    )
  }
)

ButtonGroup.displayName = "ButtonGroup"

export default ButtonGroup
