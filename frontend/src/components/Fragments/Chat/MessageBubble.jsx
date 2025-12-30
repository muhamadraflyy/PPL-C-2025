import { Text } from "../../Elements/Text/Text";

export default function MessageBubble({
  isSender = true,
  className = "",
  timestamp = "",
  isRead = false,
  status = 'sent',
  children: content,
}) {
  // Render status icon (WhatsApp style)
  const renderStatusIcon = () => {
    if (isSender) return null; // Status hanya untuk message yang dikirim sendiri

    if (status === 'sending') {
      // Clock icon - sedang kirim
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white opacity-70">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      );
    }

    if (status === 'sent') {
      // Single checkmark - terkirim ke server
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white opacity-70">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    }

    if (isRead) {
      // Double checkmark blue - sudah dibaca
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2" className="">
          <path d="M18 6 7 17l-5-5" />
          <path d="m22 10-7.5 7.5L13 16" />
        </svg>
      );
    }

    // Double checkmark gray - delivered tapi belum dibaca
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white opacity-70">
        <path d="M18 6 7 17l-5-5" />
        <path d="m22 10-7.5 7.5L13 16" />
      </svg>
    );
  };

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
        {renderStatusIcon()}
      </div>
    </li>
  );
}