import type { ReactNode } from "react";

interface TableFooterProps {
  renderLeft: ReactNode;
  renderRight: ReactNode;
}

export default function TableFooter(props: TableFooterProps) {
  const { renderLeft, renderRight } = props;

  return (
    <div className="sticky bottom-0 left-0 bg-[#F8F8F8] z-10 p-[15px] w-full flex flex-row items-center justify-between">
      {renderLeft ? renderLeft : <div />}
      {renderRight}
    </div>
  );
}
