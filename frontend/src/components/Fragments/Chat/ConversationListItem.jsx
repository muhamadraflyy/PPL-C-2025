import Avatar from "../../Elements/Common/Avatar";
import Button from "../../Elements/Buttons/Button";
import { Text } from "../../Elements/Text/Text";

// NOTE: Ini hanya untuk sementara sebelum dihubungkan dengan backend
export default function ConversationListItem({ userData }) {
  return (
    <Button variant="neutral" className="w-full rounded-none !justify-start">
      <div className="flex gap-2 justify-start items-center w-full">
        <Avatar
          src={userData.img || "https://placehold.co/200"}
          alt={userData.name || "avatar"}
          size="lg"
        />
        <div className="flex flex-col">
          <Text variant="h2">{userData.name || "Unknown"}</Text>
          <span className="text-sm text-slate-500">{userData.title || ""}</span>
        </div>
      </div>
    </Button>
  );
}
