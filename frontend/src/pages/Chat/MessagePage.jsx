import MessageBox from "../../components/Fragments/Chat/MessageBox";
import ConversationList from "../../components/Fragments/Chat/ConversationList";
import Navbar from "../../components/Fragments/Common/Navbar";

export default function MessagesPage() {
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  return (
    <div className="flex flex-col h-screen">
      <Navbar />

      <h1 className="flex-1 px-5 w-full text-xl font-bold">Chat</h1>

      <div className="flex gap-1 p-5 w-full min-h-0">
        <aside className="w-96 min-h-0">
          <ConversationList />
        </aside>

        <MessageBox userData={user} />
      </div>
    </div>
  );
}
