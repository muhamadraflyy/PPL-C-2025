import { Text } from "../../Elements/Text/Text";

export default function MessageBubble({
  isSender = true,
  className = "",
  timestamp = "",
  isRead = false,
  children: content,
}) {
  return (
    <li
      className={
        `${
          isSender
            ? "self-start text-black bg-gray-300"
            : "self-end text-white bg-blue-500"
        } max-w-md px-4 py-3 mb-3 rounded-2xl shadow-sm` + (className ? ' ' + className : '')
      }
    >
      <Text className="break-words whitespace-pre-wrap">{content}</Text>
      <div className="flex gap-2 justify-end items-center mt-1">
        {timestamp && <Text className="text-xs opacity-70">{timestamp}</Text>}
        {!isSender && (
          isRead ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white opacity-70"
            >
              <path d="M18 6 7 17l-5-5" />
              <path d="m22 10-7.5 7.5L13 16" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white opacity-70"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )
        )}
      </div>
    </li>
  );
}