import ConversationListItem from "../../Fragments/Chat/ConversationListItem";

// NOTE: Ini hanya untuk sementara sebelum dihubungkan dengan backend
export default function ConversationList() {
  return (
    <div className="overflow-y-auto space-y-1 h-full">
      {[...Array(10)].map((_, index) => (
        <ConversationListItem
          key={index}
          userData={{
            name: `User ${index + 1}`,
            title: `Title ${index + 1}`,
            img: `https://placehold.co/100x100?text=User+${index + 1}`,
          }}
        />
      ))}
    </div>
  );
}