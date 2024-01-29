import { FC } from "react";

interface Props {
  onReset: () => void;
}

export const ResetChat: FC<Props> = ({ onReset }) => {
  return (
    <div className="flex flex-row items-center">
      <button
        className="text-xs underline text-neutral-900 font-semibold rounded-lg px-4 py-2 hover:bg-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-300"
        onClick={() => onReset()}
      >
        Reset
      </button>
    </div>
  );
};
;